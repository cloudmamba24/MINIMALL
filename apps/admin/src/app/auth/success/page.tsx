"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");

  useEffect(() => {
    // Show success message with green banner
    const banner = document.createElement("div");
    banner.className = "fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-3 z-50";
    banner.innerHTML = "✓ Successfully connected with Shopify!";
    document.body.appendChild(banner);

    // Redirect to main dashboard after showing success
    setTimeout(() => {
      window.location.href = `/backoffice/launchpad?shop=${shop}`;
    }, 1500);
  }, [shop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Successfully Connected!
          </h1>
          <p className="text-gray-600">
            Redirecting to your dashboard...
          </p>
        </div>
        
        <div className="animate-pulse">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}