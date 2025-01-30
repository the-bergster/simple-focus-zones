import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      size="icon"
    >
      <Inbox className="h-6 w-6" />
    </Button>
  );
}