"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect root to demo experience - showcase the sophisticated Instagram-native system
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to avoid build issues with server-side redirects
    router.replace("/g/demo");
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">MinimalL</h1>
        <p className="text-gray-600 mb-8">Ultra-fast link-in-bio storefront</p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
          Loading Demo...
        </div>
        <noscript>
          <div className="mt-4">
            <a
              href="/g/demo"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Demo →
            </a>
          </div>
        </noscript>
      </div>
    </div>
  );
}
