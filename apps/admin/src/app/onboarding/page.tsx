"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has an account
  useEffect(() => {
    checkExistingAccount();
  }, []);

  const checkExistingAccount = async () => {
    try {
      const response = await fetch(`/api/auth/check?shop=${shop}`);
      const data = await response.json();
      
      if (data.hasAccount && data.hasInstagram) {
        // Redirect to admin dashboard if fully setup
        window.location.href = `/editor?shop=${shop}`;
      }
    } catch (error) {
      console.error("Error checking account:", error);
    }
  };

  const handleSignUpClick = () => {
    setIsLoading(true);
    // Open signup in new tab with shop parameter
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?shop=${shop}`;
    window.open(signupUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to MINIMALL
          </h1>
          <p className="text-xl text-gray-600">
            Transform your Instagram into a shoppable storefront in minutes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sync Instagram Content</h3>
            <p className="text-gray-600">
              Automatically import your posts, reels, and stories. Keep your bio link always fresh.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Tag Products Visually</h3>
            <p className="text-gray-600">
              Click anywhere on your photos to tag products. Make every post shoppable with hotspots.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Seamless Checkout</h3>
            <p className="text-gray-600">
              Customers shop directly from your bio link with Shopify's secure checkout.
            </p>
          </div>
        </div>

        {/* Example Previews */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">See It In Action</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mobile Preview */}
            <div className="flex justify-center">
              <div className="w-64 h-[500px] bg-black rounded-[2rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[1.5rem] h-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-16 flex items-center justify-center">
                    <p className="text-white font-semibold">@yourbrand</p>
                  </div>
                  <div className="p-4">
                    {/* Mini highlights */}
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                      ))}
                    </div>
                    {/* Mini grid */}
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Instagram-First Design</p>
                  <p className="text-sm text-gray-600">Feels native to Instagram users</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Real-Time Updates</p>
                  <p className="text-sm text-gray-600">Changes appear instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Mobile Optimized</p>
                  <p className="text-sm text-gray-600">Perfect on every device</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Analytics Built-In</p>
                  <p className="text-sm text-gray-600">Track what's working</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={handleSignUpClick}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold px-12 py-4 rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? "Opening Sign Up..." : "Get Started - Create Your Account"}
          </button>
          
          <p className="mt-4 text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_APP_URL}/login?shop=${shop}`, "_blank")}
              className="text-purple-600 hover:underline font-medium"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}