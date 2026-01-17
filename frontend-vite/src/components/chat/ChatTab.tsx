import { useState, useCallback } from "react";
import { ChatContainer, ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { MessageSquare, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ChatMessage as ChatMessageType } from "@/data/mockData";

interface ChatTabProps {
  projectId: string;
  initialMessages: ChatMessageType[];
}

export function ChatTab({ projectId, initialMessages }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(false);

  const simulateStreamingResponse = useCallback(async (userMessage: string) => {
    setIsStreaming(true);

    // Simulate AI response with streaming effect
    const responses = [
      "Based on my analysis of your documents, ",
      "I found several relevant sections. ",
      "The key points are:\n\n",
      "**1. Main Finding**\n",
      "Your documents contain important information related to your query.\n\n",
      "**2. Supporting Details**\n",
      "Additional context from the indexed documents supports this conclusion.",
    ];

    const assistantMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    let fullContent = "";
    for (const chunk of responses) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      fullContent += chunk;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: fullContent }
            : msg
        )
      );
    }

    // Add sources after streaming completes
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              sources: [
                {
                  id: "source-1",
                  name: "Document Analysis.pdf",
                  page: 5,
                  snippet: "Relevant excerpt from the document that supports the response...",
                },
              ],
            }
          : msg
      )
    );

    setIsStreaming(false);
  }, []);

  const handleSendMessage = (content: string) => {
    // Build request payload with KB flag
    // TODO: Backend will use this payload structure
    const _requestPayload = {
      query: content,
      projectId,
      includeKnowledgeBase,
    };

    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    simulateStreamingResponse(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Knowledge Base Toggle */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-end gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="kb-toggle" className="text-sm text-muted-foreground cursor-pointer">
          Include Knowledge Base
        </Label>
        <Switch
          id="kb-toggle"
          checked={includeKnowledgeBase}
          onCheckedChange={setIncludeKnowledgeBase}
        />
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Start a conversation</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ask questions about your documents and get AI-powered insights with source citations.
          </p>
        </div>
      ) : (
        <ChatContainer>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </ChatContainer>
      )}

      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}
