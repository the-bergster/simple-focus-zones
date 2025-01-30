import { ListTitle } from "./ListTitle";
import { ListActions } from "./ListActions";

interface ListHeaderProps {
  listId: string;
  title: string;
  isFocused: boolean;
  onDelete: () => void;
}

export const ListHeader = ({ listId, title, isFocused, onDelete }: ListHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <ListTitle
        listId={listId}
        initialTitle={title}
      />
      <ListActions
        listId={listId}
        isFocused={isFocused}
        onDelete={onDelete}
      />
    </div>
  );
};