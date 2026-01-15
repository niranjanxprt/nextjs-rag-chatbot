/**
 * Resend OTP Authentication Provider
 * 
 * Implements passwordless authentication via email OTP (One-Time Password).
 * Users receive a 6-digit code that they enter to sign in.
 */

import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes expiration
  
  async generateVerificationToken() {
    // Generate a 6-digit numeric code
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    const length = 6;
    return generateRandomString(random, alphabet, length);
  },
  
  async sendVerificationRequest({ identifier: email, provider, token }) {
    if (!provider.apiKey) {
      throw new Error("AUTH_RESEND_KEY environment variable is not set");
    }

    const resend = new ResendAPI(provider.apiKey);
    
    const { error } = await resend.emails.send({
      from: "RAG Chatbot <onboarding@resend.dev>", // TODO: Update with your domain
      to: [email],
      subject: "Your verification code for RAG Chatbot",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Verification Code</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Your Verification Code</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hello! Enter this code to sign in to your RAG Chatbot account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: white; 
                            border: 2px solid #667eea; 
                            border-radius: 12px; 
                            padding: 20px; 
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="font-size: 42px; 
                              font-weight: 700; 
                              letter-spacing: 12px; 
                              color: #667eea; 
                              font-family: 'Courier New', monospace;">
                    ${token}
                  </div>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This code will expire in <strong>15 minutes</strong> for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Security Tip:</strong> Never share this code with anyone. RAG Chatbot will never ask you for this code via phone or email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} RAG Chatbot. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send OTP email:", error);
      throw new Error(`Failed to send OTP: ${JSON.stringify(error)}`);
    }
  },
});
