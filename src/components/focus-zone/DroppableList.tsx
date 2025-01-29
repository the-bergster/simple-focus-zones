import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from "lucide-react";
import { DraggableCard } from "./DraggableCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const { toast } = useToast();
  const { setNodeRef } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const handleTitleSubmit = async () => {
    if (editedTitle.trim() === '') {
      toast({
        title: "Invalid title",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      setEditedTitle(list.title);
      setIsEditing(false);
      return;
    }

    if (editedTitle.trim() !== list.title) {
      try {
        const { error } = await supabase
          .from('lists')
          .update({ title: editedTitle.trim() })
          .eq('id', list.id);

        if (error) throw error;

        const updatedList = {
          ...list,
          title: editedTitle.trim()
        };
        
        onEditList(updatedList);

        toast({
          title: "List updated",
          description: "List title has been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating list:', error);
        toast({
          title: "Error updating list",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        setEditedTitle(list.title);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(list.title);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="flex-none w-[320px]"
    >
      <div className="bg-slate-100/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm font-medium"
              autoFocus
            />
          ) : (
            <h3 
              className="font-medium text-sm tracking-tight text-slate-700 cursor-pointer hover:text-slate-900"
              onClick={() => setIsEditing(true)}
            >
              {list.title}
            </h3>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white/95 backdrop-blur-xl border-slate-200/60">
              <DropdownMenuItem 
                onClick={() => setIsEditing(true)}
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