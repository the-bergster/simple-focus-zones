import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Card, List } from '@/types/focus-zone';

export const useDragAndDrop = (cards: Card[], setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const handleDragStart = (event: any) => {
    const draggedCard = cards.find(card => card.id === event.active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  };

  const handleDragOver = (event: any, lists: List[]) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    const overList = lists.find(list => list.id === over.id);
    if (overList) {
      const listCards = cards.filter(card => card.list_id === overList.id);
      const updatedCards = cards.map(card => {
        if (card.id === activeCard.id) {
          return {
            ...card,
            list_id: overList.id,
            position: listCards.length,
          };
        }
        return card;
      });
      setCards(updatedCards);
      return;
    }

    const overCard = cards.find(card => card.id === over.id);
    if (overCard && activeCard.list_id !== overCard.list_id) {
      const updatedCards = cards.map(card => {
        if (card.id === activeCard.id) {
          return {
            ...card,
            list_id: overCard.list_id,
            position: overCard.position,
          };
        }
        return card;
      });
      setCards(updatedCards);
    }
  };

  const handleDragEnd = async (event: any) => {
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
  };

  return {
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};