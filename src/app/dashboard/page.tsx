/**
 * Dashboard Page - EXACT React Frontend Replica
 *
 * Professional dashboard matching localhost:8081 design
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus, FileText, Users, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

// Mock project data to match React frontend
const mockProjects = [
  {
    id: 'proj-1',
    name: 'Marketing Analysis',
    description: 'Analyze marketing campaign performance and customer insights from various data sources',
    documentCount: 12,
    memberCount: 3,
    lastUpdated: '2024-01-10T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'active',
    color: 'bg-blue-500'
  },
  {
    id: 'proj-2',
    name: 'Product Research',
    description: 'Research and development documentation for new product features and market analysis',
    documentCount: 8,
    memberCount: 5,
    lastUpdated: '2024-01-09T15:45:00Z',
    createdAt: '2023-12-15T00:00:00Z',
    status: 'active',
    color: 'bg-green-500'
  },
  {
    id: 'proj-3',
    name: 'Legal Documents',
    description: 'Contract analysis and legal document management for compliance and review',
    documentCount: 25,
    memberCount: 2,
    lastUpdated: '2024-01-08T09:20:00Z',
    createdAt: '2023-11-20T00:00:00Z',
    status: 'active',
    color: 'bg-purple-500'
  },
]

export default function Dashboard() {
  const [projects] = useState(mockProjects)
  const [searchQuery, setSearchQuery] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Plus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">
        Create your first project to start organizing your documents and collaborate with your team.
      </p>
      <Button className="bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4 mr-2" />
        Create Project
      </Button>
    </div>
  )

  const ProjectCard = ({ project }: { project: typeof mockProjects[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-3 h-3 rounded-full ${project.color} mt-1.5`} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{project.name}</CardTitle>
              <CardDescription className="text-gray-600 line-clamp-2 text-sm">
                {project.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{project.documentCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.memberCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{formatTimeAgo(project.lastUpdated)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="p-8 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage your document intelligence projects and collaborate with your team
            </p>
          </div>
          {projects.length > 0 && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        {projects.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {projects.reduce((sum, p) => sum + p.documentCount, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {projects.reduce((sum, p) => sum + p.memberCount, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found matching "{searchQuery}"</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
