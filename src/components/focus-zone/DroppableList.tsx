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
      const rawData = e.dataTransfer.getData('text/plain');
      console.log('Drop event received:', e);
      console.log('Raw drop data:', rawData);
      
      if (!rawData) {
        console.error('No data received in drop event');
        return;
      }

      const data = JSON.parse(rawData);
      console.log('Parsed drop data:', data);
      
      if (data.type === 'dont-forget-item') {
        console.log('Processing dont-forget-item drop');
        
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        
        if (!user) {
          console.error('No authenticated user found');
          toast({
            title: "Authentication error",
            description: "You must be logged in to perform this action",
            variant: "destructive",
          });
          return;
        }

        // Get the current number of cards in the list for position
        const position = cards.length;
        console.log('Creating new card in list:', list.id, 'at position:', position);

        // Create a new card in the list
        const { data: newCard, error: cardError } = await supabase
          .from('cards')
          .insert({
            title: data.title,
            description: data.description,
            list_id: list.id,
            position: position,
          })
          .select()
          .single();

        if (cardError) {
          console.error('Card creation error:', cardError);
          toast({
            title: "Error creating card",
            description: cardError.message,
            variant: "destructive",
          });
          return;
        }

        console.log('New card created:', newCard);

        // Delete the item from dont_forget_items
        console.log('Deleting dont-forget-item:', data.id);
        const { error: deleteError } = await supabase
          .from('dont_forget_items')
          .delete()
          .eq('id', data.id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          // If deletion fails, we should remove the card we just created
          if (newCard) {
            console.log('Rolling back card creation...');
            await supabase
              .from('cards')
              .delete()
              .eq('id', newCard.id);
          }
          toast({
            title: "Error deleting item",
            description: deleteError.message,
            variant: "destructive",
          });
          return;
        }

        console.log('Drop operation completed successfully');
        toast({
          title: "Card created",
          description: "Item has been moved to the list successfully",
        });
      } else {
        console.log('Dropped item is not a dont-forget-item:', data);
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
        <div 
          className={`task-list rounded-lg p-4 bg-white/50 backdrop-blur-sm border border-white/20 transition-all duration-200 ${
            isDragOver ? 'ring-2 ring-primary/50 bg-white/80' : ''
          }`}
        >
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