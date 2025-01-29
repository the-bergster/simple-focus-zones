import { useState, useEffect } from 'react';
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
  const [localIsFocused, setLocalIsFocused] = useState(isFocused);

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsFocused(isFocused);
  }, [isFocused]);

  const handleAction = async (action: 'delete' | 'focus') => {
    try {
      if (action === 'delete') {
        onDelete();
      } else if (action === 'focus') {
        // Update local state immediately for better UX
        const newFocusState = !localIsFocused;
        setLocalIsFocused(newFocusState);
        
        const { error } = await supabase.rpc('toggle_list_focus', {
          list_id_param: listId
        });

        if (error) {
          // Revert local state if there's an error
          setLocalIsFocused(!newFocusState);
          throw error;
        }

        toast({
          title: newFocusState ? "List focused" : "List unfocused",
          description: newFocusState ? "List has been focused." : "List has been unfocused.",
        });

        // Fetch the updated state from the server to ensure consistency
        const { data: updatedList, error: fetchError } = await supabase
          .from('lists')
          .select('is_focused')
          .eq('id', listId)
          .single();

        if (fetchError) {
          console.error('Error fetching updated focus state:', fetchError);
          return;
        }

        if (updatedList) {
          setLocalIsFocused(updatedList.is_focused);
        }
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
          <span>{localIsFocused ? 'Unfocus' : 'Focus'}</span>
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