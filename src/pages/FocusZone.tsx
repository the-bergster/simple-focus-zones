import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Loader2, Edit, Trash, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const listFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const cardFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

const DraggableCard = ({ card }: { card: Card }) => {
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

const FocusZone = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [focusZone, setFocusZone] = useState<any>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const listForm = useForm<z.infer<typeof listFormSchema>>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      title: "",
    },
  });

  const cardForm = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

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
    fetchFocusZone();
    fetchLists();
  }, [id]);

  useEffect(() => {
    if (lists.length > 0) {
      fetchCards();
    }
  }, [lists]);

  useEffect(() => {
    if (editingList) {
      listForm.reset({
        title: editingList.title,
      });
    } else {
      listForm.reset({
        title: "",
      });
    }
  }, [editingList, listForm]);

  const fetchFocusZone = async () => {
    try {
      const { data, error } = await supabase
        .from('focus_zones')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard');
        toast({
          title: "Focus Zone not found",
          description: "The requested Focus Zone does not exist.",
          variant: "destructive",
        });
        return;
      }
      setFocusZone(data);
    } catch (error) {
      toast({
        title: "Error fetching Focus Zone",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('focus_zone_id', id)
        .order('position');

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      toast({
        title: "Error fetching lists",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const listIds = lists.map(list => list.id);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .in('list_id', listIds)
        .order('position');

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      toast({
        title: "Error fetching cards",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const createList = async (data: z.infer<typeof listFormSchema>) => {
    try {
      const newPosition = lists.length;
      const { data: newList, error } = await supabase
        .from('lists')
        .insert({
          title: data.title,
          position: newPosition,
          focus_zone_id: id
        })
        .select()
        .single();

      if (error) throw error;
      
      setLists([...lists, newList]);
      setIsListDialogOpen(false);
      toast({
        title: "List created",
        description: "Your new list has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const createCard = async (data: z.infer<typeof cardFormSchema>) => {
    if (!activeListId) return;

    try {
      const listCards = cards.filter(card => card.list_id === activeListId);
      const newPosition = listCards.length;
      
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          title: data.title,
          description: data.description || null,
          position: newPosition,
          list_id: activeListId
        })
        .select()
        .single();

      if (error) throw error;

      setCards([...cards, newCard]);
      setIsCardDialogOpen(false);
      cardForm.reset();
      toast({
        title: "Card created",
        description: "Your new card has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const updateList = async (data: z.infer<typeof listFormSchema>) => {
    if (!editingList) return;

    try {
      const { error } = await supabase
        .from('lists')
        .update({
          title: data.title,
        })
        .eq('id', editingList.id);

      if (error) throw error;

      setLists(lists.map(list => 
        list.id === editingList.id 
          ? { ...list, title: data.title }
          : list
      ));
      
      setEditingList(null);
      setIsListDialogOpen(false);
      toast({
        title: "List updated",
        description: "Your list has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list and all its cards? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.filter(list => list.id !== listId));
      setCards(cards.filter(card => card.list_id !== listId));
      toast({
        title: "List deleted",
        description: "Your list has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting list",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const onListSubmit = async (data: z.infer<typeof listFormSchema>) => {
    if (editingList) {
      await updateList(data);
    } else {
      await createList(data);
    }
  };

  const onCardSubmit = async (data: z.infer<typeof cardFormSchema>) => {
    await createCard(data);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedCard = cards.find(card => card.id === active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    const overList = lists.find(list => list.id === over.id);
    if (overList && activeCard.list_id !== overList.id) {
      setActiveListId(overList.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    const overList = lists.find(list => list.id === over.id);
    if (!overList) return;

    if (activeCard.list_id !== overList.id) {
      try {
        const newListCards = cards.filter(card => card.list_id === overList.id);
        const newPosition = newListCards.length;

        const { error } = await supabase
          .from('cards')
          .update({
            list_id: overList.id,
            position: newPosition,
          })
          .eq('id', activeCard.id);

        if (error) throw error;

        // Update local state
        setCards(cards.map(card =>
          card.id === activeCard.id
            ? { ...card, list_id: overList.id, position: newPosition }
            : card
        ));

        toast({
          title: "Card moved",
          description: "Card has been moved to new list successfully.",
        });
      } catch (error) {
        toast({
          title: "Error moving card",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    }

    setActiveCard(null);
    setActiveListId(null);
  };

  if (!focusZone && loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{focusZone?.title}</h1>
              {focusZone?.description && (
                <p className="text-sm text-muted-foreground">{focusZone.description}</p>
              )}
            </div>
          </div>
          
          <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingList(null)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingList ? 'Edit List' : 'Create New List'}</DialogTitle>
              </DialogHeader>
              <Form {...listForm}>
                <form onSubmit={listForm.handleSubmit(onListSubmit)} className="space-y-4">
                  <FormField
                    control={listForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {editingList ? 'Update' : 'Create'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          <Form {...cardForm}>
            <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
              <FormField
                control={cardForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Create Card
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="pt-24 px-8 pb-8">
          <div className="max-w-full mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
                {lists.map((list) => (
                  <div 
                    key={list.id} 
                    className="flex-none w-[300px]"
                  >
                    <div 
                      className="bg-white rounded-lg p-4 shadow-md min-h-[100px] max-h-[calc(100vh-12rem)] overflow-y-auto"
                      style={{
                        minHeight: cards.filter(card => card.list_id === list.id).length === 0 ? '100px' : 'auto'
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm">{list.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingList(list);
                              setIsListDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteList(list.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="space-y-2"
                        data-list-id={list.id}
                      >
                        <SortableContext
                          items={cards
                            .filter(card => card.list_id === list.id)
                            .map(card => card.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {cards
                            .filter(card => card.list_id === list.id)
                            .sort((a, b) => a.position - b.position)
                            .map(card => (
                              <DraggableCard key={card.id} card={card} />
                            ))}
                        </SortableContext>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          size="sm"
                          onClick={() => {
                            setActiveListId(list.id);
                            setIsCardDialogOpen(true);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add a card
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {lists.length === 0 && (
                  <div className="flex items-center justify-center w-full">
                    <Card className="w-[300px]">
                      <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
                        <CardDescription>No lists yet</CardDescription>
                        <Button onClick={() => setIsListDialogOpen(true)} variant="secondary" size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Your First List
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              <DragOverlay>
                {activeCard ? (
                  <Card className="bg-white border shadow-lg w-[280px]">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium">{activeCard.title}</CardTitle>
                      {activeCard.description && (
                        <CardDescription className="text-xs">
                          {activeCard.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusZone;
