import { useState } from "react";
import { FolderOpen, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockProjects } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface MoveToProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectId: string) => void;
}

export function MoveToProjectModal({
  open,
  onOpenChange,
  onConfirm,
}: MoveToProjectModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const handleConfirm = () => {
    if (selectedProjectId) {
      onConfirm(selectedProjectId);
      setSelectedProjectId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Project</DialogTitle>
          <DialogDescription>
            Select a project to associate this chat with.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-2">
            {mockProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                  selectedProjectId === project.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.documentCount} documents
                  </p>
                </div>
                {selectedProjectId === project.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedProjectId}>
            Move Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
