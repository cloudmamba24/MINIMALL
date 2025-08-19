"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const isEmbedded = searchParams.get("embedded") === "true";
  
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.usernameOrEmail.trim()) {
      setErrors({ usernameOrEmail: "Username or email is required" });
      return;
    }
    
    if (!formData.password) {
      setErrors({ password: "Password is required" });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          shopDomain: shop
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - set session
        localStorage.setItem("minimall_session", data.token);
        
        if (isEmbedded && window.opener) {
          // Notify the embedded iframe
          window.opener.postMessage(
            { type: "AUTH_SUCCESS", token: data.token },
            "*"
          );
        }
        
        // Redirect to success page which will then redirect to dashboard
        window.location.href = `/auth/success?shop=${shop}`;
      } else {
        // Handle errors
        if (data.error === "invalid_credentials") {
          setErrors({ general: "Invalid username/email or password" });
        } else {
          setErrors({ general: data.message || "Sign in failed" });
        }
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to manage your MINIMALL store
            </p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username or email
              </label>
              <input
                type="text"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({...formData, usernameOrEmail: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.usernameOrEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="@username or email@example.com"
                disabled={isLoading}
                autoFocus
              />
              {errors.usernameOrEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.usernameOrEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-purple-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href={`/auth/signup?shop=${shop}&embedded=${isEmbedded}`}
                className="text-purple-600 hover:underline font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex justify-center items-center gap-6 text-gray-500 text-sm">
          <span>🔒 Secure</span>
          <span>✓ Shopify Partner</span>
          <span>🚀 Instant Access</span>
        </div>
      </div>
    </div>
  );
}