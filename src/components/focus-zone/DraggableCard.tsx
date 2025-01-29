import { useSortable } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  created_at: string;
  updated_at: string;
}

interface DraggableCardProps {
  card: Card;
}

export const DraggableCard = ({ card }: DraggableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card className="bg-neutral-50 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_2px_12px_rgb(0,0,0,0.04)] rounded-xl p-3 cursor-move mb-2 border border-neutral-100 group transition-all duration-200">
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-medium text-neutral-700">{card.title}</CardTitle>
        </CardHeader>
        {card.description && (
          <CardContent className="p-0 pt-2">
            <p className="text-xs text-neutral-500">{card.description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};