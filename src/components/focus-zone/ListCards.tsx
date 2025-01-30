import { Button } from "@/components/ui/button";
import { DraggableCard } from "./DraggableCard";
import type { Card } from "@/types/focus-zone";

interface ListCardsProps {
  cards: Card[];
  onAddCard: () => void;
}

export const ListCards = ({ cards, onAddCard }: ListCardsProps) => {
  return (
    <div className="space-y-3">
      {cards
        .sort((a, b) => a.position - b.position)
        .map(card => (
          <DraggableCard key={card.id} card={card} />
        ))}
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
        size="sm"
        onClick={onAddCard}
      >
        <span className="text-sm">Add a card</span>
      </Button>
    </div>
  );
};