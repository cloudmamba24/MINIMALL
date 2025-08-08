import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | MinimalL',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you are looking for could not be found.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Available Routes:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <a href="/" className="text-blue-600 hover:underline font-mono">
                /
              </a>
              <span className="text-gray-500 ml-2">- Homepage</span>
            </div>
            <div>
              <a href="/g/demo" className="text-blue-600 hover:underline font-mono">
                /g/demo
              </a>
              <span className="text-gray-500 ml-2">- Demo store</span>
            </div>
            <div>
              <a href="/api/debug/r2" className="text-green-600 hover:underline font-mono">
                /api/debug/r2
              </a>
              <span className="text-gray-500 ml-2">- R2 debug info</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Go Home
          </a>
          
          <div className="text-xs text-gray-400">
            <p>If you think this is an error, please check the URL or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}