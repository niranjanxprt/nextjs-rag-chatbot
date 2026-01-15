/**
 * DEMO PAGE - PROFESSIONAL UI SHOWCASE
 * 
 * This page demonstrates the new professional UI design
 * matching the React frontend from localhost:8081
 */

'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layouts/AppLayout').then(mod => ({ default: mod.AppLayout })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react'

export default function DemoPage() {
  return (
    <AppLayout>
      <div className="p-8 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional UI Demo</h1>
              <p className="text-gray-600 mt-1">
                Showcasing the new professional design matching the React frontend
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-200">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </div>
          </div>
          
          {/* Status Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">UI Successfully Updated!</p>
              <p className="text-green-700 text-sm">The professional design is now active and matches the React frontend.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last month
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Active Chats</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">48</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    5 new this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">1.2s</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    15% faster
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Design Features</CardTitle>
              <CardDescription className="text-gray-600">
                Key improvements in the new professional UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Clean White Sidebar</p>
                    <p className="text-sm text-gray-600">Professional white design with subtle shadows</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Blue Accent Colors</p>
                    <p className="text-sm text-gray-600">Consistent blue branding throughout the interface</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Improved Typography</p>
                    <p className="text-sm text-gray-600">Better font weights and spacing for readability</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Enhanced Cards</p>
                    <p className="text-sm text-gray-600">Modern card designs with hover effects</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">
                Latest updates and system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">UI Design Updated</p>
                    <p className="text-xs text-gray-600">Professional sidebar and layout implemented</p>
                    <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Components Added</p>
                    <p className="text-xs text-gray-600">New professional components from React frontend</p>
                    <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Layout Fixed</p>
                    <p className="text-xs text-gray-600">Resolved sidebar context conflicts</p>
                    <p className="text-xs text-gray-500 mt-1">8 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cache Cleared</p>
                    <p className="text-xs text-gray-600">Browser cache issues resolved</p>
                    <p className="text-xs text-gray-500 mt-1">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Next Steps</CardTitle>
            <CardDescription className="text-gray-600">
              Recommended actions to complete the UI implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">High Priority</Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Clear Browser Cache</h4>
                <p className="text-sm text-gray-600">Force refresh to see the new UI changes</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Professional Design</h4>
                <p className="text-sm text-gray-600">Sidebar and layout now match React frontend</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">In Progress</Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Test All Features</h4>
                <p className="text-sm text-gray-600">Verify navigation and functionality works</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}