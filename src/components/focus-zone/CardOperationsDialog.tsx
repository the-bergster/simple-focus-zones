import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Card } from '@/types/focus-zone';

const cardFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

interface CardOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  listId?: string;
  card?: Card;
}

export const CardOperationsDialog = ({
  open,
  onOpenChange,
  mode,
  listId,
  card,
}: CardOperationsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      title: card?.title || "",
      description: card?.description || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof cardFormSchema>) => {
    try {
      setIsLoading(true);

      if (mode === 'create' && listId) {
        // Get the current highest position for the list
        const { data: existingCards } = await supabase
          .from('cards')
          .select('position')
          .eq('list_id', listId)
          .order('position', { ascending: false })
          .limit(1);

        const newPosition = (existingCards?.[0]?.position || -1) + 1;

        await supabase
          .from('cards')
          .insert({
            title: data.title,
            description: data.description || null,
            list_id: listId,
            position: newPosition,
          });

        toast({
          title: "Card created",
          description: "Your new card has been created successfully.",
        });
      } else if (mode === 'edit' && card) {
        await supabase
          .from('cards')
          .update({
            title: data.title,
            description: data.description || null,
          })
          .eq('id', card.id);

        toast({
          title: "Card updated",
          description: "Your card has been updated successfully.",
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Card' : 'Edit Card'}</DialogTitle>
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {mode === 'create' ? 'Create Card' : 'Update Card'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};