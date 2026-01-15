/**
 * Team Management Page
 *
 * Manage team members, invitations, and collaboration settings
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useProjectMembers, useProjectInvitations, ProjectMember, ProjectInvitation } from '@/lib/hooks/useMembers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Mail, 
  Shield,
  Crown,
  User,
  Eye,
  Loader2,
  Search,
  Settings,
  MoreVertical,
  UserPlus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

interface TeamMember {
  id: string
  user_id: string
  project_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: {
    read: boolean
    write: boolean
    admin: boolean
  }
  joined_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface Invitation {
  id: string
  project_id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

export default function TeamPage() {
  // For demo purposes, using a mock project ID - in real app this would come from context/params
  const mockProjectId = 'demo-project-1'
  
  const { data: members = [], isLoading: membersLoading, error: membersError } = useProjectMembers(mockProjectId)
  const { data: invitations = [], isLoading: invitationsLoading } = useProjectInvitations(mockProjectId)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const isLoading = membersLoading || invitationsLoading
  const error = membersError

  const mockMembers: TeamMember[] = members.length > 0 ? members : [
    {
      id: '1',
      user_id: 'user-1',
      project_id: 'proj-1',
      role: 'owner',
      permissions: { read: true, write: true, admin: true },
      joined_at: '2024-01-01T00:00:00Z',
      profiles: {
        id: 'user-1',
        email: 'john@example.com',
        full_name: 'John Doe',
        avatar_url: null
      }
    },
    {
      id: '2',
      user_id: 'user-2',
      project_id: 'proj-1',
      role: 'admin',
      permissions: { read: true, write: true, admin: true },
      joined_at: '2024-01-05T00:00:00Z',
      profiles: {
        id: 'user-2',
        email: 'jane@example.com',
        full_name: 'Jane Smith',
        avatar_url: null
      }
    },
    {
      id: '3',
      user_id: 'user-3',
      project_id: 'proj-1',
      role: 'member',
      permissions: { read: true, write: true, admin: false },
      joined_at: '2024-01-10T00:00:00Z',
      profiles: {
        id: 'user-3',
        email: 'bob@example.com',
        full_name: 'Bob Johnson',
        avatar_url: null
      }
    }
  ]

  const mockInvitations: ProjectInvitation[] = invitations.length > 0 ? invitations : [
    {
      id: '1',
      project_id: 'proj-1',
      email: 'alice@example.com',
      role: 'member',
      permissions: { read: true, write: true, admin: false },
      token: 'mock-token-1',
      invited_by: 'user-1',
      expires_at: '2024-01-20T00:00:00Z',
      accepted_at: null,
      accepted_by: null,
      created_at: '2024-01-15T00:00:00Z',
      projects: {
        id: 'proj-1',
        name: 'Demo Project'
      },
      invited_by_profile: {
        id: 'user-1',
        email: 'john@example.com',
        full_name: 'John Doe'
      }
    }
  ]

  const finalMembers = mockMembers
  const finalInvitations = mockInvitations

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'member':
        return <User className="h-4 w-4 text-green-600" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const filteredMembers = finalMembers.filter((member: TeamMember) =>
    member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.profiles.full_name && member.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="w-8 h-8" />
                Team Management
              </h1>
              <p className="text-muted-foreground">
                Manage team members and collaboration settings
              </p>
            </div>
            <Button disabled size="lg">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
          
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8" />
              Team Management
            </h1>
            <p className="text-muted-foreground">
              Manage team members and collaboration settings
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{finalMembers.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-gray-900">{finalInvitations.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {finalMembers.filter((m: TeamMember) => ['owner', 'admin'].includes(m.role)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {finalMembers.filter((m: TeamMember) => m.role !== 'viewer').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({finalMembers.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invitations ({finalInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {filteredMembers.map((member: TeamMember) => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(member.profiles.full_name, member.profiles.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {member.profiles.full_name || member.profiles.email}
                            </h3>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(member.joined_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                        
                        {member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            {/* Invitations List */}
            {finalInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending invitations</h3>
                <p className="text-gray-500 mb-6">
                  Invite team members to collaborate on your projects.
                </p>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {finalInvitations.map((invitation: ProjectInvitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{invitation.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              Invited as {invitation.role}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sent {formatDate(invitation.created_at)} • Expires {formatDate(invitation.expires_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {invitation.accepted_at ? 'accepted' : 'pending'}
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}