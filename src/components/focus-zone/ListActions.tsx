import { useState } from 'react';
import { MoreHorizontal, Trash2, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ListActionsProps {
  listId: string;
  isFocused: boolean | null;
  onDelete: () => void;
}

export const ListActions = ({ listId, isFocused, onDelete }: ListActionsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (action: 'delete' | 'focus') => {
    try {
      if (action === 'delete') {
        onDelete();
      } else if (action === 'focus') {
        const { error } = await supabase.rpc('toggle_list_focus', {
          list_id_param: listId
        });

        if (error) throw error;

        // Fetch the updated list to get the new focus state
        const { data: updatedList, error: fetchError } = await supabase
          .from('lists')
          .select('is_focused')
          .eq('id', listId)
          .single();

        if (fetchError) throw fetchError;

        toast({
          title: updatedList.is_focused ? "List focused" : "List unfocused",
          description: updatedList.is_focused ? "List has been focused." : "List has been unfocused.",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => handleAction('focus')}
          className="cursor-pointer"
        >
          <Focus className="mr-2 h-4 w-4" />
          <span>{isFocused ? 'Unfocus' : 'Focus'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction('delete')}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};