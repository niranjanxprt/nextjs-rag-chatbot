import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateProject: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderPlus className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-1">No projects yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Create your first project to start analyzing documents with AI-powered
        insights.
      </p>
      <Button onClick={onCreateProject}>
        Create Your First Project
      </Button>
    </div>
  );
}
