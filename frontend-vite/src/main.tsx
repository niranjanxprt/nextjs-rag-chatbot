import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error handling for app initialization
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Failed to initialize app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please check the browser console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    `;
  }
}
// Test auto-deployment trigger
