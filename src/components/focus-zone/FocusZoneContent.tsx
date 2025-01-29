import { useState } from 'react';
import { CardDialog } from '@/components/focus-zone/CardDialog';
import { ListsContainer } from '@/components/focus-zone/ListsContainer';
import { WarningDialog } from "@/components/ui/warning-dialog";
import { useListOperations } from '@/hooks/useListOperations';
import { useCardOperations } from '@/hooks/useCardOperations';
import { useDragAndDrop } from './hooks/useDragAndDrop';
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
    createCard,
  } = useCardOperations(setCards);

  const {
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop(cards, lists, setCards);

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
      console.error('Error deleting list:', error);
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
        onDragStart={handleDragStart}
        onDragOver={(event) => handleDragOver(event, lists)}
        onDragEnd={handleDragEnd}
        activeCard={activeCard}
      />
    </>
  );
};