import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DroppableList } from './DroppableList';
import type { List, Card as CardType } from '@/types/focus-zone';

interface ListsContainerProps {
  lists: List[];
  cards: CardType[];
  onAddList: () => void;
  onDeleteList: (listId: string) => void;
  onAddCard: (listId: string) => void;
  onDragStart: (event: any) => void;
  onDragOver: (event: any) => void;
  onDragEnd: (event: any) => void;
  activeCard: CardType | null;
}

export const ListsContainer = ({
  lists,
  cards,
  onAddList,
  onDeleteList,
  onAddCard,
  onDragStart,
  onDragOver,
  onDragEnd,
  activeCard
}: ListsContainerProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-6 overflow-x-auto min-h-[calc(100vh-8rem)] fade-scrollbar pt-3">
        {lists.map((list, index) => (
          <DroppableList
            key={list.id}
            list={list}
            cards={cards.filter(card => card.list_id === list.id)}
            onDeleteList={onDeleteList}
            onAddCard={() => onAddCard(list.id)}
            isFirstList={index === 0}
          />
        ))}
        <button
          onClick={onAddList}
          className="flex-none w-[320px] bg-black/5 hover:bg-black/10 rounded-2xl flex items-center justify-center gap-2 text-black/50 hover:text-black/70 transition-all group h-[156px]"
        >
          <Plus className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="text-sm font-medium">Add another list</span>
        </button>
      </div>
      <DragOverlay>
        {activeCard ? (
          <Card className="w-[300px] bg-white shadow-lg rounded-xl border border-white/20">
            <CardContent className="p-3">
              <h3 className="text-sm font-medium">{activeCard.title}</h3>
              {activeCard.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activeCard.description}
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};