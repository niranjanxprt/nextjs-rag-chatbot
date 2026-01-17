import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { SavedPrompt, PromptCategory } from "@/data/mockData";
import { SYSTEM_PROMPTS } from "@/constants/prompts";

interface PromptCardProps {
  prompt: SavedPrompt;
  onEdit: (prompt: SavedPrompt) => void;
  onDelete: (prompt: SavedPrompt) => void;
}

const categoryColors: Record<PromptCategory, string> = {
  analysis: "bg-info/10 text-info border-info/20",
  extraction: "bg-success/10 text-success border-success/20",
  summary: "bg-primary/10 text-primary border-primary/20",
  comparison: "bg-warning/10 text-warning border-warning/20",
  general: "bg-muted text-muted-foreground border-border",
};

export function PromptCard({ prompt, onEdit, onDelete }: PromptCardProps) {
  const { toast } = useToast();
  const isSystemPrompt = SYSTEM_PROMPTS.includes(prompt.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text);
      toast({
        title: "Copied to clipboard",
        description: "Prompt text has been copied. Paste it in any chat.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate pr-2">
            {prompt.title}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              Copy Prompt
            </DropdownMenuItem>
            {!isSystemPrompt && (
              <>
                <DropdownMenuItem
                  onClick={() => onEdit(prompt)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(prompt)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {isSystemPrompt && (
              <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                <span className="text-xs text-muted-foreground">System prompt (protected)</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
          {prompt.text}
        </p>
        <div className="flex flex-col gap-2">
          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.slice(0, 5).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 bg-muted/50 text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
              {prompt.tags.length > 5 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-muted/50 text-muted-foreground">
                  +{prompt.tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={categoryColors[prompt.category]}>
            {prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Use Prompt
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
