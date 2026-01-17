import { useState, useCallback, useEffect, useMemo } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Database, Search, Filter, ChevronDown, ChevronUp, Square, CheckSquare2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { KnowledgeBaseDocument } from "@/services/api/types";
import { knowledgeBaseApi } from "@/services/api/knowledgeBase";

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

export default function KnowledgeBase() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [deletingDoc, setDeletingDoc] = useState<KnowledgeBaseDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "indexed" | "failed">("all");
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await knowledgeBaseApi.list();
      console.log("Knowledge Base documents fetched:", docs.length, docs);
      setDocuments(docs);
      
      if (docs.length === 0) {
        console.log("No Knowledge Base documents found. This could mean:");
        console.log("1. No documents have been uploaded to Knowledge Base yet");
        console.log("2. All uploaded documents have a project_id (they belong to projects)");
        console.log("3. There was an error fetching documents");
      }
    } catch (error: any) {
      console.error("Error fetching Knowledge Base documents:", error);
      toast({
        title: "Error fetching documents",
        description: error.message || "Could not load knowledge base documents.",
        variant: "destructive",
      });
      setDocuments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents based on search and status
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    return {
      all: documents.length,
      indexed: documents.filter((d) => d.status === "indexed").length,
      processing: documents.filter((d) => d.status === "processing").length,
      failed: documents.filter((d) => d.status === "failed").length,
    };
  }, [documents]);

  const toggleErrorExpansion = (docId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const toggleSelectDoc = (docId: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KnowledgeBase.tsx:138',message:'handleBulkDelete called',data:{selected_count:selectedDocs.size,selected_ids:Array.from(selectedDocs).slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    
    // Check if any indexed documents are selected
    const selectedDocuments = documents.filter((doc) => selectedDocs.has(doc.id));
    const indexedCount = selectedDocuments.filter((doc) => doc.status === "indexed").length;
    const failedCount = selectedDocuments.filter((doc) => doc.status === "failed").length;
    
    // Safety check: Warn if indexed documents are selected
    if (indexedCount > 0) {
      const confirmed = window.confirm(
        `⚠️ WARNING: You are about to delete ${indexedCount} indexed document(s) and ${failedCount} failed document(s).\n\nIndexed documents are successfully processed and searchable. Are you sure you want to delete them?`
      );
      if (!confirmed) return;
    }
    
    // Warn user for large deletions
    if (selectedDocs.size > 50) {
      const confirmed = window.confirm(
        `You are about to delete ${selectedDocs.size} documents. This may take a while. Continue?`
      );
      if (!confirmed) return;
    }
    
    setBulkDeleting(true);
    let pollInterval: NodeJS.Timeout | null = null;
    try {
      const selectedIds = Array.from(selectedDocs);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KnowledgeBase.tsx:143',message:'Calling bulkDelete API',data:{ids:selectedIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      // Start polling for document count updates during deletion
      pollInterval = setInterval(async () => {
        try {
          const updatedDocs = await knowledgeBaseApi.list();
          setDocuments(updatedDocs);
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000); // Poll every 2 seconds
      
      const result = await knowledgeBaseApi.bulkDelete(selectedIds);
      
      // Stop polling once deletion completes
      if (pollInterval) clearInterval(pollInterval);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KnowledgeBase.tsx:147',message:'Bulk delete result received',data:{success_count:result.success_count,failed_count:result.failed_count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      // Remove successfully deleted documents
      setDocuments((prev) => prev.filter((doc) => !selectedDocs.has(doc.id)));
      setSelectedDocs(new Set());
      
      toast({
        title: "Bulk delete completed",
        description: `${result.success_count} deleted, ${result.failed_count} failed`,
        variant: result.failed_count > 0 ? "destructive" : "default",
      });
      
      // Final refresh to ensure UI is up to date
      await fetchDocuments();
    } catch (error: any) {
      // Stop polling on error
      if (pollInterval) clearInterval(pollInterval);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KnowledgeBase.tsx:160',message:'Bulk delete error caught',data:{error_type:error?.constructor?.name,error_message:error?.message,error_status:error?.statusCode,error_detail:error?.detail},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4,H5'})}).catch(()=>{});
      // #endregion
      
      console.error("Bulk delete error:", error);
      
      // Extract detailed error message
      let errorMessage = "Could not delete selected documents.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      } else if (error?.statusCode === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error?.statusCode === 403) {
        errorMessage = "You don't have permission to delete these documents.";
      } else if (error?.statusCode >= 500) {
        errorMessage = "Server error. Please try again or contact support.";
      }
      
      toast({
        title: "Bulk delete failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Ensure polling is stopped
      if (pollInterval) clearInterval(pollInterval);
      setBulkDeleting(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async (file: File) => {
    // Optimistic UI update or wait? Let's show progress.
    // For progress tracking with multiple files, we'd need a stable ID relative to file?
    // Using simple timestamp for key for now, actual ID comes from backend success.
    const tempId = `temp-${Date.now()}-${file.name}`;

    setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

    try {
      const newDoc = await knowledgeBaseApi.upload(file, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [tempId]: progress }));
      });

      // Replace or add to list
      setDocuments(prev => [newDoc, ...prev]);

      toast({
        title: "Document uploaded",
        description: `"${file.name}" has been uploaded successfully.`,
      });

      // If status is 'processing', maybe poll? 
      // For simplicity, we just leave it. The user can refresh or we implement polling.

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || `Failed to upload "${file.name}"`,
        variant: "destructive",
      });
    } finally {
      setUploadProgress((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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

      files.forEach(handleUpload);
    },
    [toast]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );
    files.forEach(handleUpload);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    try {
      await knowledgeBaseApi.delete(deletingDoc.id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== deletingDoc.id));
      toast({
        title: "Document removed",
        description: `"${deletingDoc.filename}" has been removed.`,
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not remove document.",
        variant: "destructive",
      });
    }
    setDeletingDoc(null);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">Knowledge Base</h1>
              <p className="text-muted-foreground">
                Workspace-wide foundation documents used across all chats
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Add regulations, policies, and reference docs that apply across all clients/projects.
          </p>
          
          {/* Status Counts */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="gap-1">
              All: {statusCounts.all}
            </Badge>
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Indexed: {statusCounts.indexed}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3" />
              Processing: {statusCounts.processing}
            </Badge>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Failed: {statusCounts.failed}
            </Badge>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${isDragging
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "processing" | "indexed" | "failed")
            }
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="indexed">Indexed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          {selectedDocs.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedDocs.size})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Foundation Documents ({filteredDocuments.length} of {documents.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs"
              >
                {selectedDocs.size === filteredDocuments.length ? (
                  <>
                    <CheckSquare2 className="h-3 w-3 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Select All
                  </>
                )}
              </Button>
            </div>
            <div className="border border-border rounded-lg divide-y divide-border">
              {filteredDocuments.map((doc) => {
                const status = statusConfig[doc.status] || statusConfig.processing;
                const StatusIcon = status.icon;
                const isExpanded = expandedErrors.has(doc.id);
                const hasError = doc.status === "failed" && doc.errorMessage;

                return (
                  <div
                    key={doc.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      doc.status === "failed" ? "bg-destructive/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="shrink-0 p-1 hover:bg-muted rounded"
                        >
                          {selectedDocs.has(doc.id) ? (
                            <CheckSquare2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {doc.size && <span>{formatFileSize(doc.size)}</span>}
                            {doc.size && <span>•</span>}
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                          {hasError && (
                            <div className="mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => toggleErrorExpansion(doc.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide Error
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Show Error
                                  </>
                                )}
                              </Button>
                              {isExpanded && (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                                  {doc.errorMessage}
                                </div>
                              )}
                            </div>
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
                  </div>
                );
              })}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              No foundation documents yet
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Upload documents that apply across your entire workspace
            </p>
            <label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">Upload your first document</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              No matching documents
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No documents found matching "${searchQuery}"`
                : `No documents with status "${statusFilter}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{deletingDoc?.filename}" from the workspace Knowledge Base? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
