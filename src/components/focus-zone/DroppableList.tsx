import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Edit, Trash, PlusCircle } from "lucide-react";
import { DraggableCard } from "./DraggableCard";

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

  return (
    <div 
      ref={setNodeRef}
      className="flex-none w-[320px]"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-white/20 min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm tracking-tight">{list.title}</h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEditList(list)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive/50 hover:text-destructive"
              onClick={() => onDeleteList(list.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
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
            className="w-full justify-start text-muted-foreground hover:text-foreground group"
            size="sm"
            onClick={() => onAddCard(list.id)}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            Add a card
          </Button>
        </div>
      </div>
    </div>
  );
};