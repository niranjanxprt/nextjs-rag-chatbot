/**
 * Sign Out API Route
 * 
 * Signs out the user by clearing the session token.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
    
    // Clear session token cookie
    response.cookies.delete("convex_token");
    
    return response;
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
