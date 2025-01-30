import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { DroppableList } from "../focus-zone/DroppableList";
import type { List, Card } from '@/types/focus-zone';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export function DontForgetDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [dontForgetList, setDontForgetList] = useState<List | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    if (isOpen) {
      fetchDontForgetList();
    }
  }, [isOpen]);

  const fetchDontForgetList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: lists, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('is_dont_forget_box', true)
        .single();

      if (listError) throw listError;
      
      setDontForgetList(lists);

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('list_id', lists.id)
        .order('position');

      if (cardsError) throw cardsError;
      setCards(cardsData || []);
    } catch (error) {
      toast({
        title: "Error fetching items",
        description: error instanceof Error ? error.message : "Failed to fetch items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const draggedCard = cards.find(card => card.id === active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  };

  const handleDragEnd = () => {
    setActiveCard(null);
  };

  // Dummy function since we can't delete the Don't Forget Box
  const handleDeleteList = () => {};

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-xl"
        style={{ 
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
      >
        <SheetHeader>
          <SheetTitle>Don't Forget Box</SheetTitle>
        </SheetHeader>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div 
            className="mt-8 h-[calc(100vh-300px)] overflow-y-auto pr-2"
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !dontForgetList ? (
              <p className="text-center text-muted-foreground">
                No Don't Forget Box found
              </p>
            ) : (
              <DroppableList
                list={dontForgetList}
                cards={cards}
                onDeleteList={handleDeleteList}
                isInDrawer={true}
              />
            )}
          </div>
          
          <DragOverlay>
            {activeCard ? (
              <div className="p-4 bg-white rounded-lg shadow-lg border">
                <h3 className="text-sm font-medium">{activeCard.title}</h3>
                {activeCard.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCard.description}
                  </p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </SheetContent>
    </Sheet>
  );
}