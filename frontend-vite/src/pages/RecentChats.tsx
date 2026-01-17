import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { MoveToProjectModal } from "@/components/chat/MoveToProjectModal";
import { useChatThreads } from "@/contexts/ChatThreadsContext";
import { conversationsApi } from "@/services/api/conversations";
import { useToast } from "@/hooks/use-toast";
import type { ChatThread } from "@/types/chat";

const PAGE_SIZE = 25;

export default function RecentChats() {
  const navigate = useNavigate();
  const { threads, deleteThread, renameThread, moveToProject, setActiveThreadId } =
    useChatThreads();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [apiThreads, setApiThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await conversationsApi.listConversations({
          limit: 100,
        });
        
        if (response.success && response.data) {
          // Convert API conversations to ChatThread format
          const convertedThreads: ChatThread[] = response.data.map((conv) => {
            // Get last message for snippet
            const messages = conv.messages || [];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            return {
              id: conv.id,
              title: conv.title || (lastMessage?.content?.substring(0, 50) || "Untitled Chat"),
              createdAt: conv.created_at,
              updatedAt: conv.updated_at,
              lastMessageSnippet: lastMessage?.content?.substring(0, 50) || "",
              messages: messages.map((msg) => ({
                id: msg.id,
                projectId: conv.project_id || undefined,
                role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: msg.content,
                timestamp: msg.created_at,
                sources: msg.sources?.map((s: any) => ({
                  id: s.metadata?.doc_id || s.id || "",
                  name: s.metadata?.source || s.name || "Document",
                  snippet: s.content || s.snippet || "",
                  page: s.metadata?.page,
                })),
              })),
              projectId: conv.project_id || null,
            };
          });
          
          setApiThreads(convertedThreads);
        } else {
          setApiThreads([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch conversations:", error);
        toast({
          title: "Error loading conversations",
          description: error.message || "Failed to load chat history",
          variant: "destructive",
        });
        setApiThreads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [toast]);

  // Combine API threads with context threads (prioritize API)
  const allThreads = useMemo(() => {
    // Merge API threads with context threads, avoiding duplicates
    const apiThreadIds = new Set(apiThreads.map(t => t.id));
    const contextThreads = threads.filter(t => !apiThreadIds.has(t.id));
    return [...apiThreads, ...contextThreads];
  }, [apiThreads, threads]);

  const filteredChats = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = searchQuery
      ? allThreads.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.messages.some((m) =>
              m.content.toLowerCase().includes(lowerQuery)
            )
        )
      : allThreads;

    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [allThreads, searchQuery]);

  const visibleChats = filteredChats.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChats.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleChatClick = (chatId: string) => {
    setActiveThreadId(chatId);
    navigate("/chat");
  };

  const handleDelete = (chatId: string) => {
    deleteThread(chatId);
  };

  const handleRename = (chatId: string, newTitle: string) => {
    renameThread(chatId, newTitle);
  };

  const handleMoveToProject = (chatId: string) => {
    setSelectedChatId(chatId);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = (projectId: string) => {
    if (selectedChatId) {
      moveToProject(selectedChatId, projectId);
      setMoveModalOpen(false);
      setSelectedChatId(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Recent Chats
          </h1>
          <p className="text-muted-foreground">
            View and manage your conversation history
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Chat List */}
        {visibleChats.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {searchQuery ? "No chats found" : "No chats yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Start a new conversation to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                onClick={() => handleChatClick(chat.id)}
                onDelete={() => handleDelete(chat.id)}
                onRename={(title) => handleRename(chat.id, title)}
                onMoveToProject={() => handleMoveToProject(chat.id)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Load more
            </Button>
          </div>
        )}

        {/* Move to Project Modal */}
        <MoveToProjectModal
          open={moveModalOpen}
          onOpenChange={setMoveModalOpen}
          onConfirm={handleConfirmMove}
        />
      </div>
    </AppLayout>
  );
}
