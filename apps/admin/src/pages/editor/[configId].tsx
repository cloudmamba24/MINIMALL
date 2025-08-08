import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Button,
  Banner,
  Spinner,
  FormLayout,
  TextField,
  Select,
  ButtonGroup,
  InlineStack,
} from '@shopify/polaris';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { SiteConfig } from '@minimall/core';

export default function ConfigEditor() {
  const router = useRouter();
  const { configId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for basic settings
  const [siteName, setSiteName] = useState('');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [borderRadius, setBorderRadius] = useState('sm');

  useEffect(() => {
    if (configId) {
      loadConfig(configId as string);
    }
  }, [configId]);

  const loadConfig = async (id: string) => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For now, we'll load the demo config
      const response = await fetch(`/api/configs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }
      
      const data = await response.json();
      const configData = data.config;
      
      setConfig(configData);
      
      // Populate form fields
      setSiteName(configData.settings?.brand?.name || '');
      setSiteSubtitle(configData.settings?.brand?.subtitle || '');
      setPrimaryColor(configData.settings?.theme?.primaryColor || '#000000');
      setBackgroundColor(configData.settings?.theme?.backgroundColor || '#FFFFFF');
      setBorderRadius(configData.settings?.theme?.borderRadius || 'sm');
      
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Failed to load configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setHasChanges(true);
    
    switch (field) {
      case 'siteName':
        setSiteName(value);
        break;
      case 'siteSubtitle':
        setSiteSubtitle(value);
        break;
      case 'primaryColor':
        setPrimaryColor(value);
        break;
      case 'backgroundColor':
        setBackgroundColor(value);
        break;
      case 'borderRadius':
        setBorderRadius(value);
        break;
    }
  }, []);

  const handleSave = async (isDraft = true) => {
    if (!config || !configId) return;
    
    try {
      setIsSaving(true);
      
      // Update config with form values
      const updatedConfig: SiteConfig = {
        ...config,
        settings: {
          ...config.settings,
          brand: {
            ...config.settings.brand,
            name: siteName,
            subtitle: siteSubtitle,
          },
          theme: {
            ...config.settings.theme,
            primaryColor: primaryColor,
            backgroundColor: backgroundColor,
            borderRadius: borderRadius as any,
          },
        },
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: updatedConfig,
          isDraft,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setConfig(updatedConfig);
      setHasChanges(false);
      
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!configId) return;
    
    // Open preview in new tab
    const previewUrl = `${window.location.origin.replace(':3001', ':3000')}/g/${configId}`;
    window.open(previewUrl, '_blank');
  };

  const borderRadiusOptions = [
    { label: 'None', value: 'none' },
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
    { label: 'Extra Large', value: 'xl' },
  ];

  if (isLoading) {
    return (
      <Page title="Loading Editor...">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text as="p">Loading configuration editor...</Text>
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
      title={`Edit: ${config?.id || 'Configuration'}`}
      subtitle="Customize your link-in-bio appearance and content"
      titleMetadata={hasChanges ? <Text as="span" tone="caution">Unsaved changes</Text> : undefined}
      primaryAction={{
        content: isSaving ? 'Publishing...' : 'Publish',
        onAction: () => handleSave(false),
        loading: isSaving,
        disabled: !hasChanges,
      }}
      secondaryActions={[
        {
          content: 'Save Draft',
          onAction: () => handleSave(true),
          loading: isSaving,
          disabled: !hasChanges,
        },
        {
          content: 'Preview',
          onAction: handlePreview,
        },
        {
          content: 'Back to Dashboard',
          onAction: () => router.push('/admin'),
        },
      ]}
    >
      <Layout>
        {/* Brand Settings */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">
                Brand Settings
              </Text>
              <div style={{ marginTop: '16px' }}>
                <FormLayout>
                  <TextField
                    label="Site Name"
                    value={siteName}
                    onChange={(value) => handleInputChange('siteName', value)}
                    placeholder="Your Brand Name"
                    autoComplete="off"
                  />
                  <TextField
                    label="Subtitle"
                    value={siteSubtitle}
                    onChange={(value) => handleInputChange('siteSubtitle', value)}
                    placeholder="Brief description or tagline"
                    autoComplete="off"
                  />
                </FormLayout>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Theme Settings */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">
                Theme Settings
              </Text>
              <div style={{ marginTop: '16px' }}>
                <FormLayout>
                  <TextField
                    label="Primary Color"
                    value={primaryColor}
                    onChange={(value) => handleInputChange('primaryColor', value)}
                    placeholder="#000000"
                    autoComplete="off"
                    prefix="#"
                  />
                  
                  <TextField
                    label="Background Color"
                    value={backgroundColor}
                    onChange={(value) => handleInputChange('backgroundColor', value)}
                    placeholder="#FFFFFF"
                    autoComplete="off"
                    prefix="#"
                  />

                  <Select
                    label="Border Radius"
                    options={borderRadiusOptions}
                    value={borderRadius}
                    onChange={(value) => handleInputChange('borderRadius', value)}
                  />
                </FormLayout>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Content Sections */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text variant="headingMd" as="h2">
                    Content Sections
                  </Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text as="p" tone="subdued">
                      Drag and drop to reorder sections
                    </Text>
                  </div>
                </div>
                <Button>Add Section</Button>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {config?.categories.map((category, index) => (
                  <Card key={category.id}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text variant="bodyMd" as="h3">
                          {category.title}
                        </Text>
                        <Text as="p" tone="subdued">
                          {category.categoryType[0]} • {category.categoryType[1]?.children?.length || 0} items
                        </Text>
                      </div>
                      <ButtonGroup>
                        <Button size="slim">Edit</Button>
                        <Button size="slim" tone="critical">Remove</Button>
                      </ButtonGroup>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Preview Panel */}
        <Layout.Section variant="oneThird">
          <div style={{ position: 'sticky', top: '20px' }}>
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="headingMd" as="h2">
                  Live Preview
                </Text>
                <div style={{ marginTop: '16px' }}>
                  <div 
                    style={{ 
                      padding: '20px',
                      backgroundColor: backgroundColor,
                      color: primaryColor,
                      borderRadius: borderRadius === 'none' ? '0' : 
                                   borderRadius === 'sm' ? '4px' :
                                   borderRadius === 'md' ? '8px' :
                                   borderRadius === 'lg' ? '12px' : '16px',
                      border: '1px solid #e1e4e8',
                      textAlign: 'center'
                    }}
                  >
                    <Text variant="headingLg" as="h3">
                      {siteName || 'Your Brand'}
                    </Text>
                    {siteSubtitle && (
                      <div style={{ marginTop: '8px' }}>
                        <Text as="p" tone="subdued">
                          {siteSubtitle}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Button fullWidth onClick={handlePreview}>
                    Open Full Preview
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}