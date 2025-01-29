import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";

interface FocusZone {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [focusZones, setFocusZones] = useState<FocusZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        fetchFocusZones();
      }
    };
    checkUser();
  }, [navigate]);

  const fetchFocusZones = async () => {
    try {
      const { data, error } = await supabase
        .from('focus_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFocusZones(data || []);
    } catch (error) {
      toast({
        title: "Error fetching focus zones",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  const createFocusZone = async () => {
    try {
      const { data, error } = await supabase
        .from('focus_zones')
        .insert([
          { title: 'New Focus Zone', description: 'Click to edit this focus zone' }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setFocusZones([data, ...focusZones]);
      toast({
        title: "Focus Zone created",
        description: "Your new focus zone has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating focus zone",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Focus Zones</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="mb-6">
          <Button onClick={createFocusZone} className="w-full sm:w-auto">
            <PlusCircle className="mr-2" />
            Create Focus Zone
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : focusZones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <CardDescription>You haven't created any focus zones yet.</CardDescription>
              <Button onClick={createFocusZone} variant="secondary">
                <PlusCircle className="mr-2" />
                Create Your First Focus Zone
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {focusZones.map((zone) => (
              <Card key={zone.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{zone.title}</CardTitle>
                  <CardDescription>{zone.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full" onClick={() => navigate(`/focus-zone/${zone.id}`)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;