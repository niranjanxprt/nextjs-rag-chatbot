import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function Projects() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:8000/api/v1/projects');
      // const data = await response.json();

      // Mock data for now
      const mockProjects: Project[] = [
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
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:8000/api/v1/projects', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: projectName, description: projectDescription })
      // });
      // const newProject = await response.json();

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectName,
        description: projectDescription,
        documentCount: 0,
        memberCount: 1,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      setProjects([newProject, ...projects]);
      setIsModalOpen(false);
      setProjectName("");
      setProjectDescription("");

      toast({
        title: "Success",
        description: `Project "${projectName}" created successfully`,
      });
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your document intelligence projects
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </div>
        ) : (
          <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <li key={project.id} role="listitem">
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{project.documentCount} documents</span>
                      <span>{project.memberCount} members</span>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your documents and collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setNameError("");
                  }}
                  placeholder="Enter project name"
                  required
                />
                {nameError && (
                  <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setProjectName("");
                  setProjectDescription("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!projectName.trim()}
              >
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
