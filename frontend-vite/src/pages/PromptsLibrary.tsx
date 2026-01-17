import { useState, useMemo } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptModal } from "@/components/prompts/PromptModal";
import { useToast } from "@/hooks/use-toast";
import {
  promptCategories,
  type SavedPrompt,
  type PromptCategory,
} from "@/data/mockData";
import { usePrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from "@/hooks/usePrompts";
import { SYSTEM_PROMPTS } from "@/constants/prompts";

export default function PromptsLibrary() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "all">("all");
  const [hideSystemPrompts, setHideSystemPrompts] = useState(false);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:35',message:'usePrompts hook called',data:{hideSystemPrompts,usingHook:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { data: promptsData, isLoading } = usePrompts(hideSystemPrompts);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:37',message:'usePrompts result',data:{hasData:!!promptsData,dataLength:promptsData?.length||0,isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();
  const deletePromptMutation = useDeletePrompt();
  
  const prompts = promptsData || [];
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:43',message:'Prompts array ready',data:{promptsLength:prompts.length,isUsingAPI:prompts.length>0||isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<SavedPrompt | null>(null);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesSearch =
        searchQuery === "" ||
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.text.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || prompt.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, categoryFilter]);

  const handleCreatePrompt = async (data: {
    title: string;
    text: string;
    category: PromptCategory;
  }) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:61',message:'handleCreatePrompt called',data:{title:data.title,category:data.category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:67',message:'Before mutation call',data:{usingMutation:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      await createPromptMutation.mutateAsync({
        title: data.title,
        text: data.text,
        category: data.category,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:72',message:'Mutation success',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      toast({
        title: "Prompt created",
        description: `"${data.title}" has been saved to your library.`,
      });
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromptsLibrary.tsx:77',message:'Mutation error',data:{error:error.message,hasError:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      toast({
        title: "Error",
        description: error.message || "Failed to create prompt",
        variant: "destructive",
      });
    }
  };

  const handleEditPrompt = async (data: {
    title: string;
    text: string;
    category: PromptCategory;
  }) => {
    if (!editingPrompt) return;
    
    // Protect system prompts
    if (SYSTEM_PROMPTS.includes(editingPrompt.id)) {
      toast({
        title: "Cannot edit system prompt",
        description: "System prompts are required for the RAG pipeline and cannot be edited.",
        variant: "destructive",
      });
      setEditingPrompt(null);
      return;
    }
    
    try {
      await updatePromptMutation.mutateAsync({
        id: editingPrompt.id,
        data: {
          title: data.title,
          text: data.text,
          category: data.category,
        },
      });
      setEditingPrompt(null);
      toast({
        title: "Prompt updated",
        description: `"${data.title}" has been updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update prompt",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async () => {
    if (!deletingPrompt) return;
    
    // Protect system prompts
    if (SYSTEM_PROMPTS.includes(deletingPrompt.id)) {
      toast({
        title: "Cannot delete system prompt",
        description: "System prompts are required for the RAG pipeline and cannot be deleted.",
        variant: "destructive",
      });
      setDeletingPrompt(null);
      return;
    }
    
    try {
      await deletePromptMutation.mutateAsync(deletingPrompt.id);
      toast({
        title: "Prompt deleted",
        description: `"${deletingPrompt.title}" has been removed.`,
      });
      setDeletingPrompt(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Prompts Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Save and manage your frequently used prompts
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as PromptCategory | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {promptCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-system"
              checked={hideSystemPrompts}
              onCheckedChange={(checked) => setHideSystemPrompts(checked === true)}
            />
            <Label
              htmlFor="hide-system"
              className="text-sm font-normal cursor-pointer"
            >
              Hide system prompts
            </Label>
          </div>
        </div>

        {/* Prompts Grid */}
        {isLoading ? (
          <div className="border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
            {prompts.length === 0 ? (
              <>
                <h3 className="font-medium text-foreground mb-1">
                  No prompts yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Create your first prompt template to quickly reuse common
                  questions across your projects.
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  Create Your First Prompt
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-medium text-foreground mb-1">
                  No matching prompts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={setEditingPrompt}
                onDelete={setDeletingPrompt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Prompt Modal */}
      <PromptModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreatePrompt}
      />

      {/* Edit Prompt Modal */}
      <PromptModal
        open={!!editingPrompt}
        onOpenChange={(open) => !open && setEditingPrompt(null)}
        prompt={editingPrompt}
        onSubmit={handleEditPrompt}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPrompt}
        onOpenChange={() => setDeletingPrompt(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPrompt?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrompt}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
