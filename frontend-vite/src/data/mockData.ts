export interface Project {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  memberCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  memberSince: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  id: string;
  name: string;
  page?: number;
  snippet: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "processing" | "indexed" | "failed";
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
}

export const mockUser: User = {
  id: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  initials: "JD",
  memberSince: "December 2024",
};

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Legal Contracts Analysis",
    description: "Analyze and extract key terms from vendor contracts and agreements",
    documentCount: 24,
    memberCount: 3,
    lastUpdated: "2024-12-10T14:30:00Z",
    createdAt: "2024-11-15T09:00:00Z",
  },
  {
    id: "proj-2",
    name: "Q4 Financial Reports",
    description: "Review quarterly financial statements and audit reports",
    documentCount: 12,
    memberCount: 5,
    lastUpdated: "2024-12-09T16:45:00Z",
    createdAt: "2024-10-01T10:00:00Z",
  },
  {
    id: "proj-3",
    name: "HR Policy Documents",
    description: "Employee handbook and policy documentation review",
    documentCount: 8,
    memberCount: 2,
    lastUpdated: "2024-12-08T11:20:00Z",
    createdAt: "2024-12-01T08:30:00Z",
  },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
  "proj-1": [
    {
      id: "msg-1",
      role: "user",
      content: "What are the key termination clauses in our vendor contracts?",
      timestamp: "2024-12-10T14:00:00Z",
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "Based on my analysis of your vendor contracts, here are the key termination clauses:\n\n**1. Termination for Convenience**\nMost contracts allow either party to terminate with 30-90 days written notice without cause.\n\n**2. Termination for Breach**\nMaterial breach allows immediate termination after a cure period (typically 30 days).\n\n**3. Termination for Insolvency**\nAutomatic termination rights if either party becomes insolvent or files for bankruptcy.",
      timestamp: "2024-12-10T14:01:00Z",
      sources: [
        { id: "doc-1", name: "Vendor Agreement - Acme Corp.pdf", page: 12, snippet: "Either party may terminate this Agreement for convenience upon ninety (90) days prior written notice..." },
        { id: "doc-2", name: "Master Services Agreement.pdf", page: 8, snippet: "In the event of a material breach, the non-breaching party may terminate..." },
      ],
    },
  ],
  "proj-2": [],
  "proj-3": [],
};

export const mockDocuments: Record<string, ProjectDocument[]> = {
  "proj-1": [
    { id: "doc-1", name: "Vendor Agreement - Acme Corp.pdf", size: 2456000, type: "application/pdf", status: "indexed", uploadedAt: "2024-12-05T10:00:00Z", uploadedBy: "John Doe" },
    { id: "doc-2", name: "Master Services Agreement.pdf", size: 1890000, type: "application/pdf", status: "indexed", uploadedAt: "2024-12-06T11:30:00Z", uploadedBy: "John Doe" },
    { id: "doc-3", name: "NDA - Partner Inc.pdf", size: 567000, type: "application/pdf", status: "processing", uploadedAt: "2024-12-10T14:20:00Z", uploadedBy: "Jane Smith" },
  ],
  "proj-2": [
    { id: "doc-4", name: "Q4 Financial Statement.pdf", size: 4500000, type: "application/pdf", status: "indexed", uploadedAt: "2024-12-01T09:00:00Z", uploadedBy: "John Doe" },
  ],
  "proj-3": [],
};

export const mockMembers: Record<string, ProjectMember[]> = {
  "proj-1": [
    { id: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-11-15T09:00:00Z" },
    { id: "user-2", name: "Jane Smith", email: "jane.smith@example.com", initials: "JS", role: "editor", joinedAt: "2024-11-20T14:00:00Z" },
    { id: "user-3", name: "Mike Johnson", email: "mike.j@example.com", initials: "MJ", role: "viewer", joinedAt: "2024-12-01T10:00:00Z" },
  ],
  "proj-2": [
    { id: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-10-01T10:00:00Z" },
  ],
  "proj-3": [
    { id: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-12-01T08:30:00Z" },
  ],
};

export type PromptCategory = "analysis" | "extraction" | "summary" | "comparison" | "general";

export interface SavedPrompt {
  id: string;
  title: string;
  text: string;
  category: PromptCategory;
  tags?: string[]; // Tags from Langfuse for filtering and organization
  createdAt: string;
  updatedAt: string;
}

export const promptCategories: { value: PromptCategory; label: string }[] = [
  { value: "analysis", label: "Analysis" },
  { value: "extraction", label: "Extraction" },
  { value: "summary", label: "Summary" },
  { value: "comparison", label: "Comparison" },
  { value: "general", label: "General" },
];

export const mockPrompts: SavedPrompt[] = [
  {
    id: "prompt-1",
    title: "Key Terms Extraction",
    text: "Extract all key terms, definitions, and important clauses from this document. Present them in a structured format with the term name, its definition, and the page/section where it appears.",
    category: "extraction",
    createdAt: "2024-11-20T10:00:00Z",
    updatedAt: "2024-12-01T14:30:00Z",
  },
  {
    id: "prompt-2",
    title: "Document Summary",
    text: "Provide a comprehensive summary of this document including:\n1. Main purpose and objectives\n2. Key stakeholders mentioned\n3. Important dates and deadlines\n4. Critical action items or requirements",
    category: "summary",
    createdAt: "2024-11-22T09:00:00Z",
    updatedAt: "2024-11-22T09:00:00Z",
  },
  {
    id: "prompt-3",
    title: "Risk Analysis",
    text: "Analyze this document for potential risks and liabilities. Identify any clauses that could pose legal, financial, or operational risks. Rate each risk as high, medium, or low and explain the reasoning.",
    category: "analysis",
    createdAt: "2024-11-25T11:00:00Z",
    updatedAt: "2024-12-05T16:20:00Z",
  },
  {
    id: "prompt-4",
    title: "Contract Comparison",
    text: "Compare the terms in this document with standard industry practices. Highlight any unusual or non-standard clauses that may require additional review or negotiation.",
    category: "comparison",
    createdAt: "2024-12-01T08:00:00Z",
    updatedAt: "2024-12-01T08:00:00Z",
  },
  {
    id: "prompt-5",
    title: "Compliance Check",
    text: "Review this document for compliance with relevant regulations and standards. List any potential compliance issues or gaps that need to be addressed.",
    category: "analysis",
    createdAt: "2024-12-03T14:00:00Z",
    updatedAt: "2024-12-03T14:00:00Z",
  },
];
