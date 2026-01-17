import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/data/mockData";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? "You" : "AI"}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {message.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
              >
                <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {source.name}
                    {source.page && (
                      <span className="text-muted-foreground ml-1">
                        (p. {source.page})
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground line-clamp-2 mt-0.5">
                    {source.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatContainerProps {
  children: React.ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
    >
      {children}
    </div>
  );
}
