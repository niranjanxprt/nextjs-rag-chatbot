import { useState, useCallback } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ProjectDocument } from "@/data/mockData";

interface DocumentsTabProps {
  projectId: string;
  initialDocuments: ProjectDocument[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig = {
  processing: { label: "Processing", icon: Loader2, variant: "secondary" as const, className: "animate-spin" },
  indexed: { label: "Indexed", icon: CheckCircle, variant: "default" as const, className: "text-success" },
  failed: { label: "Failed", icon: AlertCircle, variant: "destructive" as const, className: "" },
};

export function DocumentsTab({ projectId, initialDocuments }: DocumentsTabProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [deletingDoc, setDeletingDoc] = useState<ProjectDocument | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const simulateUpload = (file: File) => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newDoc: ProjectDocument = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "processing",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "John Doe",
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setUploadProgress((prev) => ({ ...prev, [docId]: 0 }));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate processing completion
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === docId ? { ...doc, status: "indexed" } : doc
            )
          );
          setUploadProgress((prev) => {
            const { [docId]: _, ...rest } = prev;
            return rest;
          });
          toast({
            title: "Document indexed",
            description: `"${file.name}" is now ready for querying.`,
          });
        }, 1500);
      }
      setUploadProgress((prev) => ({ ...prev, [docId]: progress }));
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (files.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }

    files.forEach(simulateUpload);
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );
    files.forEach(simulateUpload);
    e.target.value = "";
  };

  const handleDelete = () => {
    if (!deletingDoc) return;
    setDocuments((prev) => prev.filter((doc) => doc.id !== deletingDoc.id));
    toast({
      title: "Document deleted",
      description: `"${deletingDoc.name}" has been removed.`,
    });
    setDeletingDoc(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-1">
          Drag and drop PDF files here
        </p>
        <p className="text-xs text-muted-foreground mb-3">or</p>
        <label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">Browse Files</span>
          </Button>
        </label>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Documents ({documents.length})
          </h3>
          <div className="border border-border rounded-lg divide-y divide-border">
            {documents.map((doc) => {
              const status = statusConfig[doc.status];
              const StatusIcon = status.icon;
              const isUploading = uploadProgress[doc.id] !== undefined;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                      {isUploading && (
                        <Progress
                          value={uploadProgress[doc.id]}
                          className="h-1 mt-2 w-32"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className={`h-3 w-3 ${status.className}`} />
                      {status.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingDoc(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet. Upload PDFs to start analyzing.
          </p>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDoc?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
