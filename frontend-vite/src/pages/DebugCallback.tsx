import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Debug Callback Page
 * Shows all URL parameters for debugging magic link issues
 */
export default function DebugCallback() {
  const [searchParams] = useSearchParams();
  
  const allParams = Object.fromEntries(searchParams.entries());
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔍 Magic Link Debug Information</CardTitle>
          <CardDescription>
            This page shows all URL parameters received from the magic link
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Full URL:</h3>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {window.location.href}
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">URL Parameters:</h3>
            {Object.keys(allParams).length === 0 ? (
              <p className="text-red-500">❌ No parameters found in URL</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(allParams).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                        {key}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({value.length} characters)
                      </span>
                    </div>
                    <code className="block p-2 bg-gray-50 rounded text-xs break-all">
                      {key.includes('token') || key.includes('hash') 
                        ? `${value.substring(0, 20)}...${value.substring(value.length - 20)}`
                        : value
                      }
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Expected Parameters:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <span className={allParams.access_token ? "text-green-500" : "text-red-500"}>
                  {allParams.access_token ? "✅" : "❌"}
                </span>
                <span>access_token</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={allParams.refresh_token ? "text-green-500" : "text-red-500"}>
                  {allParams.refresh_token ? "✅" : "❌"}
                </span>
                <span>refresh_token</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={allParams.token_hash ? "text-green-500" : "text-red-500"}>
                  {allParams.token_hash ? "✅" : "❌"}
                </span>
                <span>token_hash (PKCE flow)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={allParams.type ? "text-green-500" : "text-red-500"}>
                  {allParams.type ? "✅" : "❌"}
                </span>
                <span>type (should be 'email')</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={allParams.error ? "text-red-500" : "text-gray-400"}>
                  {allParams.error ? "❌" : "—"}
                </span>
                <span>error (should not be present)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">🔍 Analysis:</h3>
            {allParams.error ? (
              <p className="text-red-600">
                ❌ Error detected: {allParams.error}
                {allParams.error_description && ` - ${allParams.error_description}`}
              </p>
            ) : allParams.access_token && allParams.refresh_token ? (
              <p className="text-green-600">
                ✅ Direct token flow detected - this should work!
              </p>
            ) : allParams.token_hash ? (
              <p className="text-blue-600">
                ✅ PKCE flow detected - this should work!
              </p>
            ) : (
              <p className="text-red-600">
                ❌ No valid authentication parameters found
              </p>
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Copy this information and share it for debugging.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}