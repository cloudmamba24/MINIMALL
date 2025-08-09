'use client';

import { useSearchParams } from 'next/navigation';
import { Card, Page, Banner, Button, LegacyStack } from '@shopify/polaris';

const errorMessages = {
  authentication_failed: 'Authentication failed. Please try installing the app again.',
  no_shop_provided: 'No shop domain provided. Please install the app from your Shopify admin.',
  authentication_error: 'An authentication error occurred. Please try again.',
  invalid_request: 'Invalid request. Please check the installation link.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') as keyof typeof errorMessages;
  
  const message = errorMessages[error] || 'An unknown authentication error occurred.';

  const handleRetry = () => {
    // Redirect to Shopify app store or installation flow
    window.location.href = '/admin';
  };

  return (
    <Page title="Authentication Error">
      <LegacyStack vertical>
        <Card>
          <Banner
            title="Authentication Error"
            status="critical"
          >
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
              <Button primary onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </LegacyStack>
        </Card>
      </LegacyStack>
    </Page>
  );
}