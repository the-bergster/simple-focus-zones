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
      <Card className="bg-neutral-50 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_2px_12px_rgb(0,0,0,0.04)] rounded-xl p-3 cursor-move mb-2 border border-neutral-100 group transition-all duration-200">
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-medium text-slate-700">{card.title}</CardTitle>
          {card.description && (
            <CardDescription className="text-xs mt-1 text-slate-400">
              {card.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </div>
  );
};