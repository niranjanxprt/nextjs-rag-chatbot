import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Send,
  Loader2,
  BookOpen,
  FolderOpen,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useToast } from '@/hooks/use-toast'
import { chatApi, projectsApi } from '@/services/api'
import { conversationsApi } from '@/services/api/conversations'
import type { ChatMessage as ChatMessageType } from '@/services/api/types'
import { RecentChatsPreview } from '@/components/chat/RecentChatsPreview'
import type { ChatThread } from '@/types/chat'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  useChatStore,
  selectInput,
  selectMessages,
  selectIsStreaming,
  selectConversationId,
  selectSelectedProject,
  selectUseKnowledgeBase,
  selectActions,
} from '@/stores/useChatStore'

interface Project {
  id: string
  name: string
  description: string
}

// Special value for Knowledge Base
const KNOWLEDGE_BASE_ID = '__knowledge_base__'
const GENERAL_CHAT_ID = '__general__'

// Use the type from API types to ensure consistency

export default function Chat() {
  const { toast } = useToast()

  // Zustand store - optimized subscriptions
  const input = useChatStore(selectInput)
  const messages = useChatStore(selectMessages)
  const isStreaming = useChatStore(selectIsStreaming)
  const conversationId = useChatStore(selectConversationId)
  const selectedProject = useChatStore(selectSelectedProject)
  const useKnowledgeBase = useChatStore(selectUseKnowledgeBase)
  const actions = useChatStore(selectActions)

  // Local state for UI only
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-1',
      name: 'Legal Contracts Analysis',
      description: 'Analyze and extract key terms from vendor contracts and agreements',
    },
    {
      id: 'proj-2',
      name: 'Q4 Financial Reports',
      description: 'Review quarterly financial statements and audit reports',
    },
    {
      id: 'proj-3',
      name: 'HR Policy Documents',
      description: 'Employee handbook and policy documentation review',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showProjectSelect, setShowProjectSelect] = useState(false)
  const [recentConversations, setRecentConversations] = useState<ChatThread[]>([])

  useEffect(() => {
    fetchProjects()
    // Disable fetching recent conversations to avoid 401 errors
    // fetchRecentConversations()
    
    // Set default to General Chat if no project is selected
    if (!selectedProject) {
      actions.setSelectedProject(GENERAL_CHAT_ID)
    }
  }, [])

  const fetchRecentConversations = async () => {
    // Disabled to avoid 401 authentication errors
    // Authentication is not yet implemented in the frontend
    console.log('Recent conversations disabled - authentication required')
    setRecentConversations([])
  }

  const fetchProjects = async () => {
    // Use mock data directly to avoid 401 authentication errors
    console.log('Using mock projects - authentication not yet implemented')
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Legal Contracts Analysis',
        description: 'Analyze and extract key terms from vendor contracts and agreements',
      },
      {
        id: 'proj-2',
        name: 'Q4 Financial Reports',
        description: 'Review quarterly financial statements and audit reports',
      },
      {
        id: 'proj-3',
        name: 'HR Policy Documents',
        description: 'Employee handbook and policy documentation review',
      },
    ]
    setProjects(mockProjects)
  }

  const handleSelectProject = (projectId: string) => {
    actions.setSelectedProject(projectId)
    setShowProjectSelect(false)

    if (projectId === KNOWLEDGE_BASE_ID) {
      toast({
        title: 'Knowledge Base selected',
        description: 'Chatting with Knowledge Base documents',
      })
    } else if (projectId === GENERAL_CHAT_ID) {
      toast({
        title: 'General chat',
        description: 'You can ask any question',
      })
    } else {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        toast({
          title: 'Project selected',
          description: `Now chatting in ${project.name}`,
        })
      }
    }

    // Clear messages and conversation when switching context
    actions.clearMessages()
  }

  // Real API integration with optimistic updates
  const sendChatMessage = useCallback(
    async (content: string) => {
      // General Chat doesn't require a project, so we allow it
      // Only require project selection for project-specific chats
      if (
        !selectedProject &&
        selectedProject !== GENERAL_CHAT_ID &&
        selectedProject !== KNOWLEDGE_BASE_ID
      ) {
        toast({
          title: 'No context selected',
          description: 'Please select a context first',
          variant: 'destructive',
        })
        return
      }

      actions.setIsStreaming(true)

      // Determine projectId for message (null for General Chat/Knowledge Base)
      const projectIdForMessage =
        selectedProject === GENERAL_CHAT_ID || selectedProject === KNOWLEDGE_BASE_ID
          ? undefined
          : selectedProject

      const assistantMessage: ChatMessageType = {
        id: `msg-${Date.now()}-assistant`,
        projectId: projectIdForMessage,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }

      // Optimistic update - add assistant message immediately
      actions.appendMessage(assistantMessage)

      let fullContent = ''

      try {
        // Determine project_id: null for General Chat/Knowledge Base, actual ID for projects
        const projectIdForRequest =
          selectedProject === GENERAL_CHAT_ID || selectedProject === KNOWLEDGE_BASE_ID
            ? undefined
            : selectedProject

        await chatApi.sendMessageStreaming(
          {
            projectId: projectIdForRequest,
            content,
            useKnowledgeBase: useKnowledgeBase,
            conversationId: conversationId || undefined,
          },
          {
            onToken: token => {
              fullContent += token
              // Update message content as tokens stream in
              actions.updateMessage(assistantMessage.id, { content: fullContent })
            },
            onComplete: completedMessage => {
              // Update with final message including sources
              actions.updateMessage(assistantMessage.id, {
                content: completedMessage.content,
                sources: completedMessage.sources,
              })
              actions.setIsStreaming(false)

              // Update conversation_id if returned from backend
              const convId = (completedMessage as any).conversationId
              if (convId && !conversationId) {
                actions.setConversationId(convId)
              }
            },
            onError: error => {
              actions.setIsStreaming(false)
              console.error('Chat error:', error)

              // Update message with error
              actions.updateMessage(assistantMessage.id, {
                content: fullContent + (fullContent ? '\n\n' : '') + '[Error generating response]',
              })

              toast({
                title: 'Error sending message',
                description: error.message || 'Failed to generate response. Please try again.',
                variant: 'destructive',
              })
            },
          }
        )
      } catch (error: any) {
        actions.setIsStreaming(false)

        // Remove failed message on error
        actions.setMessages(messages.filter(m => m.id !== assistantMessage.id))

        toast({
          title: 'Error',
          description: error.message || 'Failed to send message',
          variant: 'destructive',
        })
      }
    },
    [selectedProject, useKnowledgeBase, conversationId, messages, toast, actions]
  )

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isStreaming) return

    setIsLoading(true)

    try {
      // Determine project_id for user message (null for General Chat/Knowledge Base)
      const projectId =
        selectedProject === KNOWLEDGE_BASE_ID || selectedProject === GENERAL_CHAT_ID
          ? undefined
          : selectedProject

      // Optimistic update - add user message immediately
      const userMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        projectId: projectId,
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
      }

      actions.appendMessage(userMessage)

      // Clear input immediately for better UX
      const messageContent = input
      actions.setInput('')

      // Send to backend
      await sendChatMessage(messageContent)
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const getSelectedContextName = () => {
    if (selectedProject === KNOWLEDGE_BASE_ID) {
      return 'Knowledge Base'
    } else if (selectedProject === GENERAL_CHAT_ID) {
      return 'General Chat'
    } else {
      const project = projects.find(p => p.id === selectedProject)
      return project?.name || 'Select Project'
    }
  }

  const selectedProjectName = getSelectedContextName()

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-medium text-foreground">{selectedProjectName}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Knowledge Base Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="knowledge-base"
                checked={useKnowledgeBase}
                onCheckedChange={checked => {
                  actions.setUseKnowledgeBase(checked)
                  toast({
                    title: checked ? 'Knowledge Base enabled' : 'Knowledge Base disabled',
                    description: checked
                      ? 'Chat will use indexed documents'
                      : 'Chat will use general knowledge only',
                  })
                }}
              />
              <Label
                htmlFor="knowledge-base"
                className="text-sm cursor-pointer text-muted-foreground"
              >
                <BookOpen className="inline h-4 w-4 mr-1" />
                Knowledge Base (Indexed Documents)
              </Label>
            </div>
            <Popover open={showProjectSelect} onOpenChange={setShowProjectSelect}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {selectedProject === GENERAL_CHAT_ID ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : selectedProject === KNOWLEDGE_BASE_ID ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                  <span>
                    {selectedProject === GENERAL_CHAT_ID
                      ? 'General Chat'
                      : selectedProject === KNOWLEDGE_BASE_ID
                        ? 'Knowledge Base'
                        : projects.find(p => p.id === selectedProject)?.name || 'General Chat'}
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
                        ? 'No projects available. Create a project first.'
                        : 'No projects found matching your search.'}
                    </CommandEmpty>
                    {projects.length > 0 ? (
                      <CommandGroup heading={`Projects (${projects.length})`}>
                        {projects.map(project => (
                          <CommandItem
                            key={project.id}
                            value={`${project.name} ${project.description || ''} ${project.id}`}
                            onSelect={() => {
                              handleSelectProject(project.id)
                              setShowProjectSelect(false)
                            }}
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
                    ) : null}
                    <CommandGroup heading="Chat Options">
                      <CommandItem
                        value="General Chat general"
                        onSelect={() => {
                          handleSelectProject(GENERAL_CHAT_ID)
                          setShowProjectSelect(false)
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">General Chat</span>
                      </CommandItem>
                      <CommandItem
                        value="Knowledge Base knowledge"
                        onSelect={() => {
                          handleSelectProject(KNOWLEDGE_BASE_ID)
                          setShowProjectSelect(false)
                        }}
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
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedProject === KNOWLEDGE_BASE_ID
                  ? 'Ask questions about your Knowledge Base documents'
                  : selectedProject === GENERAL_CHAT_ID
                    ? 'Ask any question - I can help with general topics or search your documents'
                    : selectedProject
                      ? 'Ask questions about your project documents'
                      : 'Select a context to start chatting'}
              </p>
            </div>
          ) : (
            <ul role="list" className="space-y-4 max-w-3xl mx-auto">
              {messages.map(message => (
                <li key={message.id} role="listitem">
                  <Card
                    className={
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                        : 'bg-muted mr-auto max-w-[80%]'
                    }
                  >
                    <CardContent className="p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Enhanced code blocks with syntax highlighting
                            code: ({ node, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '')
                              const language = match ? match[1] : ''
                              const codeString = String(children).replace(/\n$/, '')

                              if (match) {
                                // Code block with language
                                return (
                                  <div className="not-prose my-4 rounded-lg overflow-hidden border border-border">
                                    <SyntaxHighlighter
                                      language={language}
                                      style={oneDark}
                                      customStyle={{
                                        margin: 0,
                                        padding: '1rem',
                                        fontSize: '0.875rem',
                                        background: 'hsl(var(--muted))',
                                      }}
                                      PreTag="div"
                                    >
                                      {codeString}
                                    </SyntaxHighlighter>
                                  </div>
                                )
                              }

                              // Inline code
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground"
                                  {...props}
                                >
                                  {children}
                                </code>
                              )
                            },
                            // Pre blocks - handled by code component above
                            pre: ({ children }: any) => {
                              return <>{children}</>
                            },
                            // Enhanced headings with better spacing
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground border-b border-border pb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold mt-5 mb-2 text-foreground">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-base font-semibold mt-3 mb-1 text-foreground">
                                {children}
                              </h4>
                            ),
                            // Enhanced lists with better spacing
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside my-3 space-y-1 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside my-3 space-y-1 ml-4">
                                {children}
                              </ol>
                            ),
                            // Task lists (GFM)
                            li: ({ children, className }: any) => {
                              const isTaskList = className?.includes('task-list-item')
                              return <li className={isTaskList ? 'list-none' : ''}>{children}</li>
                            },
                            // Enhanced paragraphs
                            p: ({ children }) => (
                              <p className="my-3 leading-7 text-foreground">{children}</p>
                            ),
                            // Enhanced links
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-primary underline hover:text-primary/80 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            // Enhanced blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground bg-muted/50 py-2 rounded-r">
                                {children}
                              </blockquote>
                            ),
                            // Tables (GFM support)
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full border-collapse border border-border rounded-lg">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => (
                              <tr className="border-b border-border hover:bg-muted/50">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-4 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-4 py-2 text-foreground border-r border-border last:border-r-0">
                                {children}
                              </td>
                            ),
                            // Horizontal rules
                            hr: () => <hr className="my-6 border-t border-border" />,
                            // Strong/bold text
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">{children}</strong>
                            ),
                            // Emphasis/italic text
                            em: ({ children }) => (
                              <em className="italic text-foreground">{children}</em>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs font-semibold mb-2">Sources:</p>
                          {message.sources.map(source => (
                            <div key={source.id} className="text-xs mb-2">
                              <p className="font-medium">{source.name}</p>
                              <p className="text-muted-foreground">{source.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-border">
          <div className="p-4">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => actions.setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedProject === GENERAL_CHAT_ID
                      ? 'Ask any question...'
                      : selectedProject === KNOWLEDGE_BASE_ID
                        ? 'Ask about your Knowledge Base documents...'
                        : 'Type your message...'
                  }
                  className="flex-1 resize-none min-h-[44px] max-h-[200px]"
                  rows={1}
                  disabled={isStreaming || isLoading}
                />
                <Button type="submit" disabled={!input.trim() || isStreaming || isLoading}>
                  {isStreaming || isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Recent Chats Preview - show when no messages or when there are recent chats */}
          {messages.length === 0 && (
            <RecentChatsPreview
              chats={recentConversations.slice(0, 3)}
              onSelect={async chatId => {
                try {
                  setIsLoading(true)
                  // Fetch full conversation with all messages
                  const convResponse = await conversationsApi.getConversation(chatId, true)
                  if (convResponse.success && convResponse.data) {
                    const conv = convResponse.data
                    // Filter out system messages and convert to ChatMessage format
                    const userMessages = (conv.messages || []).filter(
                      msg => msg.role === 'user' || msg.role === 'assistant'
                    )

                    // Convert messages to ChatMessageType format
                    const convertedMessages: ChatMessageType[] = userMessages.map(msg => ({
                      id: msg.id,
                      projectId: conv.project_id || undefined,
                      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                      content: msg.content,
                      timestamp: msg.created_at,
                      sources: msg.sources?.map((s: any) => ({
                        id: s.metadata?.doc_id || s.id || '',
                        name: s.metadata?.source || s.name || 'Document',
                        snippet: s.content || s.snippet || '',
                        page: s.metadata?.page,
                      })),
                    }))

                    actions.setMessages(convertedMessages)
                    actions.setConversationId(conv.id) // Set conversation ID for memory

                    // Set the project context if available
                    if (conv.project_id) {
                      actions.setSelectedProject(conv.project_id)
                    } else {
                      actions.setSelectedProject(GENERAL_CHAT_ID)
                    }

                    toast({
                      title: 'Conversation loaded',
                      description: `Loaded ${convertedMessages.length} messages`,
                    })
                  } else {
                    throw new Error(convResponse.message || 'Failed to load conversation')
                  }
                } catch (error: any) {
                  console.error('Failed to load conversation:', error)
                  toast({
                    title: 'Error loading conversation',
                    description: error.message || 'Failed to load conversation messages',
                    variant: 'destructive',
                  })
                } finally {
                  setIsLoading(false)
                }
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
