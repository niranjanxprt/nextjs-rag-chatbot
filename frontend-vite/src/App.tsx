import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ChatThreadsProvider } from "./contexts/ChatThreadsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import PromptsLibrary from "./pages/PromptsLibrary";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import CentralChat from "./pages/CentralChat";
import Chat from "./pages/Chat";
import RecentChats from "./pages/RecentChats";
import KnowledgeBase from "./pages/KnowledgeBase";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import DebugCallback from "./pages/DebugCallback";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatThreadsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/debug" element={<DebugCallback />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* New E2E test routes */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              {/* Existing routes */}
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectWorkspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prompts"
                element={
                  <ProtectedRoute>
                    <PromptsLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/central-chat"
                element={
                  <ProtectedRoute>
                    <CentralChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/central-chat/:chatId"
                element={
                  <ProtectedRoute>
                    <CentralChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <RecentChats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  <ProtectedRoute>
                    <KnowledgeBase />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </TooltipProvider>
      </ChatThreadsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
