import { Button } from "@/components/ui/button";
import { MoreHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MouseEvent } from "react";

interface ListActionsProps {
  listId: string;
  isFocused: boolean;
  onDelete: () => void;
}

export const ListActions = ({ listId, isFocused, onDelete }: ListActionsProps) => {
  const { toast } = useToast();

  const handleAction = (action: 'delete' | 'toggle-focus') => async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'delete') {
      onDelete();
    } else if (action === 'toggle-focus') {
      try {
        const { error } = await supabase.rpc('toggle_list_focus', {
          list_id_param: listId
        });

        if (error) throw error;

        toast({
          title: isFocused ? "Focus mode disabled" : "Focus mode enabled",
          description: isFocused 
            ? "The list is no longer in focus mode" 
            : "The list is now in focus mode",
        });
      } catch (error) {
        console.error('Error toggling focus:', error);
        toast({
          title: "Error toggling focus mode",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${isFocused ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        onClick={handleAction('toggle-focus')}
      >
        {isFocused ? (
          <ToggleRight className="h-4 w-4" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
      </Button>
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
            onSelect={handleAction('delete')}
            className="text-sm cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
          >
            Delete List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};