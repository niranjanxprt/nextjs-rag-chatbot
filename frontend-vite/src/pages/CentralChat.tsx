import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare, Pencil, Check, X, Database, FolderOpen, BookOpen, ChevronDown, Layers } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatContainer, ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { RecentChatsPreview } from "@/components/chat/RecentChatsPreview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useChatThreads } from "@/contexts/ChatThreadsContext";
import type { ChatMessage as ChatMessageType } from "@/services/api/types";
import { chatApi } from "@/services/api/chat";
import { projectsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const KNOWLEDGE_BASE_ID = "__knowledge_base__";
const GENERAL_CHAT_ID = "__general__";

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function CentralChat() {
  const { chatId } = useParams<{ chatId?: string }>();
  const {
    activeThreadId,
    setActiveThreadId,
    createThread,
    getThread,
    addMessage,
    updateMessage,
    renameThread,
    getRecentChats,
  } = useChatThreads();

  const [isStreaming, setIsStreaming] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false); // Default to disabled (General Chat)

  // Sync URL param with active thread
  useEffect(() => {
    if (chatId && chatId !== activeThreadId) {
      setActiveThreadId(chatId);
    }
  }, [chatId, activeThreadId, setActiveThreadId]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getProjects();
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    fetchProjects();
  }, []);

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setShowProjectSelect(false);
    
    if (projectId === KNOWLEDGE_BASE_ID) {
      toast({
        title: "Knowledge Base selected",
        description: "Chatting with Knowledge Base documents",
      });
    } else if (projectId === GENERAL_CHAT_ID) {
      toast({
        title: "General chat",
        description: "You can ask any question",
      });
    } else {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        toast({
          title: "Project selected",
          description: `Now chatting in ${project.name}`,
        });
      }
    }
  };

  const activeThread = activeThreadId ? getThread(activeThreadId) : null;
  const messages = activeThread?.messages || [];
  const recentChats = getRecentChats(3).filter((c) => c.id !== activeThreadId);

  const handleStartEditTitle = () => {
    if (activeThread) {
      setEditedTitle(activeThread.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (activeThread && editedTitle.trim()) {
      renameThread(activeThread.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const { toast } = useToast();

  // Real API integration
  const sendChatMessage = useCallback(
    async (threadId: string, content: string, currentUseKnowledgeBase: boolean) => {
      setIsStreaming(true);

      const projectIdForMessage = selectedProject === GENERAL_CHAT_ID || selectedProject === KNOWLEDGE_BASE_ID 
        ? undefined 
        : selectedProject;

      const assistantMessage: ChatMessageType = {
        id: `msg-${Date.now()}-assistant`,
        projectId: projectIdForMessage,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      addMessage(threadId, assistantMessage);

      // We will implement the call closer to original structure but replacing simulation
      let fullContent = "";

      // useKnowledgeBase toggle controls whether to use indexed documents
      await chatApi.sendMessageStreaming(
        {
          projectId: projectIdForMessage,
          content,
          useKnowledgeBase: useKnowledgeBase, // Use the toggle state
        },
        {
          onToken: (token) => {
            fullContent += token;
            updateMessage(threadId, assistantMessage.id, { content: fullContent });
          },
          onComplete: (completedMessage) => {
            updateMessage(threadId, assistantMessage.id, {
              content: completedMessage.content,
              sources: completedMessage.sources,
            });
            setIsStreaming(false);
          },
          onError: (error) => {
            setIsStreaming(false);
            toast({
              title: "Error sending message",
              description: error.message,
              variant: "destructive",
            });
            // Optionally add error message to chat
            updateMessage(threadId, assistantMessage.id, {
              content: fullContent + "\n\n[Error generating response]",
            });
          },
        }
      );
    },
    [addMessage, updateMessage, toast, selectedProject]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      let threadId = activeThreadId;

      // Build request payload with KB flag based on toggle state
      // TODO: Backend will use this payload structure
      const _requestPayload = {
        query: content,
        useKnowledgeBase,
      };

      // Create thread on first message
      if (!threadId) {
        const newThread = createThread(content);
        threadId = newThread.id;
      }

      // Add user message
      const projectIdForMessage = selectedProject === GENERAL_CHAT_ID || selectedProject === KNOWLEDGE_BASE_ID 
        ? undefined 
        : selectedProject;
      
      const userMessage: ChatMessageType = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projectIdForMessage,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      addMessage(threadId, userMessage);
      sendChatMessage(threadId, content, useKnowledgeBase);
    },
    [activeThreadId, createThread, addMessage, sendChatMessage, useKnowledgeBase, selectedProject]
  );

  const handleSelectRecentChat = (chatId: string) => {
    setActiveThreadId(chatId);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        {activeThread ? (
          <div className="border-b border-border px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="max-w-md h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") handleCancelEditTitle();
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveTitle}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCancelEditTitle}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="font-medium text-foreground">
                    {activeThread.title}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleStartEditTitle}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Popover open={showProjectSelect} onOpenChange={setShowProjectSelect}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {selectedProject === GENERAL_CHAT_ID ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : selectedProject === KNOWLEDGE_BASE_ID ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                    <span>
                      {selectedProject === GENERAL_CHAT_ID 
                        ? "General Chat" 
                        : selectedProject === KNOWLEDGE_BASE_ID
                        ? "Knowledge Base"
                        : projects.find((p) => p.id === selectedProject)?.name || "General Chat"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={true}>
                    <CommandInput placeholder="Search projects..." />
                    <CommandList>
                      <CommandEmpty>
                        {projects.length === 0 
                          ? "No projects available. Create a project first." 
                          : "No projects found matching your search."}
                      </CommandEmpty>
                      {projects.length > 0 && (
                        <CommandGroup heading="Projects">
                          {projects.map((project) => (
                            <CommandItem
                              key={project.id}
                              value={`${project.name} ${project.description || ""} ${project.id}`}
                              onSelect={() => handleSelectProject(project.id)}
                              className="flex items-start gap-3 py-3 cursor-pointer"
                            >
                              <FolderOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium text-foreground">{project.name}</span>
                                {project.description && (
                                  <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {project.description}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      <CommandGroup heading="Chat Options">
                        <CommandItem
                          value="General Chat general"
                          onSelect={() => handleSelectProject(GENERAL_CHAT_ID)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">General Chat</span>
                        </CommandItem>
                        <CommandItem
                          value="Knowledge Base knowledge"
                          onSelect={() => handleSelectProject(KNOWLEDGE_BASE_ID)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">Knowledge Base</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Database className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="kb-toggle-active" className="text-sm text-muted-foreground">
                Include Knowledge Base (Indexed Documents)
              </Label>
              <Switch
                id="kb-toggle-active"
                checked={useKnowledgeBase}
                onCheckedChange={(checked) => {
                  setUseKnowledgeBase(checked);
                  toast({
                    title: checked ? "Knowledge Base enabled" : "Knowledge Base disabled",
                    description: checked 
                      ? "Chat will use indexed documents" 
                      : "Chat will use general knowledge only",
                  });
                }}
              />
            </div>
          </div>
        ) : (
          <div className="border-b border-border px-6 py-3 flex items-center justify-between">
            <Popover open={showProjectSelect} onOpenChange={setShowProjectSelect}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {selectedProject === GENERAL_CHAT_ID ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : selectedProject === KNOWLEDGE_BASE_ID ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                  <span>
                    {selectedProject === GENERAL_CHAT_ID 
                      ? "General Chat" 
                      : selectedProject === KNOWLEDGE_BASE_ID
                      ? "Knowledge Base"
                      : projects.find((p) => p.id === selectedProject)?.name || "General Chat"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={true}>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList>
                    <CommandEmpty>
                      {projects.length === 0 
                        ? "No projects available. Create a project first." 
                        : "No projects found matching your search."}
                    </CommandEmpty>
                    {projects.length > 0 && (
                      <CommandGroup heading="Projects">
                        {projects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={`${project.name} ${project.description || ""} ${project.id}`}
                            onSelect={() => handleSelectProject(project.id)}
                            className="flex items-start gap-3 py-3 cursor-pointer"
                          >
                            <FolderOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium text-foreground">{project.name}</span>
                              {project.description && (
                                <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {project.description}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    <CommandGroup heading="Chat Options">
                      <CommandItem
                        value="General Chat general"
                        onSelect={() => handleSelectProject(GENERAL_CHAT_ID)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">General Chat</span>
                      </CommandItem>
                      <CommandItem
                        value="Knowledge Base knowledge"
                        onSelect={() => handleSelectProject(KNOWLEDGE_BASE_ID)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">Knowledge Base</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="kb-toggle" className="text-sm text-muted-foreground">
                Include Knowledge Base (Indexed Documents)
              </Label>
              <Switch
                id="kb-toggle"
                checked={useKnowledgeBase}
                onCheckedChange={(checked) => {
                  setUseKnowledgeBase(checked);
                  toast({
                    title: checked ? "Knowledge Base enabled" : "Knowledge Base disabled",
                    description: checked 
                      ? "Chat will use indexed documents" 
                      : "Chat will use general knowledge only",
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 && !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                Start a new conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask questions and get AI-powered insights. Your chat history
                will be saved automatically.
              </p>
            </div>
          ) : (
            <ChatContainer>
              {messages.map((message, index) => (
                <ChatMessage key={message.id || `msg-${index}`} message={message} />
              ))}
            </ChatContainer>
          )}

          <div className="border-t border-border">
            <ChatInput onSend={handleSendMessage} disabled={isStreaming} />

            {/* Recent Chats Preview - only show when no active thread */}
            {!activeThread && recentChats.length > 0 && (
              <RecentChatsPreview
                chats={recentChats.slice(0, 3)}
                onSelect={handleSelectRecentChat}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
