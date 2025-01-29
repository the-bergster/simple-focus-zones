import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ListTitleProps {
  listId: string;
  initialTitle: string;
}

export const ListTitle = ({ listId, initialTitle }: ListTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const { toast } = useToast();

  const handleTitleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (editedTitle.trim() === '') {
      toast({
        title: "Invalid title",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      setEditedTitle(initialTitle);
      setIsEditing(false);
      return;
    }

    if (editedTitle.trim() !== initialTitle) {
      try {
        const { error } = await supabase
          .from('lists')
          .update({ title: editedTitle.trim() })
          .eq('id', listId);

        if (error) throw error;
        
        toast({
          title: "List updated",
          description: "List title has been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating list:', error);
        toast({
          title: "Error updating list",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        setEditedTitle(initialTitle);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form 
        onSubmit={handleTitleSubmit} 
        className="flex-1 mr-2" 
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm font-medium"
          autoFocus
        />
      </form>
    );
  }

  return (
    <h3 
      className="font-medium text-sm tracking-tight text-slate-700 cursor-pointer hover:text-slate-900"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {editedTitle}
    </h3>
  );
};