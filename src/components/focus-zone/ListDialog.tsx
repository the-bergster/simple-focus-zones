import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const listFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

interface List {
  id: string;
  title: string;
  position: number;
  focus_zone_id: string;
  created_at: string;
  updated_at: string;
}

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingList: List | null;
  onSubmit: (data: z.infer<typeof listFormSchema>) => Promise<void>;
}

export const ListDialog = ({
  open,
  onOpenChange,
  editingList,
  onSubmit,
}: ListDialogProps) => {
  const form = useForm<z.infer<typeof listFormSchema>>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      title: editingList?.title || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingList ? 'Edit List' : 'Create New List'}</DialogTitle>
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
            <Button type="submit" className="w-full">
              {editingList ? 'Update' : 'Create'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};