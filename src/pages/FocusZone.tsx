import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
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
import { CardDialog } from '@/components/focus-zone/CardDialog';
import { useFocusZone } from '@/hooks/useFocusZone';
import { useListOperations } from '@/hooks/useListOperations';
import { useCardOperations } from '@/hooks/useCardOperations';
import { useToast } from "@/hooks/use-toast";
import { WarningDialog } from "@/components/ui/warning-dialog";

interface List {
  id: string;
  title: string;
  position: number;
  focus_zone_id: string;
  created_at: string;
  updated_at: string;
  is_focused: boolean | null;
}

const FocusZone = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize all state hooks at the top level
  const [deleteListWarningOpen, setDeleteListWarningOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  
  const {
    focusZone,
    lists,
    cards,
    loading,
    setCards,
    setLists,
  } = useFocusZone(id);

  const {
    createList,
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

  const handleAddList = async () => {
    const defaultTitle = "New List";
    await createList({ title: defaultTitle });
  };

  const handleDeleteListClick = (listId: string) => {
    setListToDelete(listId);
    setDeleteListWarningOpen(true);
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList(listId);
      setDeleteListWarningOpen(false);
      setListToDelete(null);
    } catch (error) {
      toast({
        title: "Error deleting list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

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

  const AddListButton = () => (
    <button
      onClick={handleAddList}
      className="flex-none w-[320px] h-[100px] bg-black/5 hover:bg-black/10 rounded-2xl flex items-center justify-center gap-2 text-black/50 hover:text-black/70 transition-all group"
    >
      <Plus className="h-5 w-5 transition-all group-hover:scale-110" />
      <span className="text-sm font-medium">Add another list</span>
    </button>
  );

  useEffect(() => {
    const channel = supabase
      .channel('lists-focus-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists'
        },
        () => {
          // Refetch lists when any changes occur
          fetchLists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

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
        <div className="max-w-[1800px] mx-auto w-full">
          <div className="flex items-center justify-between px-6 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {focusZone?.title}
            </h1>
          </div>
        </div>
      </div>

      <CardDialog
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        onSubmit={createCard}
      />

      <WarningDialog
        open={deleteListWarningOpen}
        onOpenChange={setDeleteListWarningOpen}
        title="Delete List"
        description="Are you sure you want to delete this list? All cards in this list will be permanently deleted."
        confirmText="Delete"
        onConfirm={() => {
          if (listToDelete) {
            handleDeleteList(listToDelete);
          }
        }}
      />

      <div className="pt-24 w-full">
        <div className="max-w-[1800px] mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)] items-start fade-scrollbar">
              {lists.map((list, index) => (
                <DroppableList
                  key={list.id}
                  list={list}
                  cards={cards.filter(card => card.list_id === list.id)}
                  onDeleteList={handleDeleteListClick}
                  onAddCard={(listId) => {
                    setActiveListId(listId);
                    setIsCardDialogOpen(true);
                  }}
                  isFirstList={index === 0}
                />
              ))}
              <button
                onClick={handleAddList}
                className="flex-none w-[320px] h-[100px] bg-black/5 hover:bg-black/10 rounded-2xl flex items-center justify-center gap-2 text-black/50 hover:text-black/70 transition-all group"
              >
                <Plus className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="text-sm font-medium">Add another list</span>
              </button>
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
