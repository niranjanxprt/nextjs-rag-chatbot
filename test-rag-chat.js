#!/usr/bin/env node

/**
 * RAG Chat System Test Script
 * 
 * Tests the chat endpoint with and without RAG
 */

const BASE_URL = 'http://localhost:3001'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testChatWithoutRAG() {
  log('\n📝 Test 1: Chat WITHOUT RAG (General AI)', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello! Can you tell me a joke?',
        conversationId: 'test-conv-' + Date.now(),
        ragEnabled: false,
      }),
    })

    log(`Status: ${response.status} ${response.statusText}`, 
        response.ok ? 'green' : 'red')

    if (!response.ok) {
      const error = await response.json()
      log(`Error: ${JSON.stringify(error, null, 2)}`, 'red')
      return false
    }

    // Handle streaming response
    log('\nStreaming response:', 'yellow')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      fullResponse += chunk
      process.stdout.write(chunk)
    }

    log('\n\n✅ Test 1 PASSED: Chat without RAG works!', 'green')
    return true
  } catch (error) {
    log(`\n❌ Test 1 FAILED: ${error.message}`, 'red')
    return false
  }
}

async function testChatWithRAG() {
  log('\n📚 Test 2: Chat WITH RAG (Document Context)', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What information do you have about machine learning?',
        conversationId: 'test-conv-rag-' + Date.now(),
        ragEnabled: true,
      }),
    })

    log(`Status: ${response.status} ${response.statusText}`, 
        response.ok ? 'green' : 'red')

    if (!response.ok) {
      const error = await response.json()
      log(`Error: ${JSON.stringify(error, null, 2)}`, 'red')
      return false
    }

    // Handle streaming response
    log('\nStreaming response:', 'yellow')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      fullResponse += chunk
      process.stdout.write(chunk)
    }

    log('\n\n✅ Test 2 PASSED: Chat with RAG works!', 'green')
    log('ℹ️  Note: If no documents are uploaded, RAG will fall back to general AI', 'yellow')
    return true
  } catch (error) {
    log(`\n❌ Test 2 FAILED: ${error.message}`, 'red')
    return false
  }
}

async function testChatValidation() {
  log('\n🔍 Test 3: Input Validation', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    // Test missing message
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: 'test-conv-validation',
        // message is missing
      }),
    })

    log(`Status: ${response.status} ${response.statusText}`, 
        response.status === 400 ? 'green' : 'red')

    const result = await response.json()
    log(`Response: ${JSON.stringify(result, null, 2)}`, 'yellow')

    if (response.status === 400 && result.error) {
      log('\n✅ Test 3 PASSED: Validation works correctly!', 'green')
      return true
    } else {
      log('\n❌ Test 3 FAILED: Expected 400 error for missing message', 'red')
      return false
    }
  } catch (error) {
    log(`\n❌ Test 3 FAILED: ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('\n🚀 Starting RAG Chat System Tests', 'blue')
  log('=' .repeat(60), 'blue')
  
  const results = []
  
  // Run tests
  results.push(await testChatWithoutRAG())
  results.push(await testChatWithRAG())
  results.push(await testChatValidation())
  
  // Summary
  log('\n' + '=' .repeat(60), 'blue')
  log('📊 Test Summary', 'blue')
  log('=' .repeat(60), 'blue')
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  log(`\nTests Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow')
  
  if (passed === total) {
    log('\n🎉 All tests passed! RAG chat system is working correctly.', 'green')
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow')
  }
  
  log('\n💡 Next Steps:', 'cyan')
  log('  1. Upload a document to test RAG with actual content', 'cyan')
  log('  2. Verify source citations appear in responses', 'cyan')
  log('  3. Test with multiple conversations', 'cyan')
  log('  4. Check Convex dashboard for stored messages', 'cyan')
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
