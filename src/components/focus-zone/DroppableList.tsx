import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'dont-forget-item') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        // Create a new card in the list
        const { error: cardError } = await supabase
          .from('cards')
          .insert({
            title: data.title,
            description: data.description,
            list_id: list.id,
            position: cards.length,
          });

        if (cardError) throw cardError;

        // Delete the item from dont_forget_items
        const { error: deleteError } = await supabase
          .from('dont_forget_items')
          .delete()
          .eq('id', data.id);

        if (deleteError) throw deleteError;

        toast({
          title: "Card moved",
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
    <>
      <CardOperationsDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        mode="create"
        listId={list.id}
      />

      <div 
        ref={setNodeRef}
        className={`flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.opacity = '0.7';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onDrop={(e) => {
          e.currentTarget.style.opacity = '1';
          handleDrop(e);
        }}
      >
        <div className="px-3">
          <div className={`bg-secondary/90 backdrop-blur-xl rounded-2xl p-4 shadow-sm border transition-all duration-300 
            ${list.is_focused 
              ? 'border-primary/50 ring-2 ring-primary/30 shadow-lg shadow-primary/20' 
              : 'border-border/30'} 
            min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar hover:shadow-md`}
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
              <SortableContext
                items={cards.map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                {cards
                  .sort((a, b) => a.position - b.position)
                  .map(card => (
                    <DraggableCard key={card.id} card={card} />
                  ))}
              </SortableContext>
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
      </div>
    </>
  );
};