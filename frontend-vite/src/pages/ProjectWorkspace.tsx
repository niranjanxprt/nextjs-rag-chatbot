import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, FileText, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatTab } from "@/components/chat/ChatTab";
import { DocumentsTab } from "@/components/documents/DocumentsTab";
import { MembersTab } from "@/components/members/MembersTab";
import {
  mockProjects,
  mockChatMessages,
  mockDocuments,
  mockMembers,
} from "@/data/mockData";

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const project = mockProjects.find((p) => p.id === projectId);
  const messages = projectId ? mockChatMessages[projectId] || [] : [];
  const documents = projectId ? mockDocuments[projectId] || [] : [];
  const members = projectId ? mockMembers[projectId] || [] : [];

  if (!project) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="link" onClick={() => navigate("/")}>
            Go back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 px-6">
            <TabsTrigger
              value="chat"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Documents
              {documents.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                  {documents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Members
              {members.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                  {members.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
            <ChatTab projectId={projectId || ""} initialMessages={messages} />
          </TabsContent>

          <TabsContent value="documents" className="flex-1 mt-0 overflow-auto">
            <DocumentsTab projectId={projectId || ""} initialDocuments={documents} />
          </TabsContent>

          <TabsContent value="members" className="flex-1 mt-0 overflow-auto">
            <MembersTab projectId={projectId || ""} initialMembers={members} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
