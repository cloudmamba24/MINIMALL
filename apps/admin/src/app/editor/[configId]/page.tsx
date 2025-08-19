"use client";

import { use } from "react";

interface EditorPageProps {
  params: Promise<{
    configId: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { configId } = use(params);
  
  // Temporarily returning a simple placeholder while refactoring Polaris components
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Editor</h1>
        <p className="text-gray-400">Editing configuration: {configId}</p>
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <p className="text-center text-gray-500">
            Editor is being updated to remove Shopify Polaris dependencies.
            This page will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}