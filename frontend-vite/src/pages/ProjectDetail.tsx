import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  memberCount: number;
  lastUpdated: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "processing" | "indexed" | "failed";
  uploadedAt: string;
  uploadedBy: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
      fetchDocuments(id);
    }
  }, [id]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`);
      // const data = await response.json();

      // Mock data for now
      const mockProject: Project = {
        id: projectId,
        name: "Legal Contracts Analysis",
        description: "Analyze and extract key terms from vendor contracts and agreements",
        documentCount: 3,
        memberCount: 3,
        lastUpdated: "2024-12-10T14:30:00Z",
        createdAt: "2024-11-15T09:00:00Z",
      };

      setProject(mockProject);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (projectId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/documents`);
      // const data = await response.json();

      // Mock data for now
      const mockDocuments: Document[] = [
        {
          id: "doc-1",
          name: "Vendor Agreement - Acme Corp.pdf",
          size: 2456000,
          type: "application/pdf",
          status: "indexed",
          uploadedAt: "2024-12-05T10:00:00Z",
          uploadedBy: "John Doe",
        },
        {
          id: "doc-2",
          name: "Master Services Agreement.pdf",
          size: 1890000,
          type: "application/pdf",
          status: "indexed",
          uploadedAt: "2024-12-06T11:30:00Z",
          uploadedBy: "John Doe",
        },
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Only PDF files are supported",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Replace with actual API call
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('project_id', id || '');
      // const response = await fetch('http://localhost:8000/api/v1/documents/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // const uploadedDoc = await response.json();

      // Mock upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "processing",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "Current User",
      };

      setDocuments([newDocument, ...documents]);

      toast({
        title: "Upload completed",
        description: `${file.name} has been uploaded successfully`,
      });

      // Simulate processing completion
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDocument.id ? { ...doc, status: "indexed" } : doc
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {project.name}
            </h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
        </div>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Manage documents for this project
                </CardDescription>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No documents yet</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload your first document
                </Button>
              </div>
            ) : (
              <ul role="list" className="space-y-4">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    role="listitem"
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.size)} • Uploaded{" "}
                          {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === "processing" && (
                        <span className="text-sm text-yellow-600 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          processing
                        </span>
                      )}
                      {doc.status === "indexed" && (
                        <span className="text-sm text-green-600">indexed</span>
                      )}
                      {doc.status === "failed" && (
                        <span className="text-sm text-red-600">failed</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>
              Ask questions about the documents in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/20">
                <p className="text-sm text-muted-foreground text-center">
                  Chat interface coming soon
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled
                />
                <Button disabled>Send</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
