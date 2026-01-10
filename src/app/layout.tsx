import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/context'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { ProjectsProvider } from '@/lib/contexts/projects-context'
import { PromptsProvider } from '@/lib/contexts/prompts-context'
import { ConversationsProvider } from '@/lib/contexts/conversations-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'RAG Chatbot',
    template: '%s | RAG Chatbot',
  },
  description:
    'A Next.js RAG chatbot powered by OpenAI and Supabase. Upload documents and chat with your personalized AI assistant.',
  keywords: ['RAG', 'chatbot', 'AI', 'OpenAI', 'Supabase', 'document', 'search', 'Next.js'],
  authors: [{ name: 'RAG Chatbot Team' }],
  creator: 'RAG Chatbot',
  publisher: 'RAG Chatbot',
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <ErrorBoundary>
          <ToastProvider>
            <ThemeProvider>
              <AuthProvider>
                <ProjectsProvider>
                  <PromptsProvider>
                    <ConversationsProvider>
                      {children}
                    </ConversationsProvider>
                  </PromptsProvider>
                </ProjectsProvider>
              </AuthProvider>
            </ThemeProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
