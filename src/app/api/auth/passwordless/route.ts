/**
 * Passwordless Authentication API Route
 * 
 * Uses Convex Auth with Resend to send magic links and OTP codes.
 * Works with any email address.
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, method } = body;
    
    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Validate method
    if (!method || !["magic_link", "otp"].includes(method)) {
      return NextResponse.json(
        { error: "Method must be 'magic_link' or 'otp'" },
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

    // Check if Convex is configured
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    // Create Convex client
    const convex = new ConvexHttpClient(convexUrl);
    
    // Determine provider based on method
    const provider = method === "magic_link" ? "resend-magic-link" : "resend-otp";
    
    try {
      // Call Convex auth signIn action
      console.log(`🔐 Sending ${method} to ${email} via Convex Auth...`);
      
      await convex.action(api.auth.signIn, {
        provider,
        params: { email },
      });
      
      console.log(`✅ ${method} sent successfully to ${email}`);
      
      return NextResponse.json({
        success: true,
        message: method === "magic_link" 
          ? "Magic link sent to your email" 
          : "OTP sent to your email",
        method,
      });
    } catch (convexError: any) {
      console.error("Convex auth error:", convexError);
      
      // Parse error message
      const errorMessage = convexError.message || convexError.toString();
      
      // Check for specific errors
      if (errorMessage.includes("AUTH_RESEND_KEY")) {
        return NextResponse.json(
          { 
            error: "Email service not configured",
            details: "Resend API key is missing"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to send authentication email",
          details: errorMessage
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in passwordless auth:", error);
    return NextResponse.json(
      { 
        error: "Failed to process authentication request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}