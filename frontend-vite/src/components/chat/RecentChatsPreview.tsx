import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import type { ChatThread } from "@/types/chat";

interface RecentChatsPreviewProps {
  chats: ChatThread[];
  onSelect: (chatId: string) => void;
}

export function RecentChatsPreview({ chats, onSelect }: RecentChatsPreviewProps) {
  if (chats.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
        Recent chats
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent text-left transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {chat.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {chat.lastMessageSnippet}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(chat.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
