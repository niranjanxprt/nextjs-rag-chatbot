#!/usr/bin/env node

/**
 * Basic App Functionality Test
 * Tests core features without running the full test suite
 */

const http = require('http')

async function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        })
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

async function runTests() {
  console.log('🧪 Testing Next.js RAG Chatbot Basic Functionality\n')

  const tests = [
    { name: 'Home Page', path: '/', expectedStatus: 200 },
    { name: 'Login Page', path: '/auth/login', expectedStatus: 200 },
    { name: 'Health Check API', path: '/api/health', expectedStatus: 200 },
    { name: 'Chat API (should require auth)', path: '/api/chat', expectedStatus: 401 },
    { name: 'Documents API (should require auth)', path: '/api/documents', expectedStatus: 401 },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`)
      const result = await testEndpoint(test.path, test.expectedStatus)
      
      if (result.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - Status: ${result.status}`)
        passed++
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`)
      failed++
    }
  }

  console.log(`\n📊 Test Results:`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All basic functionality tests passed!')
    console.log('The app appears to be working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.')
  }

  return failed === 0
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Test runner error:', error)
    process.exit(1)
  })
}

module.exports = { runTests, testEndpoint }