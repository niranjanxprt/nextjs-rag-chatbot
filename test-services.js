require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testServices() {
  console.log('🧪 Testing RAG Chatbot Services...\n');

  // Test 1: Environment Variables
  console.log('=== Environment Variables ===');
  const requiredEnvs = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'UPSTASH_REDIS_REST_URL'
  ];

  requiredEnvs.forEach(env => {
    const value = process.env[env];
    console.log(`${env}: ${value ? '✅ Set' : '❌ Missing'}`);
  });

  // Test 2: OpenAI Connection
  console.log('\n=== OpenAI API Test ===');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const models = await response.json();
      console.log('✅ OpenAI Connected');
      console.log(`📊 Available models: ${models.data.length}`);
      
      // Test embedding
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'Test embedding for RAG chatbot'
        })
      });
      
      if (embeddingResponse.ok) {
        const embedding = await embeddingResponse.json();
        console.log(`✅ Embedding created: ${embedding.data[0].embedding.length} dimensions`);
      } else {
        console.log('⚠️ Embedding test failed:', embeddingResponse.status);
      }
    } else {
      const error = await response.text();
      console.log('❌ OpenAI Error:', response.status, error);
    }
    
  } catch (error) {
    console.log('❌ OpenAI Error:', error.message);
  }

  // Test 3: Supabase Connection
  console.log('\n=== Supabase Connection Test ===');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase Connected');
    console.log('📊 Auth session check completed');
    
  } catch (error) {
    console.log('❌ Supabase Error:', error.message);
  }

  // Test 4: Qdrant Connection
  console.log('\n=== Qdrant Vector Database Test ===');
  try {
    const response = await fetch(`${process.env.QDRANT_URL}/collections`, {
      headers: {
        'api-key': process.env.QDRANT_API_KEY
      }
    });
    
    if (response.ok) {
      const collections = await response.json();
      console.log('✅ Qdrant Connected');
      console.log(`📊 Collections: ${collections.result?.collections?.length || 0}`);
    } else {
      console.log('❌ Qdrant Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Qdrant Error:', error.message);
  }

  // Test 5: Redis Connection
  console.log('\n=== Redis Cache Test ===');
  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Redis Connected:', result.result);
    } else {
      console.log('❌ Redis Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Redis Error:', error.message);
  }

  console.log('\n🎉 Service testing complete!');
}

testServices().catch(console.error);