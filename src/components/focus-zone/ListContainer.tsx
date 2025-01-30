import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ListContainerProps {
  children: ReactNode;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDontForgetBox?: boolean;
}

export const ListContainer = ({
  children,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isDontForgetBox = false,
}: ListContainerProps) => {
  return (
    <div 
      className="px-3"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ pointerEvents: 'auto' }}
    >
      <Card 
        className={cn(
          "p-4 backdrop-blur-sm border transition-all duration-200",
          isDontForgetBox ? "bg-amber-50/50 border-amber-200/50" : "bg-white/50 border-foreground/15",
          isDragOver && "ring-2 ring-primary border-primary bg-white/80"
        )}
      >
        {children}
      </Card>
    </div>
  );
};