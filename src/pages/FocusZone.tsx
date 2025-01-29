import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { FocusZoneContent } from '@/components/focus-zone/FocusZoneContent';
import { useFocusZone } from '@/hooks/useFocusZone';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const FocusZone = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    focusZone,
    lists,
    cards,
    loading,
    setCards,
    setLists,
    setFocusZone,
  } = useFocusZone(id);

  // Add real-time subscriptions
  useRealtimeSubscription({
    focusZoneId: id!,
    onListsChange: setLists,
    onCardsChange: setCards,
    onFocusZoneChange: setFocusZone,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-10">
        <div className="max-w-[1800px] mx-auto w-full">
          <div className="flex items-center justify-between px-6 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {focusZone?.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="pt-24 w-full">
        <div className="max-w-[1800px] mx-auto">
          <FocusZoneContent
            focusZoneId={id!}
            lists={lists}
            cards={cards}
            setLists={setLists}
            setCards={setCards}
          />
        </div>
      </div>
    </div>
  );
};

export default FocusZone;