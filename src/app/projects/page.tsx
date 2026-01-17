'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/lib/hooks/useProjects'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { Button } from '@/components/ui/button'
import { Plus, Folder, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Id } from '../../../convex/_generated/dataModel'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

export default function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()
  const deleteProjectMutation = useDeleteProject()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateProject = async (data: {
    name: string
    description?: string
    is_public?: boolean
    allow_member_invite?: boolean
    max_members?: number
  }) => {
    try {
      await createProjectMutation.mutateAsync(data)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  const handleUpdateProject = async (id: string, data: any) => {
    try {
      await updateProjectMutation.mutateAsync({ id: id as Id<"projects">, data })
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProjectMutation.mutateAsync(id as Id<"projects">)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col">
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
              <Button disabled size="lg">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred'
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Projects</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
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
            {/* Projects Grid */}
            {projects.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  My Projects ({projects.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onUpdate={handleUpdateProject}
                      onDelete={handleDeleteProject}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12">
                <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Create your first project to start organizing documents and conversations.
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
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
    </AppLayout>
  )
}
