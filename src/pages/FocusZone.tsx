import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { CardDialog } from '@/components/focus-zone/CardDialog';
import { ListsContainer } from '@/components/focus-zone/ListsContainer';
import { WarningDialog } from "@/components/ui/warning-dialog";
import { useFocusZone } from '@/hooks/useFocusZone';
import { useListOperations } from '@/hooks/useListOperations';
import { useCardOperations } from '@/hooks/useCardOperations';
import { useToast } from "@/hooks/use-toast";
import type { Card } from '@/types/focus-zone';

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
    refetch,
  } = useFocusZone(id);

  const [deleteListWarningOpen, setDeleteListWarningOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  
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
          <ListsContainer
            lists={lists}
            cards={cards}
            onAddList={handleAddList}
            onDeleteList={handleDeleteListClick}
            onAddCard={(listId) => {
              setActiveListId(listId);
              setIsCardDialogOpen(true);
            }}
            onDragStart={(event) => {
              const draggedCard = cards.find(card => card.id === event.active.id);
              if (draggedCard) {
                setActiveCard(draggedCard);
              }
            }}
            onDragOver={(event) => {
              const { active, over } = event;
              if (!over) return;

              const activeCard = cards.find(card => card.id === active.id);
              if (!activeCard) return;

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
                      position: listCards.length,
                    };
                  }
                  
                  return newCards;
                });
                return;
              }

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
            }}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (!over) return;

              const activeCard = cards.find(card => card.id === active.id) as Card;
              if (!activeCard) return;

              try {
                let newListId = activeCard.list_id;
                let newPosition = activeCard.position;

                const overList = lists.find(list => list.id === over.id);
                const overCard = cards.find(card => card.id === over.id);

                if (overList) {
                  newListId = overList.id;
                  const listCards = cards.filter(card => card.list_id === overList.id);
                  newPosition = listCards.length;
                } else if (overCard) {
                  newListId = overCard.list_id;
                  newPosition = overCard.position;
                }

                await supabase
                  .from('cards')
                  .update({ 
                    list_id: newListId,
                    position: newPosition
                  })
                  .eq('id', activeCard.id);

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
            }}
            activeCard={activeCard}
          />
        </div>
      </div>
    </div>
  );
};

export default FocusZone;