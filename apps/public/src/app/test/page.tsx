export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          <strong>✅ Success!</strong> Static routing is working.
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        
        <p className="text-gray-600 mb-4">
          This is a static test page to verify basic routing works.
        </p>
        
        <div className="space-y-2 text-sm">
          <div>Current time: {new Date().toISOString()}</div>
          <div>Environment: {process.env.NODE_ENV}</div>
        </div>
        
        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}