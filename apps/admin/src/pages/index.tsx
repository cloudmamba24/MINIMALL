import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Button,
  Banner,
} from '@shopify/polaris';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<string>('');

  useEffect(() => {
    // Extract shop from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShop(shopParam);
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Page title="Loading...">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Loading your link-in-bio configuration...</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Link-in-Bio Configuration"
      subtitle="Create and manage your ultra-fast link-in-bio storefront"
      primaryAction={{
        content: 'Create New Site',
        onAction: () => {
          // TODO: Navigate to site creation
          console.log('Create new site');
        },
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Welcome to Link-in-Bio Platform"
            tone="success"
            onDismiss={() => {}}
          >
            <p>
              Set up your lightning-fast link-in-bio page that integrates seamlessly 
              with your Shopify store. Your customers will experience sub-1.5 second 
              load times and smooth checkout flows.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">
                Quick Start
              </Text>
              <div style={{ marginTop: '16px' }}>
                <Text as="p">
                  Shop: <strong>{shop || 'Not detected'}</strong>
                </Text>
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <Button 
                  variant="primary"
                  onClick={() => {
                    // TODO: Start configuration wizard
                    console.log('Start wizard');
                  }}
                >
                  Start Configuration
                </Button>
                
                <Button 
                  onClick={() => {
                    // TODO: View existing sites
                    console.log('View sites');
                  }}
                >
                  View Existing Sites
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h3">
                  ⚡ Ultra Fast
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text as="p">
                    Your link-in-bio loads in under 1.5 seconds globally with 
                    edge computing and React Server Components.
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h3">
                  🛒 Native Commerce
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text as="p">
                    Seamlessly integrated with your Shopify cart and checkout. 
                    No third-party payment processing required.
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h3">
                  🎨 Easy Customization
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text as="p">
                    Drag-and-drop interface to customize your layout, colors, 
                    and content without touching any code.
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout.Section>
      </Layout>
    </Page>
  );
}