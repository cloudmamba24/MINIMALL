import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Button,
  Banner,
  Spinner,
  ResourceList,
  ResourceItem,
  Avatar,
  Badge,
} from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

interface ShopInfo {
  name: string;
  domain: string;
  email: string;
  plan_name: string;
}

interface SiteConfig {
  id: string;
  shop: string;
  slug: string;
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<string>('');
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [siteConfigs, setSiteConfigs] = useState<SiteConfig[]>([]);
  const [error, setError] = useState<string>('');
  const app = useAppBridge();

  useEffect(() => {
    // Extract shop from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShop(shopParam);
      loadShopData(shopParam);
    } else {
      setError('No shop parameter found. This app must be accessed from Shopify admin.');
      setIsLoading(false);
    }
  }, []);

  const loadShopData = async (shopDomain: string) => {
    try {
      // Load shop information
      const shopResponse = await fetch('/api/shop-info');
      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        setShopInfo(shopData);
      }

      // Load existing site configurations
      const configsResponse = await fetch(`/api/configs?shop=${encodeURIComponent(shopDomain)}`);
      if (configsResponse.ok) {
        const configsData = await configsResponse.json();
        setSiteConfigs(configsData.configs || []);
      }

    } catch (err) {
      console.error('Error loading shop data:', err);
      setError('Failed to load shop information. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSite = () => {
    // TODO: Navigate to site creation wizard
    console.log('Create new site for shop:', shop);
  };

  const editSite = (configId: string) => {
    // Navigate to site editor
    window.location.href = `/editor/${configId}`;
  };

  const previewSite = (configId: string) => {
    // Open preview in new tab
    const previewUrl = `${window.location.origin.replace(':3001', ':3000')}/g/${configId}`;
    window.open(previewUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Page title="Loading...">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text as="p">Loading your link-in-bio dashboard...</Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Error">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Link-in-Bio Dashboard"
      subtitle={`Manage your ultra-fast storefront for ${shopInfo?.name || shop}`}
      primaryAction={{
        content: 'Create New Site',
        onAction: createNewSite,
      }}
    >
      <Layout>
        {/* Welcome Banner */}
        <Layout.Section>
          <Banner
            title="Welcome to your Link-in-Bio Platform"
            tone="success"
            onDismiss={() => {}}
          >
            <p>
              Create lightning-fast link-in-bio pages that integrate seamlessly 
              with your Shopify store. Sub-1.5 second load times guaranteed.
            </p>
          </Banner>
        </Layout.Section>

        {/* Shop Information */}
        {shopInfo && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="headingMd" as="h2">
                  Store Information
                </Text>
                <div style={{ marginTop: '16px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <Avatar 
                    name={shopInfo.name}
                  />
                  <div>
                    <Text variant="headingMd" as="h3">
                      {shopInfo.name}
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text as="p" tone="subdued">
                        {shopInfo.domain} • {shopInfo.plan_name}
                      </Text>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Badge>Connected</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Site Configurations */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">
                Your Link-in-Bio Sites
              </Text>
              
              {siteConfigs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text as="p" tone="subdued">
                    You haven't created any link-in-bio sites yet.
                  </Text>
                  <div style={{ marginTop: '16px' }}>
                    <Button variant="primary" onClick={createNewSite}>
                      Create Your First Site
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  <ResourceList
                    resourceName={{ singular: 'site', plural: 'sites' }}
                    items={siteConfigs}
                    renderItem={(config) => (
                      <ResourceItem
                        id={config.id}
                        onClick={() => editSite(config.id)}
                        shortcutActions={[
                          {
                            content: 'Preview',
                            onAction: () => previewSite(config.id),
                          },
                          {
                            content: 'Edit',
                            onAction: () => editSite(config.id),
                          },
                        ]}
                      >
                        <div>
                          <Text variant="bodyMd" as="h3">
                            {config.slug || config.id}
                          </Text>
                          <div style={{ marginTop: '4px' }}>
                            <Text as="p" tone="subdued">
                              Created: {new Date(config.createdAt).toLocaleDateString()}
                            </Text>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <Badge>
                              {config.currentVersionId ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </ResourceItem>
                    )}
                  />
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Performance & Analytics Preview */}
        <Layout.Section>
          <Layout.Section variant="oneHalf">
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h3">
                  ⚡ Performance
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Text variant="headingLg" as="p">
                    &lt;1.5s
                  </Text>
                  <Text as="p" tone="subdued">
                    Average load time
                  </Text>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Button variant="plain">View Details</Button>
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <div style={{ padding: '16px' }}>
                <Text variant="headingMd" as="h3">
                  📊 This Month
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Text variant="headingLg" as="p">
                    Coming Soon
                  </Text>
                  <Text as="p" tone="subdued">
                    Visits & conversions
                  </Text>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Button variant="plain">Setup Analytics</Button>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout.Section>
      </Layout>
    </Page>
  );
}