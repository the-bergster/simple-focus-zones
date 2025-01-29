import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DraggableCard } from "./DraggableCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4 group">
          <h3 className="font-medium text-sm tracking-tight text-slate-800">{list.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white/95 backdrop-blur-xl border-slate-200/60">
              <DropdownMenuItem 
                onClick={() => onEditList(list)}
                className="text-sm cursor-pointer text-slate-600 hover:text-slate-900 focus:text-slate-900"
              >
                Edit List
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteList(list.id)}
                className="text-sm cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
              >
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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