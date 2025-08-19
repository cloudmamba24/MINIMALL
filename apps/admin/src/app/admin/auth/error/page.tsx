"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const errorMessages = {
  authentication_failed: "Authentication failed. Please try installing the app again.",
  no_shop_provided: "No shop domain provided. Please install the app from your Shopify admin.",
  authentication_error: "An authentication error occurred. Please try again.",
  invalid_request: "Invalid request. Please check the installation link.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") as keyof typeof errorMessages;

  const message = errorMessages[error] || "An unknown authentication error occurred.";

  const handleRetry = () => {
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">Authentication Error</h1>
          
          {/* Error Message */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-300 text-center">{message}</p>
          </div>

          {/* Help Text */}
          <p className="text-gray-400 text-sm text-center mb-8">
            If you're trying to install the MINIMALL app, please make sure you're accessing it
            from your Shopify admin panel or use the correct installation link.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">Try Again</span>
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}