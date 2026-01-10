/**
 * Enhanced Chat Message Component
 * Better message display with sources and formatting
 */

'use client'

import { FileText, User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface Source {
  id: string;
  name: string;
  page?: number;
  snippet: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: Source[];
    created_at: string;
  };
}

export function EnhancedChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

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
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
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
          {isAssistant ? (
            <ReactMarkdown 
              className="prose prose-sm max-w-none dark:prose-invert"
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{children}</pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
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

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}