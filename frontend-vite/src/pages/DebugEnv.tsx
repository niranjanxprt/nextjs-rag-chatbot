/**
 * Debug page to check environment variables
 * Visit: http://localhost:8081/debug-env
 */

export default function DebugEnv() {
  const env = {
    VITE_LANGFUSE_PUBLIC_KEY: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
    VITE_LANGFUSE_SECRET_KEY: import.meta.env.VITE_LANGFUSE_SECRET_KEY,
    VITE_LANGFUSE_BASE_URL: import.meta.env.VITE_LANGFUSE_BASE_URL,
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        {JSON.stringify(env, null, 2)}
      </pre>

      <h2>Langfuse Status</h2>
      <ul>
        <li>Public Key: {env.VITE_LANGFUSE_PUBLIC_KEY ? '✅ SET' : '❌ MISSING'}</li>
        <li>Secret Key: {env.VITE_LANGFUSE_SECRET_KEY ? '✅ SET' : '❌ MISSING'}</li>
        <li>Base URL: {env.VITE_LANGFUSE_BASE_URL || '❌ MISSING'}</li>
      </ul>

      <h2>Test Langfuse Connection</h2>
      <button
        onClick={async () => {
          const credentials = btoa(
            `${env.VITE_LANGFUSE_PUBLIC_KEY}:${env.VITE_LANGFUSE_SECRET_KEY}`
          )
          const url = `${env.VITE_LANGFUSE_BASE_URL}/api/public/v2/prompts`

          console.log('Testing Langfuse connection...')
          console.log('URL:', url)
          console.log('Credentials:', credentials.substring(0, 20) + '...')

          try {
            const response = await fetch(url, {
              headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json',
              },
            })

            console.log('Response status:', response.status)
            const data = await response.json()
            console.log('Response data:', data)

            alert(`Status: ${response.status}\nCheck console for details`)
          } catch (error) {
            console.error('Error:', error)
            alert('Error! Check console for details')
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Test Connection
      </button>
    </div>
  )
}
