'use client'

import React, { useState } from 'react'
import { useProjects } from '@/lib/contexts/projects-context'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { Button } from '@/components/ui/button'
import { Plus, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject, isLoading } = useProjects()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateProject = async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
  }) => {
    try {
      await createProject({
        user_id: '', // Will be set by context
        ...data,
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  const nonDefaultProjects = projects.filter((p) => !p.is_default)
  const defaultProject = projects.find((p) => p.is_default)

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Folder className="w-8 h-8" />
                Projects
              </h1>
              <p className="text-muted-foreground mt-1">
                Organize your documents and conversations by project
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {/* Default Project */}
            {defaultProject && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Default Project
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ProjectCard
                    project={defaultProject}
                    onUpdate={updateProject}
                    onDelete={deleteProject}
                    isDefault
                  />
                </div>
              </div>
            )}

            {/* Other Projects */}
            {nonDefaultProjects.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  My Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonDefaultProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onUpdate={updateProject}
                      onDelete={deleteProject}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Create your first project to start organizing documents and conversations.
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  Create Project
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading projects...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateProject}
      />
    </DashboardLayout>
  )
}
