"use client";

import { Banner, Button, Card, LegacyStack, Page } from "@shopify/polaris";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
    // Redirect to Shopify app store or installation flow
    window.location.href = "/admin";
  };

  return (
    <Page title="Authentication Error">
      <LegacyStack vertical>
        <Card>
          <Banner title="Authentication Error" tone="critical">
            <p>{message}</p>
          </Banner>
        </Card>

        <Card>
          <LegacyStack vertical>
            <p>
              If you're trying to install the MiniMall app, please make sure you're accessing it
              from your Shopify admin panel or use the correct installation link.
            </p>

            <div>
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </LegacyStack>
        </Card>
      </LegacyStack>
    </Page>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <Page title="Loading...">
          <Card>Loading...</Card>
        </Page>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
