/**
 * Convex Client Utilities
 * 
 * Provides helper functions for creating Convex clients in different contexts.
 */

import { ConvexHttpClient } from "convex/browser";

/**
 * Get a Convex HTTP client for server-side operations
 * Uses deployment token for server-to-server communication
 */
export function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }
  
  const client = new ConvexHttpClient(url);
  
  // Set deployment token if available (for server-side operations)
  const deployToken = process.env.CONVEX_TOKEN;
  if (deployToken) {
    client.setAuth(deployToken);
  }
  
  return client;
}

/**
 * Get an authenticated Convex HTTP client with user session token
 * Used in API routes to make authenticated requests on behalf of a user
 */
export function getAuthenticatedConvexClient(sessionToken: string): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }
  
  const client = new ConvexHttpClient(url);
  client.setAuth(sessionToken);
  
  return client;
}

/**
 * Extract session token from request headers or cookies
 */
export function extractSessionToken(request: Request): string | null {
  // Try to get from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // Try to get from cookie
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map(c => c.trim());
    const convexTokenCookie = cookies.find(c => c.startsWith("convex_token="));
    if (convexTokenCookie) {
      return convexTokenCookie.substring("convex_token=".length);
    }
  }
  
  return null;
}
