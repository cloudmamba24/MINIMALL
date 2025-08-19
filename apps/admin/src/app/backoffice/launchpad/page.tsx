"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function LaunchpadPage() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const [activeTab, setActiveTab] = useState("launchpad");

  useEffect(() => {
    // Update the embedded iframe if we're in Shopify admin
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "DASHBOARD_LOADED" },
        "*"
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">MINIMALL</h1>
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("launchpad")}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === "launchpad"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Launch Pad
                </button>
                <button
                  onClick={() => setActiveTab("visual")}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === "visual"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Visual Shopping
                </button>
                <button
                  onClick={() => setActiveTab("media")}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === "media"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Media Library
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === "analytics"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{shop}</span>
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === "launchpad" && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Launch Pad!</h2>
              <p className="text-gray-600">Get started with MINIMALL in just a few steps</p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Your First Page</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Build your Instagram-style link-in-bio page
                </p>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                  Get Started →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Import Instagram Content</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sync your posts and make them shoppable
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Connect Instagram →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tag Products</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add product hotspots to your images
                </p>
                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                  Start Tagging →
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Page Views</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Products Tagged</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Click Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">$0</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            </div>

            {/* Getting Started Checklist */}
            <div className="mt-8 bg-purple-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Getting Started Checklist</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked readOnly className="rounded text-purple-600" />
                  <span className="text-gray-700">Install MINIMALL app</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked readOnly className="rounded text-purple-600" />
                  <span className="text-gray-700">Create your account</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-purple-600" />
                  <span className="text-gray-700">Connect Instagram account</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-purple-600" />
                  <span className="text-gray-700">Import your first posts</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-purple-600" />
                  <span className="text-gray-700">Tag products in your images</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-purple-600" />
                  <span className="text-gray-700">Publish your link-in-bio page</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "visual" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Visual Shopping</h2>
            <p className="text-gray-600">Create shoppable galleries and tag products in your images.</p>
          </div>
        )}

        {activeTab === "media" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Media Library</h2>
            <p className="text-gray-600">Manage all your Instagram content and product tags.</p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
            <p className="text-gray-600">Track your performance and optimize your content.</p>
          </div>
        )}
      </main>
    </div>
  );
}