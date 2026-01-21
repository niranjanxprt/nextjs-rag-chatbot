import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ChatThreadsProvider } from './contexts/ChatThreadsContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ProjectWorkspace from './pages/ProjectWorkspace'
import PromptsLibrary from './pages/PromptsLibrary'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import CentralChat from './pages/CentralChat'
import Chat from './pages/Chat'
import DebugChat from './pages/DebugChat'
import RecentChats from './pages/RecentChats'
import KnowledgeBase from './pages/KnowledgeBase'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import DebugCallback from './pages/DebugCallback'
import DebugEnv from './pages/DebugEnv'
import Onboarding from './pages/Onboarding'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatThreadsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth routes - disabled but kept for reference */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/auth/callback" element={<Navigate to="/" replace />} />
              <Route path="/auth/debug" element={<Navigate to="/" replace />} />

              {/* Main routes - now accessible without auth */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<Dashboard />} />

              {/* Project routes */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace />} />

              {/* Chat routes */}
              <Route path="/chat" element={<Chat />} />
              <Route path="/debug-chat" element={<DebugChat />} />
              <Route path="/central-chat" element={<CentralChat />} />
              <Route path="/central-chat/:chatId" element={<CentralChat />} />
              <Route path="/chats" element={<RecentChats />} />

              {/* Other routes */}
              <Route path="/prompts" element={<PromptsLibrary />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/debug-env" element={<DebugEnv />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </TooltipProvider>
      </ChatThreadsProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
