import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { promptCategories, type SavedPrompt, type PromptCategory } from "@/data/mockData";

const promptSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  text: z
    .string()
    .trim()
    .min(1, "Prompt text is required")
    .max(2000, "Prompt must be less than 2000 characters"),
  category: z.enum(["analysis", "extraction", "summary", "comparison", "general"], {
    required_error: "Please select a category",
  }),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: SavedPrompt | null;
  onSubmit: (data: PromptFormData) => void;
}

export function PromptModal({
  open,
  onOpenChange,
  prompt,
  onSubmit,
}: PromptModalProps) {
  const isEditing = !!prompt;

  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: "",
      text: "",
      category: "general",
    },
  });

  useEffect(() => {
    if (open) {
      if (prompt) {
        form.reset({
          title: prompt.title,
          text: prompt.text,
          category: prompt.category,
        });
      } else {
        form.reset({
          title: "",
          text: "",
          category: "general",
        });
      }
    }
  }, [open, prompt, form]);

  const handleSubmit = (data: PromptFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Prompt" : "Create New Prompt"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your saved prompt."
              : "Save a prompt template for quick reuse."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Key Terms Extraction"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {promptCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your prompt template..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Save Changes" : "Create Prompt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
