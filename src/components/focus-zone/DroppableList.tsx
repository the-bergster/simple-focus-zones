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
  onEditList: (list: List) => void;
  onDeleteList: (listId: string) => void;
  onAddCard: (listId: string) => void;
}

export const DroppableList = ({ 
  list, 
  cards,
  onEditList,
  onDeleteList,
  onAddCard,
}: DroppableListProps) => {
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const handleTitleUpdate = (newTitle: string) => {
    // This is just for local state update, not for opening the modal
    onEditList({
      ...list,
      title: newTitle
    });
  };

  return (
    <div 
      ref={setNodeRef}
      className="flex-none w-[320px]"
    >
      <div className="bg-slate-100/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <ListTitle
            listId={list.id}
            initialTitle={list.title}
            onTitleUpdate={handleTitleUpdate}
          />
          <ListActions
            onEdit={() => onEditList(list)}
            onDelete={() => onDeleteList(list.id)}
          />
        </div>
        <div className="space-y-2">
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
            className="w-full justify-start text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 group"
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