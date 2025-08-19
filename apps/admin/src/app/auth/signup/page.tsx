"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface ShopData {
  name: string;
  email: string;
  shopDomain: string;
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const isEmbedded = searchParams.get("embedded") === "true";
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    instagramUsername: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState<ShopData | null>(null);

  useEffect(() => {
    // Fetch shop data to pre-fill form
    if (shop) {
      fetchShopData();
    }
  }, [shop]);

  const fetchShopData = async () => {
    try {
      const response = await fetch(`/api/auth/shop-info?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setShopData(data);
        
        // Pre-fill form with shop owner data
        if (data.owner) {
          const [firstName, ...lastNameParts] = data.owner.name.split(" ");
          setFormData(prev => ({
            ...prev,
            firstName: firstName || "",
            lastName: lastNameParts.join(" ") || "",
            email: data.owner.email || ""
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch shop data:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.instagramUsername.trim()) {
      newErrors.instagramUsername = "Instagram username is required";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/signup", {
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
        // Success - set session and notify parent window
        localStorage.setItem("minimall_session", data.token);
        
        if (isEmbedded && window.opener) {
          // Notify the embedded iframe
          window.opener.postMessage(
            { type: "AUTH_SUCCESS", token: data.token },
            "*"
          );
        }
        
        // Show success message
        window.location.href = `/auth/success?shop=${shop}`;
      } else {
        // Handle errors
        if (data.error === "instagram_exists") {
          setErrors({ 
            instagramUsername: `An account for @${formData.instagramUsername} already exists` 
          });
          // Redirect to sign in after 2 seconds
          setTimeout(() => {
            window.location.href = `/auth/signin?shop=${shop}&embedded=${isEmbedded}`;
          }, 2000);
        } else {
          setErrors({ general: data.message || "Signup failed" });
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
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Connect your Instagram to start selling
            </p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          {/* Instagram Error Banner */}
          {errors.instagramUsername && errors.instagramUsername.includes("already exists") && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              {errors.instagramUsername}, please sign in.
              <div className="text-sm mt-1">Redirecting to sign in...</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                <input
                  type="text"
                  value={formData.instagramUsername}
                  onChange={(e) => setFormData({...formData, instagramUsername: e.target.value.replace("@", "")})}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.instagramUsername && !errors.instagramUsername.includes("already exists") ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="yourusername"
                  disabled={isLoading}
                />
              </div>
              {errors.instagramUsername && !errors.instagramUsername.includes("already exists") && (
                <p className="text-red-500 text-xs mt-1">{errors.instagramUsername}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number (optional)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
                disabled={isLoading}
              />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create your account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href={`/auth/signin?shop=${shop}&embedded=${isEmbedded}`}
                className="text-purple-600 hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex justify-center items-center gap-6 text-gray-500 text-sm">
          <span>🔒 Secure</span>
          <span>✓ Shopify Partner</span>
          <span>🚀 Instant Setup</span>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <SignUpForm />
    </Suspense>
  );
}