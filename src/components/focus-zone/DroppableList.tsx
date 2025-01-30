import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { DraggableCard } from "./DraggableCard";
import { ListTitle } from "./ListTitle";
import { ListActions } from "./ListActions";
import { CardOperationsDialog } from "./CardOperationsDialog";
import { FloatingActionButton } from "@/components/dont-forget/FloatingActionButton";
import { DontForgetDrawer } from "@/components/dont-forget/DontForgetDrawer";
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
  const [isDontForgetOpen, setIsDontForgetOpen] = useState(false);
  
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  return (
    <>
      <CardOperationsDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        mode="create"
        listId={list.id}
      />

      <DontForgetDrawer 
        isOpen={isDontForgetOpen} 
        onClose={() => setIsDontForgetOpen(false)} 
      />

      <div 
        ref={setNodeRef}
        className={`flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`}
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
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 group"
                  size="sm"
                  onClick={() => setIsCreateCardDialogOpen(true)}
                >
                  <span className="text-sm">Add a card</span>
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  size="sm"
                  onClick={() => setIsDontForgetOpen(true)}
                >
                  <span className="text-sm">Don't Forget Box</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};