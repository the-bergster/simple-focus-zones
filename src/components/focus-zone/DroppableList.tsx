import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { DraggableCard } from "./DraggableCard";
import { ListTitle } from "./ListTitle";
import { ListActions } from "./ListActions";

interface List {
  id: string;
  title: string;
  position: number;
  focus_zone_id: string;
  created_at: string;
  updated_at: string;
  is_focused: boolean | null;
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  created_at: string;
  updated_at: string;
}

interface DroppableListProps {
  list: List;
  cards: Card[];
  onDeleteList: (listId: string) => void;
  onAddCard: (listId: string) => void;
  isFirstList?: boolean;
}

export const DroppableList = ({ 
  list, 
  cards,
  onDeleteList,
  onAddCard,
  isFirstList = false,
}: DroppableListProps) => {
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-none w-[320px] ${isFirstList ? 'ml-6' : ''}`}
    >
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
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 group mt-2"
            size="sm"
            onClick={() => onAddCard(list.id)}
          >
            <span className="text-sm">Add a card</span>
          </Button>
        </div>
      </div>
    </div>
  );
};