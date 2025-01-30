import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CardOperationsDialog } from "./CardOperationsDialog";
import { ListContainer } from "./ListContainer";
import { ListHeader } from "./ListHeader";
import { ListCards } from "./ListCards";
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
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) {
        console.error('No data received in drop event');
        return;
      }

      const data = JSON.parse(rawData);
      console.log('Drop data:', data);
      
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

        // Create new card
        const { error: cardError } = await supabase
          .from('cards')
          .insert({
            title: data.title,
            description: data.description,
            list_id: list.id,
            position: cards.length,
          });

        if (cardError) throw cardError;

        // Delete dont-forget item
        const { error: deleteError } = await supabase
          .from('dont_forget_items')
          .delete()
          .eq('id', data.id);

        if (deleteError) throw deleteError;

        toast({
          title: "Item moved",
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

  return (
    <div 
      ref={setNodeRef}
      className={`flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`}
    >
      <ListContainer
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ListHeader
          listId={list.id}
          title={list.title}
          isFocused={list.is_focused || false}
          onDelete={() => onDeleteList(list.id)}
        />
        <ListCards
          cards={cards}
          onAddCard={() => setIsCreateCardDialogOpen(true)}
        />
      </ListContainer>

      <CardOperationsDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        mode="create"
        listId={list.id}
      />
    </div>
  );
};