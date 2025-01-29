import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as z from "zod";

const listFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

interface List {
  id: string;
  title: string;
  position: number;
  focus_zone_id: string;
  created_at: string;
  updated_at: string;
}

export const useListOperations = (focusZoneId: string, onListsChange: (lists: List[]) => void) => {
  const { toast } = useToast();

  const createList = async (data: z.infer<typeof listFormSchema>) => {
    try {
      const { data: lists } = await supabase
        .from('lists')
        .select('*')
        .eq('focus_zone_id', focusZoneId);

      const newPosition = (lists?.length || 0);
      const { data: newList, error } = await supabase
        .from('lists')
        .insert({
          title: data.title,
          position: newPosition,
          focus_zone_id: focusZoneId
        })
        .select()
        .single();

      if (error) throw error;
      
      const updatedLists = [...(lists || []), newList] as List[];
      onListsChange(updatedLists);
      
      toast({
        title: "List created",
        description: "Your new list has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list and all its cards? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      const { data: remainingLists } = await supabase
        .from('lists')
        .select('*')
        .eq('focus_zone_id', focusZoneId)
        .order('position');

      onListsChange(remainingLists as List[] || []);
      
      toast({
        title: "List deleted",
        description: "Your list has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    createList,
    deleteList,
  };
};