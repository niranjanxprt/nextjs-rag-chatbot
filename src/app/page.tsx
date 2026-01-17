/**
 * Home Page
 * 
 * Redirects to chat if authenticated, otherwise to login
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  // Check if user has a Convex auth token
  const cookieStore = await cookies()
  const token = cookieStore.get('convexToken')

  if (token) {
    redirect('/chat') // Direct to chat if authenticated
  } else {
    redirect('/auth/login')
  }
}
