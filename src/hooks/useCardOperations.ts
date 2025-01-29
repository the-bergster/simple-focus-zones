import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as z from "zod";

const cardFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  created_at: string;
  updated_at: string;
}

export const useCardOperations = (setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const createCard = async (data: z.infer<typeof cardFormSchema>) => {
    if (!activeListId) return;

    try {
      // First get all cards for the active list to determine the new position
      const { data: existingCards } = await supabase
        .from('cards')
        .select('*')
        .eq('list_id', activeListId)
        .order('position');

      const newPosition = (existingCards?.length || 0);

      // Create the new card
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          title: data.title,
          description: data.description || null,
          position: newPosition,
          list_id: activeListId,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch all cards to ensure we have the latest state
      const { data: allCards } = await supabase
        .from('cards')
        .select('*')
        .order('position');

      if (allCards) {
        setCards(allCards);
      }

      setIsCardDialogOpen(false);
      setActiveListId(null);
      
      toast({
        title: "Card created",
        description: "Your new card has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    isCardDialogOpen,
    setIsCardDialogOpen,
    activeListId,
    setActiveListId,
    activeCard,
    setActiveCard,
    createCard,
  };
};