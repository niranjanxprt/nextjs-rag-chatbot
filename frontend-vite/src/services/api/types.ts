// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  memberCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Document Types
export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  status: "processing" | "indexed" | "failed";
  uploadedAt: string;
  uploadedBy: string;
}

export interface UploadDocumentRequest {
  projectId: string;
  file: File;
}

// Chat Types
export interface ChatMessage {
  id: string;
  projectId?: string; // Optional - null for Knowledge Base or General Chat
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
  conversationId?: string; // Conversation ID for chat memory
}

export interface DocumentSource {
  id: string;
  name: string;
  page?: number;
  snippet: string;
}

export interface SendMessageRequest {
  projectId?: string; // Optional - null for Knowledge Base or General Chat
  content: string;
  useKnowledgeBase?: boolean;
}

export interface StreamingMessageCallback {
  onToken: (token: string) => void;
  onComplete: (message: ChatMessage) => void;
  onError: (error: Error) => void;
}

// Member Types
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
}

export interface InviteMemberRequest {
  projectId: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

export interface UpdateMemberRoleRequest {
  projectId: string;
  memberId: string;
  role: "admin" | "editor" | "viewer";
}

// Prompt Types
export type PromptCategory = "analysis" | "extraction" | "summary" | "comparison" | "general";

export interface SavedPrompt {
  id: string;
  userId: string;
  title: string;
  text: string;
  category: PromptCategory;
  tags?: string[]; // Tags from Langfuse for filtering and organization
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  title: string;
  text: string;
  category: PromptCategory;
}

export interface UpdatePromptRequest {
  title?: string;
  text?: string;
  category?: PromptCategory;
}

// Knowledge Base Types
export interface KnowledgeBaseDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  status: "processing" | "indexed" | "failed";
  size?: number;
  errorMessage?: string;
}

// Chat Request Types with Knowledge Base flags
export interface SendCentralChatRequest {
  query: string;
  useKnowledgeBase: true; // Always true for central chat
  attachments?: File[];
}

export interface SendProjectChatRequest {
  query: string;
  projectId: string;
  includeKnowledgeBase: boolean;
  attachments?: File[];
}

// User Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  company?: string;
  location?: string;
  memberSince: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  location?: string;
}

export interface NotificationPreferences {
  emailDigest: boolean;
  projectUpdates: boolean;
  newFeatures: boolean;
  securityAlerts: boolean;
}
