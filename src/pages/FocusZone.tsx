import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, ArrowLeft } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from "@/integrations/supabase/client";
import { DroppableList } from '@/components/focus-zone/DroppableList';
import { ListDialog } from '@/components/focus-zone/ListDialog';
import { CardDialog } from '@/components/focus-zone/CardDialog';
import { useFocusZone } from '@/hooks/useFocusZone';
import { useListOperations } from '@/hooks/useListOperations';
import { useCardOperations } from '@/hooks/useCardOperations';
import { useToast } from "@/hooks/use-toast";

const FocusZone = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    focusZone,
    lists,
    cards,
    loading,
    setCards,
    setLists,
  } = useFocusZone(id);

  const {
    isListDialogOpen,
    setIsListDialogOpen,
    editingList,
    setEditingList,
    createList,
    updateList,
    deleteList,
  } = useListOperations(id!, setLists);

  const {
    isCardDialogOpen,
    setIsCardDialogOpen,
    activeListId,
    setActiveListId,
    activeCard,
    setActiveCard,
    createCard,
  } = useCardOperations(setCards);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedCard = cards.find(card => card.id === active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    // Handle dropping on a list
    const overList = lists.find(list => list.id === over.id);
    if (overList) {
      setCards(prevCards => {
        const newCards = [...prevCards];
        const activeIndex = newCards.findIndex(card => card.id === activeCard.id);
        
        if (activeIndex !== -1) {
          const listCards = newCards.filter(card => card.list_id === overList.id);
          newCards[activeIndex] = {
            ...newCards[activeIndex],
            list_id: overList.id,
            position: listCards.length, // Put at the end of the list
          };
        }
        
        return newCards;
      });
      return;
    }

    // Handle dropping on another card
    const overCard = cards.find(card => card.id === over.id);
    if (overCard && activeCard.list_id !== overCard.list_id) {
      setCards(prevCards => {
        const newCards = [...prevCards];
        const activeIndex = newCards.findIndex(card => card.id === activeCard.id);
        
        if (activeIndex !== -1) {
          newCards[activeIndex] = {
            ...newCards[activeIndex],
            list_id: overCard.list_id,
            position: overCard.position,
          };
        }
        
        return newCards;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    try {
      let newListId = activeCard.list_id;
      let newPosition = activeCard.position;

      const overList = lists.find(list => list.id === over.id);
      const overCard = cards.find(card => card.id === over.id);

      if (overList) {
        // Dropping on a list
        newListId = overList.id;
        const listCards = cards.filter(card => card.list_id === overList.id);
        newPosition = listCards.length;
      } else if (overCard) {
        // Dropping on another card
        newListId = overCard.list_id;
        
        if (activeCard.list_id === overCard.list_id) {
          // Reordering within the same list
          const listCards = cards
            .filter(card => card.list_id === overCard.list_id)
            .sort((a, b) => a.position - b.position);

          const oldIndex = listCards.findIndex(card => card.id === activeCard.id);
          const newIndex = listCards.findIndex(card => card.id === overCard.id);

          // Update positions for all affected cards
          const updates = listCards.map((card, index) => {
            if (oldIndex < newIndex) {
              // Moving down
              if (index >= oldIndex && index <= newIndex) {
                const newPos = index === newIndex ? oldIndex : index - 1;
                return supabase
                  .from('cards')
                  .update({ position: newPos })
                  .eq('id', card.id);
              }
            } else {
              // Moving up
              if (index >= newIndex && index <= oldIndex) {
                const newPos = index === newIndex ? oldIndex : index + 1;
                return supabase
                  .from('cards')
                  .update({ position: newPos })
                  .eq('id', card.id);
              }
            }
            return null;
          }).filter(Boolean);

          await Promise.all(updates);
          
          // Update local state
          setCards(prevCards => {
            const newCards = [...prevCards];
            if (oldIndex < newIndex) {
              // Moving down
              newCards.forEach(card => {
                if (card.list_id === overCard.list_id) {
                  if (card.id === activeCard.id) {
                    card.position = newIndex;
                  } else if (card.position > oldIndex && card.position <= newIndex) {
                    card.position--;
                  }
                }
              });
            } else {
              // Moving up
              newCards.forEach(card => {
                if (card.list_id === overCard.list_id) {
                  if (card.id === activeCard.id) {
                    card.position = newIndex;
                  } else if (card.position >= newIndex && card.position < oldIndex) {
                    card.position++;
                  }
                }
              });
            }
            return newCards;
          });

          toast({
            title: "Card reordered",
            description: "Card position has been updated.",
          });
          
          setActiveCard(null);
          setActiveListId(null);
          return;
        } else {
          // Moving to a different list
          newPosition = overCard.position;
          
          // Shift cards in the target list
          const targetListCards = cards
            .filter(card => card.list_id === overCard.list_id)
            .sort((a, b) => a.position - b.position);

          const updates = targetListCards.map((card, index) => {
            if (index >= newPosition) {
              return supabase
                .from('cards')
                .update({ position: index + 1 })
                .eq('id', card.id);
            }
            return null;
          }).filter(Boolean);

          updates.push(
            supabase
              .from('cards')
              .update({ list_id: newListId, position: newPosition })
              .eq('id', activeCard.id)
          );

          await Promise.all(updates);

          // Update local state
          setCards(prevCards => {
            const newCards = [...prevCards];
            newCards.forEach(card => {
              if (card.list_id === newListId && card.position >= newPosition) {
                card.position++;
              }
              if (card.id === activeCard.id) {
                card.list_id = newListId;
                card.position = newPosition;
              }
            });
            return newCards;
          });
        }
      }

      toast({
        title: "Card moved",
        description: "Card has been moved successfully.",
      });
    } catch (error) {
      console.error('Error moving card:', error);
      toast({
        title: "Error moving card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }

    setActiveCard(null);
    setActiveListId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{focusZone?.title}</h1>
                {focusZone?.description && (
                  <p className="text-sm text-muted-foreground">{focusZone.description}</p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => {
                setEditingList(null);
                setIsListDialogOpen(true);
              }} 
              size="sm"
              className="bg-black text-white hover:bg-black/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add List
            </Button>
          </div>
        </div>
      </div>

      <ListDialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        editingList={editingList}
        onSubmit={editingList ? updateList : createList}
      />

      <CardDialog
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        onSubmit={createCard}
      />

      <div className="pt-24 px-8 pb-8">
        <div className="max-w-full mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)] items-start">
              {lists.map((list) => (
                <DroppableList
                  key={list.id}
                  list={list}
                  cards={cards.filter(card => card.list_id === list.id)}
                  onEditList={(list) => {
                    setEditingList(list);
                    setIsListDialogOpen(true);
                  }}
                  onDeleteList={deleteList}
                  onAddCard={(listId) => {
                    setActiveListId(listId);
                    setIsCardDialogOpen(true);
                  }}
                />
              ))}
              {lists.length === 0 && (
                <div className="flex items-center justify-center w-full">
                  <Card className="w-[320px] bg-white/80 backdrop-blur-xl border border-white/20">
                    <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
                      <CardDescription>No lists yet</CardDescription>
                      <Button 
                        onClick={() => setIsListDialogOpen(true)} 
                        variant="secondary" 
                        size="sm"
                        className="bg-black text-white hover:bg-black/90"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First List
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            <DragOverlay>
              {activeCard ? (
                <Card className="w-[300px] bg-white shadow-lg rounded-xl border border-white/20">
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium">{activeCard.title}</h3>
                    {activeCard.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeCard.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default FocusZone;