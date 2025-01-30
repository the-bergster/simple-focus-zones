import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { DraggableCard } from "./DraggableCard";
import { ListTitle } from "./ListTitle";
import { ListActions } from "./ListActions";
import { CardOperationsDialog } from "./CardOperationsDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { List, Card } from '@/types/focus-zone';

interface DroppableListProps {
  list: List;
  cards: Card[];
  onDeleteList: (listId: string) => void;
  isFirstList?: boolean;
}

export const DroppableList = ({ 
  list, 
  cards,
  onDeleteList,
  isFirstList = false,
}: DroppableListProps) => {
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      console.log('Dropped data:', data);
      
      if (data.type === 'dont-forget-item') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication error",
            description: "You must be logged in to perform this action",
            variant: "destructive",
          });
          return;
        }

        // Create a new card in the list
        const { data: newCard, error: cardError } = await supabase
          .from('cards')
          .insert({
            title: data.title,
            description: data.description,
            list_id: list.id,
            position: cards.length,
          })
          .select()
          .single();

        if (cardError) {
          console.error('Card creation error:', cardError);
          throw cardError;
        }

        // Delete the item from dont_forget_items
        const { error: deleteError } = await supabase
          .from('dont_forget_items')
          .delete()
          .eq('id', data.id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          // If deletion fails, we should remove the card we just created
          if (newCard) {
            await supabase
              .from('cards')
              .delete()
              .eq('id', newCard.id);
          }
          throw deleteError;
        }

        toast({
          title: "Card created",
          description: "Item has been moved to the list successfully",
        });
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast({
        title: "Error moving item",
        description: error instanceof Error ? error.message : "Failed to move item",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-3">
        <div className={`task-list transition-all duration-200 ${isDragOver ? 'ring-2 ring-primary/50' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <ListTitle
              listId={list.id}
              initialTitle={list.title}
            />
            <ListActions
              listId={list.id}
              isFocused={list.is_focused}
              onDelete={() => onDeleteList(list.id)}
            />
          </div>
          <div className="space-y-3">
            {cards
              .sort((a, b) => a.position - b.position)
              .map(card => (
                <DraggableCard key={card.id} card={card} />
              ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
              size="sm"
              onClick={() => setIsCreateCardDialogOpen(true)}
            >
              <span className="text-sm">Add a card</span>
            </Button>
          </div>
        </div>
      </div>

      <CardOperationsDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        mode="create"
        listId={list.id}
      />
    </div>
  );
};