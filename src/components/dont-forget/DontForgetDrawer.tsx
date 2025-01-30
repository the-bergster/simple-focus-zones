import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Card as CardType } from '@/types/focus-zone';

export function DontForgetDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dontForgetList, setDontForgetList] = useState<{ id: string } | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchDontForgetList();
    }
  }, [isOpen]);

  const fetchDontForgetList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get the don't forget box list
      const { data: lists, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('is_dont_forget_box', true)
        .single();

      if (listError) throw listError;
      
      setDontForgetList(lists);

      // Get all cards in the don't forget box
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dontForgetList) return;

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('cards')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          list_id: dontForgetList.id,
          position: cards.length,
        });

      if (error) throw error;

      toast({
        title: "Item added",
        description: "Your item has been added to the Don't Forget Box",
      });

      setTitle("");
      setDescription("");
      fetchDontForgetList();
    } catch (error) {
      toast({
        title: "Error adding item",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCards(cards.filter(card => card.id !== id));
      toast({
        title: "Item deleted",
        description: "The item has been removed from your Don't Forget Box",
      });
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, card: CardType) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: card.id,
      type: 'card',
      card,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader>
          <SheetTitle>Don't Forget Box</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="What do you need to remember?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={adding}
            />
            <Textarea
              placeholder="Add more details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={adding}
            />
            <Button type="submit" disabled={adding || !title.trim()}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : cards.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Your Don't Forget Box is empty
            </p>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div 
                  key={card.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, card)}
                  className="cursor-move"
                >
                  <Card className="task-card group hover:shadow-md transition-all duration-200">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    </CardHeader>
                    {card.description && (
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      </CardContent>
                    )}
                    <CardFooter className="justify-end p-3 pt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}