import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DontForgetItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export function DontForgetDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DontForgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  const fetchItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from('dont_forget_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
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
    if (!title.trim()) return;

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('dont_forget_items')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          owner_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Item added",
        description: "Your item has been added to the Don't Forget Box",
      });

      setTitle("");
      setDescription("");
      fetchItems();
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
        .from('dont_forget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
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
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Your Don't Forget Box is empty
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => {
                    const dragPreview = document.createElement('div');
                    dragPreview.style.width = '300px';
                    dragPreview.className = 'task-card fixed -left-[9999px]';
                    dragPreview.innerHTML = `
                      <div class="p-3">
                        <h3 class="text-sm font-medium">${item.title}</h3>
                        ${item.description ? `<p class="text-xs text-muted-foreground mt-1">${item.description}</p>` : ''}
                      </div>
                    `;
                    document.body.appendChild(dragPreview);
                    e.dataTransfer.setDragImage(dragPreview, 0, 0);
                    setTimeout(() => document.body.removeChild(dragPreview), 0);
                    
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      type: 'dont-forget-item'
                    }));
                  }}
                >
                  <Card className="task-card group">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    </CardHeader>
                    {item.description && (
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    )}
                    <CardFooter className="justify-end p-3 pt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
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