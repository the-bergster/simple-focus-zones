import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, ArrowLeft } from "lucide-react";
import * as z from "zod";
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from "@/integrations/supabase/client";
import { DroppableList } from '@/components/focus-zone/DroppableList';
import { ListDialog } from '@/components/focus-zone/ListDialog';
import { CardDialog } from '@/components/focus-zone/CardDialog';

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedCard = cards.find(card => card.id === active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    const overList = lists.find(list => list.id === over.id);
    if (overList) {
      setActiveListId(overList.id);
    }

    const overCard = cards.find(card => card.id === over.id);
    if (overCard && activeCard.list_id !== overCard.list_id) {
      setCards(prevCards => {
        const newCards = [...prevCards];
        const activeIndex = newCards.findIndex(card => card.id === activeCard.id);
        const overIndex = newCards.findIndex(card => card.id === overCard.id);
        
        if (activeIndex !== -1) {
          newCards[activeIndex] = {
            ...newCards[activeIndex],
            list_id: overCard.list_id,
            position: overCard.position,
          };
        }
        
        return newCards;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    if (!activeCard) return;

    try {
      let newListId = activeCard.list_id;
      let newPosition = activeCard.position;

      const overList = lists.find(list => list.id === over.id);
      if (overList) {
        newListId = overList.id;
        const listCards = cards.filter(card => card.list_id === overList.id);
        newPosition = listCards.length;
      }

      const overCard = cards.find(card => card.id === over.id);
      if (overCard) {
        newListId = overCard.list_id;
        newPosition = overCard.position;
      }

      const { error } = await supabase
        .from('cards')
        .update({
          list_id: newListId,
          position: newPosition,
        })
        .eq('id', activeCard.id);

      if (error) throw error;

      setCards(prevCards =>
        prevCards.map(card =>
          card.id === activeCard.id
            ? { ...card, list_id: newListId, position: newPosition }
            : card
        )
      );

      toast({
        title: "Card moved",
        description: "Card has been moved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error moving card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
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
          
          <Button 
            onClick={() => {
              setEditingList(null);
              setIsListDialogOpen(true);
            }} 
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add List
          </Button>
        </div>
      </div>

      <ListDialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        editingList={editingList}
        onSubmit={onListSubmit}
      />

      <CardDialog
        open={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
        onSubmit={createCard}
      />

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
                  <DroppableList
                    key={list.id}
                    list={list}
                    cards={cards.filter(card => card.list_id === list.id)}
                    onEditList={setEditingList}
                    onDeleteList={deleteList}
                    onAddCard={setActiveListId}
                  />
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
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusZone;