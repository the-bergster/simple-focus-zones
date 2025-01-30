import { ListTitle } from "./ListTitle";
import { ListActions } from "./ListActions";

interface ListHeaderProps {
  listId: string;
  title: string;
  isFocused: boolean;
  onDelete: () => void;
  isDontForgetBox?: boolean;
}

export const ListHeader = ({ 
  listId, 
  title, 
  isFocused,
  onDelete,
  isDontForgetBox = false,
}: ListHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-2 mb-4">
      <ListTitle
        listId={listId}
        initialTitle={title}
        isFocused={isFocused}
      />
      {!isDontForgetBox && (
        <ListActions
          listId={listId}
          isFocused={isFocused}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};