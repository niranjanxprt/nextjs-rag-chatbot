/**
 * Resend Magic Link Authentication Provider
 * 
 * Implements passwordless authentication via email magic links using Resend.
 * Users receive a link that automatically signs them in when clicked.
 */

import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

export const ResendMagicLink = Email({
  id: "resend-magic-link",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes expiration
  
  async sendVerificationRequest({ identifier: email, url, provider }) {
    if (!provider.apiKey) {
      throw new Error("AUTH_RESEND_KEY environment variable is not set");
    }

    const resend = new ResendAPI(provider.apiKey);
    
    const { error } = await resend.emails.send({
      from: "RAG Chatbot <onboarding@resend.dev>", // TODO: Update with your domain
      to: [email],
      subject: "Sign in to RAG Chatbot",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in to RAG Chatbot</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Sign in to RAG Chatbot</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hello! Click the button below to securely sign in to your account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Sign In to RAG Chatbot
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This link will expire in <strong>15 minutes</strong> for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you didn't request this email, you can safely ignore it.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                Alternatively, you can copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #667eea;">${url}</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} RAG Chatbot. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send magic link email:", error);
      throw new Error(`Failed to send magic link: ${JSON.stringify(error)}`);
    }
  },
});
