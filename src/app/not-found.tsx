import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-gray-300 mb-4">404</CardTitle>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription>
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-1">
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}