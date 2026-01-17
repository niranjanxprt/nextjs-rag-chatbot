/**
 * Magic Link Send API Route
 * 
 * Sends a magic link email to the user for passwordless authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "../../../../../../convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    const convex = getConvexClient();
    
    // Call Convex auth to send magic link
    await convex.action(api.auth.signIn, {
      provider: "resend-magic-link",
      params: { email },
    });
    
    return NextResponse.json({
      success: true,
      message: "Magic link sent to your email",
    });
  } catch (error) {
    console.error("Error sending magic link:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
