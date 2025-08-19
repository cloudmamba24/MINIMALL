"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Rocket, 
  CheckCircle2, 
  ExternalLink,
  Instagram,
  ShoppingBag,
  ArrowRight,
  Zap,
  Grid3x3,
  Tag
} from "lucide-react";

function WelcomePageContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status on mount and periodically
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 2000); // Check every 2 seconds
    
    // Listen for messages from the external window
    window.addEventListener("message", handleMessage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    // Verify origin for security
    if (event.origin !== process.env.NEXT_PUBLIC_APP_URL) return;
    
    if (event.data.type === "AUTH_SUCCESS") {
      setIsAuthenticated(true);
      // Redirect to main dashboard
      window.location.href = `/editor?shop=${shop}`;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        // Auto-redirect if authenticated
        setTimeout(() => {
          window.location.href = `/editor?shop=${shop}`;
        }, 1000);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGetStarted = () => {
    // Open authentication in a new window
    const width = 500;
    const height = 750;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      `/auth/signup?shop=${shop}&embedded=false`,
      "minimall-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
  };

  const handleExistingUser = () => {
    // Open sign in for existing users
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      `/auth/signin?shop=${shop}&embedded=false`,
      "minimall-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Logo */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl mb-6"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to MINIMALL
            </h1>
            <p className="text-xl text-gray-400">
              Transform your Instagram into a shoppable experience
            </p>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
          >
            {isChecking ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Checking authentication...</p>
              </div>
            ) : isAuthenticated ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                <p className="text-gray-400 mb-6">Redirecting to your dashboard...</p>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            ) : (
              <>
                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Grid3x3 className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Instagram Grid</h3>
                    <p className="text-sm text-gray-400">Create stunning shoppable galleries</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Tag className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Product Tags</h3>
                    <p className="text-sm text-gray-400">Tag products in your posts</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Quick Shop</h3>
                    <p className="text-sm text-gray-400">Seamless checkout experience</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGetStarted}
                    className="w-full group relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-100 group-hover:opacity-90 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-3">
                      <Rocket className="w-5 h-5" />
                      <span className="font-semibold text-lg">Get Started with Instagram</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <button
                    onClick={handleExistingUser}
                    className="w-full p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                  >
                    <span className="text-gray-300">Already have an account?</span>
                    <span className="font-semibold text-purple-400">Sign In</span>
                  </button>
                </div>

                {/* Shop Info */}
                {shop && (
                  <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm text-gray-500">
                      Setting up for: <span className="text-purple-400 font-medium">{shop}</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Footer Links */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm">
            <a 
              href="https://minimall.app/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              Documentation
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://instagram.com/minimall" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400 flex items-center gap-1 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Follow us
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <WelcomePageContent />
    </Suspense>
  );
}