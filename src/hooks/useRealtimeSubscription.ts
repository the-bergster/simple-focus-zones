import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { List, Card } from '@/types/focus-zone';

interface UseRealtimeSubscriptionProps {
  focusZoneId: string;
  onListsChange: (lists: List[]) => void;
  onCardsChange: (cards: Card[]) => void;
}

export const useRealtimeSubscription = ({
  focusZoneId,
  onListsChange,
  onCardsChange,
}: UseRealtimeSubscriptionProps) => {
  useEffect(() => {
    // Create a channel for all real-time subscriptions
    const channel = supabase
      .channel('focus-zone-changes')
      // Listen for lists changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `focus_zone_id=eq.${focusZoneId}`
        },
        async () => {
          const { data } = await supabase
            .from('lists')
            .select('*')
            .eq('focus_zone_id', focusZoneId)
            .order('position');
          
          if (data) onListsChange(data);
        }
      )
      // Listen for cards changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards'
        },
        async () => {
          const { data } = await supabase
            .from('cards')
            .select('*')
            .order('position');
          
          if (data) onCardsChange(data);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [focusZoneId, onListsChange, onCardsChange]);
};