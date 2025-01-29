import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CardOperationsDialog } from './CardOperationsDialog';
import type { Card as CardType } from '@/types/focus-zone';

interface DraggableCardProps {
  card: CardType;
}

export const DraggableCard = ({ card }: DraggableCardProps) => {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleDelete = async () => {
    try {
      await supabase
        .from('cards')
        .delete()
        .eq('id', card.id);

      toast({
        title: "Card deleted",
        description: "The card has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <CardOperationsDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        card={card}
      />

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <Card className="bg-card/90 shadow-sm hover:shadow-md rounded-xl p-3 cursor-move border border-foreground/15 group transition-all duration-200">
          <CardHeader className="p-0 flex flex-row items-start justify-between">
            <CardTitle className="text-sm font-medium text-foreground">{card.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          {card.description && (
            <CardContent className="p-0 pt-2">
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
};