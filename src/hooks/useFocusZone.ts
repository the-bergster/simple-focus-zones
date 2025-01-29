import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { FocusZone, List, Card } from '@/types/focus-zone';

export const useFocusZone = (id: string | undefined) => {
  const { toast } = useToast();
  const [focusZone, setFocusZone] = useState<FocusZone | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFocusZone = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('focus_zones')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Focus Zone not found",
          description: "The requested Focus Zone does not exist.",
          variant: "destructive",
        });
        return null;
      }
      setFocusZone(data);
      return data;
    } catch (error) {
      console.error('Error fetching focus zone:', error);
      toast({
        title: "Error fetching Focus Zone",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const fetchLists = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('focus_zone_id', id)
        .order('position');

      if (error) throw error;
      setLists(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Error fetching lists",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchCards = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('position');

      if (error) throw error;
      setCards(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error fetching cards",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return [];
    }
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    const focusZoneData = await fetchFocusZone();
    if (focusZoneData) {
      await Promise.all([fetchLists(), fetchCards()]);
    }
    setLoading(false);
  }, [id]);

  // Subscribe to real-time updates for lists
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('list-focus-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `focus_zone_id=eq.${id}`
        },
        () => {
          // Refetch lists when any changes occur
          fetchLists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    focusZone,
    lists,
    cards,
    loading,
    setLists,
    setCards,
    refetch,
  };
};