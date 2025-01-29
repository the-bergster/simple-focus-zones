import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow cursor-move mb-2">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          {card.description && (
            <CardDescription className="text-xs">
              {card.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </div>
  );
};