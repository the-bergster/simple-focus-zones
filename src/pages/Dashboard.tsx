import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WarningDialog } from "@/components/ui/warning-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, Edit, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface FocusZone {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  owner_id: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [focusZones, setFocusZones] = useState<FocusZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<FocusZone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUserId(session.user.id);
        fetchFocusZones();
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (editingZone) {
      form.reset({
        title: editingZone.title,
        description: editingZone.description || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
      });
    }
  }, [editingZone, form]);

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

  const createFocusZone = async (data: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a focus zone",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: newZone, error } = await supabase
        .from('focus_zones')
        .insert({
          title: data.title,
          description: data.description || null,
          owner_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      
      setFocusZones([newZone, ...focusZones]);
      setIsDialogOpen(false);
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

  const updateFocusZone = async (data: z.infer<typeof formSchema>) => {
    if (!editingZone) return;

    try {
      const { error } = await supabase
        .from('focus_zones')
        .update({
          title: data.title,
          description: data.description || null,
        })
        .eq('id', editingZone.id);

      if (error) throw error;

      setFocusZones(focusZones.map(zone => 
        zone.id === editingZone.id 
          ? { ...zone, title: data.title, description: data.description || null }
          : zone
      ));
      
      setEditingZone(null);
      setIsDialogOpen(false);
      toast({
        title: "Focus Zone updated",
        description: "Your focus zone has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating focus zone",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (zoneId: string) => {
    setZoneToDelete(zoneId);
    setDeleteWarningOpen(true);
  };

  const deleteFocusZone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('focus_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFocusZones(focusZones.filter(zone => zone.id !== id));
      toast({
        title: "Focus Zone deleted",
        description: "Your focus zone has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error deleting focus zone",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (editingZone) {
      await updateFocusZone(data);
    } else {
      await createFocusZone(data);
    }
  };

  const handleViewFocusZone = (zoneId: string) => {
    navigate(`/focus-zone/${zoneId}`);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingZone ? 'Edit Focus Zone' : 'Create New Focus Zone'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {editingZone ? 'Update' : 'Create'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <WarningDialog
          open={deleteWarningOpen}
          onOpenChange={setDeleteWarningOpen}
          title="Delete Focus Zone"
          description="Are you sure you want to delete this focus zone? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            if (zoneToDelete) {
              deleteFocusZone(zoneToDelete);
              setDeleteWarningOpen(false);
              setZoneToDelete(null);
            }
          }}
          onCancel={() => {
            setDeleteWarningOpen(false);
            setZoneToDelete(null);
          }}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : focusZones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <CardDescription>You haven't created any focus zones yet.</CardDescription>
              <Button onClick={() => setIsDialogOpen(true)} variant="secondary">
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
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    onClick={() => handleViewFocusZone(zone.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingZone(zone);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(zone.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
