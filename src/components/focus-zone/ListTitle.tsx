import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ListTitleProps {
  listId: string;
  initialTitle: string;
  isFocused: boolean;
}

export const ListTitle = ({ listId, initialTitle, isFocused }: ListTitleProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleBlur = async () => {
    setIsEditing(false);
    if (title !== initialTitle) {
      try {
        const { error } = await supabase
          .from('lists')
          .update({ title })
          .eq('id', listId);

        if (error) throw error;
      } catch (error) {
        toast({
          title: "Error updating list title",
          description: error instanceof Error ? error.message : "Failed to update list title",
          variant: "destructive",
        });
      }
    }
  };

  return isEditing ? (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleBlur();
        }
      }}
      className="h-7 text-sm font-medium"
      autoFocus
    />
  ) : (
    <button
      onClick={() => setIsEditing(true)}
      className="text-sm font-medium hover:underline decoration-dotted"
    >
      {title}
    </button>
  );
};