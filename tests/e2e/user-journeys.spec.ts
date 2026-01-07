/**
 * End-to-End Tests for RAG Chatbot
 * 
 * Tests critical user journeys using Playwright
 */

import { test, expect } from '@playwright/test'

// Mock test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testUser: {
    email: 'test@example.com'
  },
  testDocument: {
    name: 'test-document.txt',
    content: 'This is a test document with important information about machine learning and artificial intelligence.'
  }
}

test.describe('RAG Chatbot E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(TEST_CONFIG.baseURL)
  })

  test.describe('Authentication Flow', () => {
    test('should complete magic link login flow', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Login')
      await expect(page).toHaveURL(/.*\/auth\/login/)

      // Fill in email
      await page.fill('input[type="email"]', TEST_CONFIG.testUser.email)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show success message
      await expect(page.locator('text=Magic link sent')).toBeVisible()
      
      // Mock the magic link callback (in real test, would check email)
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/)
      await expect(page.locator('text=Dashboard')).toBeVisible()
    })

    test('should show error for invalid email', async ({ page }) => {
      await page.click('text=Login')
      await page.fill('input[type="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Invalid email')).toBeVisible()
    })
  })

  test.describe('Document Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      await expect(page).toHaveURL(/.*\/dashboard/)
    })

    test('should upload and process document successfully', async ({ page }) => {
      // Navigate to documents page
      await page.click('text=Documents')
      await expect(page).toHaveURL(/.*\/dashboard\/documents/)

      // Create a test file
      const fileContent = TEST_CONFIG.testDocument.content
      const buffer = Buffer.from(fileContent)
      
      // Upload file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: TEST_CONFIG.testDocument.name,
        mimeType: 'text/plain',
        buffer
      })

      // Should show upload progress
      await expect(page.locator('text=Uploading')).toBeVisible()
      
      // Should show processing status
      await expect(page.locator('text=Processing')).toBeVisible()
      
      // Should complete processing (mock fast processing)
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 })
      
      // Document should appear in list
      await expect(page.locator(`text=${TEST_CONFIG.testDocument.name}`)).toBeVisible()
    })

    test('should show error for unsupported file types', async ({ page }) => {
      await page.click('text=Documents')
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'unsupported.exe',
        mimeType: 'application/x-executable',
        buffer: Buffer.from('fake executable content')
      })

      await expect(page.locator('text=Unsupported file type')).toBeVisible()
    })

    test('should allow document deletion', async ({ page }) => {
      await page.click('text=Documents')
      
      // Assume document is already uploaded (from previous test or setup)
      await expect(page.locator(`text=${TEST_CONFIG.testDocument.name}`)).toBeVisible()
      
      // Click delete button
      await page.click('[data-testid="delete-document"]')
      
      // Confirm deletion
      await page.click('text=Confirm')
      
      // Document should be removed
      await expect(page.locator(`text=${TEST_CONFIG.testDocument.name}`)).not.toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication and uploaded document
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/search`)
    })

    test('should perform semantic search and return results', async ({ page }) => {
      // Enter search query
      await page.fill('input[placeholder*="Search"]', 'machine learning')
      await page.click('button[type="submit"]')
      
      // Should show loading state
      await expect(page.locator('text=Searching')).toBeVisible()
      
      // Should show search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
      await expect(page.locator('.search-result')).toHaveCount.toBeGreaterThan(0)
      
      // Results should have proper structure
      const firstResult = page.locator('.search-result').first()
      await expect(firstResult.locator('.result-content')).toBeVisible()
      await expect(firstResult.locator('.result-score')).toBeVisible()
    })

    test('should handle empty search queries', async ({ page }) => {
      await page.fill('input[placeholder*="Search"]', '   ')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Please enter a search query')).toBeVisible()
    })

    test('should show no results message for irrelevant queries', async ({ page }) => {
      await page.fill('input[placeholder*="Search"]', 'completely unrelated topic xyz123')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=No results found')).toBeVisible()
    })
  })

  test.describe('Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication and navigate to chat
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard/chat`)
    })

    test('should send message and receive AI response', async ({ page }) => {
      // Type message
      await page.fill('textarea[placeholder*="Type your message"]', 'What is machine learning?')
      
      // Send message
      await page.click('button[type="submit"]')
      
      // Should show user message
      await expect(page.locator('.message.user')).toContainText('What is machine learning?')
      
      // Should show typing indicator
      await expect(page.locator('.typing-indicator')).toBeVisible()
      
      // Should receive AI response
      await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.message.assistant')).toContainText('Based on')
      
      // Should show context sources
      await expect(page.locator('.context-sources')).toBeVisible()
    })

    test('should maintain conversation history', async ({ page }) => {
      // Send first message
      await page.fill('textarea[placeholder*="Type your message"]', 'Tell me about AI')
      await page.click('button[type="submit"]')
      await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 })
      
      // Send follow-up message
      await page.fill('textarea[placeholder*="Type your message"]', 'Can you elaborate?')
      await page.click('button[type="submit"]')
      await expect(page.locator('.message.assistant').nth(1)).toBeVisible({ timeout: 10000 })
      
      // Should have 4 messages total (2 user, 2 assistant)
      await expect(page.locator('.message')).toHaveCount(4)
    })

    test('should handle streaming responses', async ({ page }) => {
      await page.fill('textarea[placeholder*="Type your message"]', 'Explain artificial intelligence')
      await page.click('button[type="submit"]')
      
      // Should show streaming indicator
      await expect(page.locator('.streaming-indicator')).toBeVisible()
      
      // Response should appear gradually (mock streaming)
      const assistantMessage = page.locator('.message.assistant').last()
      await expect(assistantMessage).toBeVisible({ timeout: 10000 })
      
      // Streaming should complete
      await expect(page.locator('.streaming-indicator')).not.toBeVisible({ timeout: 15000 })
    })

    test('should allow conversation reset', async ({ page }) => {
      // Send a message first
      await page.fill('textarea[placeholder*="Type your message"]', 'Hello')
      await page.click('button[type="submit"]')
      await expect(page.locator('.message')).toHaveCount(2)
      
      // Reset conversation
      await page.click('[data-testid="reset-conversation"]')
      await page.click('text=Confirm')
      
      // Messages should be cleared
      await expect(page.locator('.message')).toHaveCount(0)
      await expect(page.locator('text=Start a new conversation')).toBeVisible()
    })
  })

  test.describe('Complete User Journey', () => {
    test('should complete full RAG workflow from login to chat', async ({ page }) => {
      // 1. Login
      await page.click('text=Login')
      await page.fill('input[type="email"]', TEST_CONFIG.testUser.email)
      await page.click('button[type="submit"]')
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      await expect(page).toHaveURL(/.*\/dashboard/)

      // 2. Upload document
      await page.click('text=Documents')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: TEST_CONFIG.testDocument.name,
        mimeType: 'text/plain',
        buffer: Buffer.from(TEST_CONFIG.testDocument.content)
      })
      await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 })

      // 3. Search documents
      await page.click('text=Search')
      await page.fill('input[placeholder*="Search"]', 'machine learning')
      await page.click('button[type="submit"]')
      await expect(page.locator('.search-result')).toHaveCount.toBeGreaterThan(0)

      // 4. Chat with context
      await page.click('text=Chat')
      await page.fill('textarea[placeholder*="Type your message"]', 'What does the document say about machine learning?')
      await page.click('button[type="submit"]')
      
      // Should receive contextual response
      await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.context-sources')).toBeVisible()
      
      // Response should reference the uploaded document
      const response = await page.locator('.message.assistant').textContent()
      expect(response).toContain('document')
    })
  })

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Mock authentication
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      
      // Navigation should be responsive
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Chat interface should be usable
      await page.click('text=Chat')
      await expect(page.locator('textarea[placeholder*="Type your message"]')).toBeVisible()
      
      // Should be able to send messages
      await page.fill('textarea[placeholder*="Type your message"]', 'Test mobile message')
      await page.click('button[type="submit"]')
      await expect(page.locator('.message.user')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be accessible to screen readers', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      
      // Check for proper ARIA labels
      await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible()
      await expect(page.locator('[role="main"]')).toBeVisible()
      
      // Chat interface should have proper labels
      await page.click('text=Chat')
      await expect(page.locator('textarea[aria-label*="message"]')).toBeVisible()
      await expect(page.locator('button[aria-label*="Send"]')).toBeVisible()
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/callback?token=mock-token`)
      
      // Should be able to navigate with Tab key
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Should navigate to the focused element
      await expect(page).toHaveURL(/.*\/dashboard\//)
    })
  })
})
