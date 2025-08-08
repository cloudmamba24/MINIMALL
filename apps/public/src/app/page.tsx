import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MinimalL - Ultra-Fast Link-in-Bio Platform',
  description: 'Lightning-fast link-in-bio pages for Shopify stores with sub-1.5 second load times.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            MinimalL
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Ultra-fast link-in-bio platform for Shopify stores
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🚧 Platform Under Development
          </h2>
          <p className="text-gray-600 mb-4">
            This is the public site viewer. To access your link-in-bio page, use:
          </p>
          <code className="bg-gray-100 px-4 py-2 rounded text-sm">
            /g/[your-config-id]
          </code>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-800 mb-2">Ultra Fast</h3>
            <p className="text-gray-600 text-sm">
              Sub-1.5 second load times with edge computing and React Server Components
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-3">🛒</div>
            <h3 className="font-semibold text-gray-800 mb-2">Native Commerce</h3>
            <p className="text-gray-600 text-sm">
              Seamless Shopify integration with native cart and checkout
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-800 mb-2">Easy Setup</h3>
            <p className="text-gray-600 text-sm">
              Drag-and-drop interface with no coding required
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Demo: <a href="/g/demo" className="text-blue-600 hover:underline">/g/demo</a> |{' '}
            <span className="text-gray-400">v1.0.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}