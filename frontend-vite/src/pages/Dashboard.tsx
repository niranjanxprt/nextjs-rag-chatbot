import { useState } from "react";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ProjectModal } from "@/components/dashboard/ProjectModal";
import { DeleteProjectDialog } from "@/components/dashboard/DeleteProjectDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { mockProjects, type Project } from "@/data/mockData";

export default function Dashboard() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleCreateProject = (data: { name: string; description?: string }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      description: data.description || "",
      documentCount: 0,
      memberCount: 1,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setProjects([newProject, ...projects]);
    toast({
      title: "Project created",
      description: `"${data.name}" has been created successfully.`,
    });
  };

  const handleEditProject = (data: { name: string; description?: string }) => {
    if (!editingProject) return;
    setProjects(
      projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: data.name,
              description: data.description || "",
              lastUpdated: new Date().toISOString(),
            }
          : p
      )
    );
    setEditingProject(null);
    toast({
      title: "Project updated",
      description: `"${data.name}" has been updated successfully.`,
    });
  };

  const handleDeleteProject = () => {
    if (!deletingProject) return;
    setProjects(projects.filter((p) => p.id !== deletingProject.id));
    toast({
      title: "Project deleted",
      description: `"${deletingProject.name}" has been deleted.`,
    });
    setDeletingProject(null);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
  };

  const openDeleteDialog = (project: Project) => {
    setDeletingProject(project);
  };

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
          {projects.length > 0 && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState onCreateProject={() => setIsModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateProject}
      />

      {/* Edit Project Modal */}
      <ProjectModal
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        project={editingProject}
        onSubmit={handleEditProject}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        project={deletingProject}
        onConfirm={handleDeleteProject}
      />
    </AppLayout>
  );
}
