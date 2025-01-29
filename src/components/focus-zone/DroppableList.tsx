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
      className="flex-none w-[300px]"
    >
      <div className="bg-white rounded-lg p-4 shadow-md min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">{list.title}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditList(list)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
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
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            size="sm"
            onClick={() => onAddCard(list.id)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add a card
          </Button>
        </div>
      </div>
    </div>
  );
};