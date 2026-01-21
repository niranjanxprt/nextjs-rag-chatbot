export default function DebugChat() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Debug Chat Page</h1>
      <p>If you can see this, routing is working!</p>
      <p>Current URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
