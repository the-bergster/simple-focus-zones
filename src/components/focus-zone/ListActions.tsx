import { useState } from 'react';
import { MoreHorizontal, Trash2, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFocusState } from "@/hooks/useFocusState";

interface ListActionsProps {
  listId: string;
  isFocused: boolean | null;
  onDelete: () => void;
}

export const ListActions = ({ listId, isFocused, onDelete }: ListActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFocused: localIsFocused, toggleFocus } = useFocusState({
    listId,
    initialFocusState: isFocused
  });

  const handleAction = async (action: 'delete' | 'focus') => {
    try {
      if (action === 'delete') {
        onDelete();
      } else if (action === 'focus') {
        await toggleFocus();
      }
    } catch (error) {
      console.error('Error:', error);
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