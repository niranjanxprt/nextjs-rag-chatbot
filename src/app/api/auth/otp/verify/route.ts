/**
 * OTP Verify API Route
 * 
 * Verifies the OTP code and creates a user session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "../../../../../../convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;
    
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }
    
    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      );
    }
    
    const convex = getConvexClient();
    
    // Verify OTP and get session token
    const result = await convex.mutation(api.auth.signIn, {
      provider: "resend-otp",
      params: { email, code },
    });
    
    if (!result || !result.token) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      );
    }
    
    // Create response with session token
    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
    
    // Set session token in cookie
    response.cookies.set("convex_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
