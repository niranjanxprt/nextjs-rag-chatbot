#!/usr/bin/env node

/**
 * Simple App Test - Just check if the app is responding
 */

const http = require('http')

async function testHomePage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
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

async function main() {
  console.log('🧪 Testing if Next.js RAG Chatbot is running...\n')

  try {
    console.log('Checking home page...')
    const result = await testHomePage()
    
    if (result.status === 200) {
      console.log('✅ Home page loaded successfully!')
      console.log(`📄 Response size: ${result.data.length} bytes`)
      
      // Check if it contains expected content
      if (result.data.includes('RAG') || result.data.includes('Chatbot') || result.data.includes('Next.js')) {
        console.log('✅ Page contains expected content')
      } else {
        console.log('⚠️  Page loaded but may not contain expected content')
      }
      
      console.log('\n🎉 The app appears to be working!')
      console.log('🌐 You can access it at: http://localhost:3000')
      
      return true
    } else {
      console.log(`❌ Home page returned status: ${result.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing app: ${error.message}`)
    console.log('\n💡 Make sure the development server is running with: npm run dev')
    return false
  }
}

if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = { main }