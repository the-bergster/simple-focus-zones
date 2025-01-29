import { useState } from 'react';
import { CardDialog } from '@/components/focus-zone/CardDialog';
import { ListsContainer } from '@/components/focus-zone/ListsContainer';
import { WarningDialog } from "@/components/ui/warning-dialog";
import { useListOperations } from '@/hooks/useListOperations';
import { useCardOperations } from '@/hooks/useCardOperations';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Card, List } from '@/types/focus-zone';

interface FocusZoneContentProps {
  focusZoneId: string;
  lists: List[];
  cards: Card[];
  setLists: (lists: List[]) => void;
  setCards: (cards: Card[]) => void;
}

export const FocusZoneContent = ({
  focusZoneId,
  lists,
  cards,
  setLists,
  setCards,
}: FocusZoneContentProps) => {
  const { toast } = useToast();
  const [deleteListWarningOpen, setDeleteListWarningOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  
  const {
    createList,
    deleteList,
  } = useListOperations(focusZoneId, setLists);

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

  return (
    <>
      <CardDialog
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        onSubmit={createCard}
      />

      <WarningDialog
        open={deleteListWarningOpen}
        onOpenChange={setDeleteListWarningOpen}
        title="Delete List"
        description="Are you sure you want to delete this list and all its cards? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          if (listToDelete) {
            handleDeleteList(listToDelete);
          }
        }}
      />

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
    </>
  );
};