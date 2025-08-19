"use client";

import { Button, Card, Layout, Page, Text, BlockStack, Box } from "@shopify/polaris";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
      console.error("Session check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignUp = () => {
    // Open external signup window
    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/auth/signup?shop=${shop}&embedded=true`;
    
    window.open(
      signupUrl,
      "minimall-signup",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  const handleSignIn = () => {
    // Open external signin window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const signinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/auth/signin?shop=${shop}&embedded=true`;
    
    window.open(
      signinUrl,
      "minimall-signin",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  if (isChecking) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="p" variant="bodyMd">
                  Checking authentication status...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (isAuthenticated) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  🎉 Successfully authenticated!
                </Text>
                <Text as="p" variant="bodyMd">
                  Redirecting to your dashboard...
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="600">
              <Box paddingBlockStart="800" paddingBlockEnd="400">
                <BlockStack gap="400" align="center">
                  <div style={{ fontSize: "48px" }}>🚀</div>
                  <Text as="h1" variant="headingXl">
                    Welcome to MINIMALL!
                  </Text>
                  <Text as="p" variant="bodyLg" tone="subdued">
                    Transform your Instagram into a shoppable storefront
                  </Text>
                </BlockStack>
              </Box>

              <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    ✨ What you'll get:
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      • Instagram-native shopping experience
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Visual product tagging with hotspots
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Real-time analytics & insights
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Seamless Shopify checkout
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Box>

              <BlockStack gap="300" align="center">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleSignUp}
                  fullWidth
                >
                  Sign Up
                </Button>
                
                <Text as="p" variant="bodyMd" tone="subdued">
                  Already have an account?{" "}
                  <Button variant="plain" onClick={handleSignIn}>
                    Sign In
                  </Button>
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <WelcomePageContent />
    </Suspense>
  );
}
