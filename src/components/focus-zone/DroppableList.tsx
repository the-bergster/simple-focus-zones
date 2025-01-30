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
  isInDrawer?: boolean;
}

export const DroppableList = ({ 
  list, 
  cards,
  onDeleteList,
  isFirstList = false,
  isInDrawer = false,
}: DroppableListProps) => {
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  
  const { setNodeRef, attributes, listeners } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;

      const data = JSON.parse(rawData);
      
      if (data.type === 'card') {
        const { error } = await supabase
          .from('cards')
          .update({
            list_id: list.id,
            position: cards.length,
          })
          .eq('id', data.card.id);

        if (error) throw error;

        toast({
          title: "Card moved",
          description: "Card has been moved to the list successfully",
        });
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast({
        title: "Error moving card",
        description: error instanceof Error ? error.message : "Failed to move card",
        variant: "destructive",
      });
    }
  };

  // Hide the Don't Forget Box from the main view unless it's in the drawer
  if (list.is_dont_forget_box && !isInDrawer) {
    return null;
  }

  const listClasses = list.is_dont_forget_box 
    ? 'flex-none w-[320px] bg-amber-50/50' 
    : `flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`;

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={listClasses}
      style={{ 
        position: isInDrawer ? 'relative' : undefined,
        zIndex: isInDrawer ? 1002 : undefined,
        pointerEvents: 'auto'
      }}
    >
      <ListContainer
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        isDontForgetBox={list.is_dont_forget_box || false}
      >
        <ListHeader
          listId={list.id}
          title={list.title}
          isFocused={list.is_focused || false}
          onDelete={() => onDeleteList(list.id)}
          isDontForgetBox={list.is_dont_forget_box || false}
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