import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, FolderInput, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatThread } from "@/types/chat";

interface ChatListItemProps {
  chat: ChatThread;
  onClick: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onMoveToProject: () => void;
}

export function ChatListItem({
  chat,
  onClick,
  onDelete,
  onRename,
  onMoveToProject,
}: ChatListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== chat.title) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(chat.title);
    setIsRenaming(false);
  };

  return (
    <>
      <div
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
        onClick={isRenaming ? undefined : onClick}
      >
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") handleRenameCancel();
                }}
                onBlur={handleRenameSubmit}
              />
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground truncate">
                {chat.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {chat.lastMessageSnippet}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToProject();
                }}
              >
                <FolderInput className="h-4 w-4 mr-2" />
                Move to Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{chat.title}" and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
