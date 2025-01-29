import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ListActions = ({ onEdit, onDelete }: ListActionsProps) => {
  const handleAction = (action: 'edit' | 'delete') => (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'edit') {
      onEdit();
    } else {
      onDelete();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white/95 backdrop-blur-xl border-slate-200/60">
        <DropdownMenuItem 
          onSelect={handleAction('edit')}
          className="text-sm cursor-pointer text-slate-600 hover:text-slate-900 focus:text-slate-900"
        >
          Edit List
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={handleAction('delete')}
          className="text-sm cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
        >
          Delete List
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};