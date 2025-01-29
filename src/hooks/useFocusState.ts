import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseFocusStateProps {
  listId: string;
  initialFocusState: boolean | null;
}

export const useFocusState = ({ listId, initialFocusState }: UseFocusStateProps) => {
  const { toast } = useToast();
  const [isFocused, setIsFocused] = useState(initialFocusState);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsFocused(initialFocusState);
  }, [initialFocusState]);

  const toggleFocus = async () => {
    try {
      setIsUpdating(true);
      const newFocusState = !isFocused;
      setIsFocused(newFocusState); // Optimistic update

      const { error } = await supabase.rpc('toggle_list_focus', {
        list_id_param: listId
      });

      if (error) {
        setIsFocused(!newFocusState); // Revert on error
        throw error;
      }

      toast({
        title: newFocusState ? "List focused" : "List unfocused",
        description: newFocusState ? "List has been focused." : "List has been unfocused.",
      });
    } catch (error) {
      console.error('Error toggling focus:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isFocused,
    isUpdating,
    toggleFocus
  };
};