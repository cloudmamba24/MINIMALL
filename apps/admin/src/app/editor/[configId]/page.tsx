"use client";

import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { AssetManager } from "@/components/assets/asset-manager";
import { VisualEditor } from "@/components/editor/visual-editor";
import { LivePreview } from "@/components/preview/live-preview";
import type { SiteConfig } from "@minimall/core";
import {
  Banner,
  Button,
  ButtonGroup,
  Card,
  Frame,
  Layout,
  LegacyStack,
  Loading,
  Page,
  Tabs,
  Text,
  Toast,
} from "@shopify/polaris";
import { ImageIcon, RefreshIcon, SaveIcon, SettingsIcon, ViewIcon } from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback, use } from "react";

interface EditorPageProps {
  params: Promise<{
    configId: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { configId } = use(params);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<{
    content: string;
    error?: boolean;
  } | null>(null);

  const tabs = [
    { id: "editor", content: "Visual Editor", panelID: "editor-panel" },
    { id: "assets", content: "Assets", panelID: "assets-panel" },
    { id: "settings", content: "Settings", panelID: "settings-panel" },
    { id: "analytics", content: "Analytics", panelID: "analytics-panel" },
  ];

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try bypass route first to avoid database issues
      let response = await fetch(`/api/configs/${configId}/bypass`);
      if (!response.ok) {
        // Fallback to regular route if bypass fails
        response = await fetch(`/api/configs/${configId}`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }

      const data = await response.json();
      setConfig(data.config);
      setHasUnsavedChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load configuration";
      setError(message);
      setToast({ content: message, error: true });
    } finally {
      setLoading(false);
    }
  };

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/configs/${configId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.statusText}`);
      }

      setHasUnsavedChanges(false);
      setToast({ content: "Configuration saved successfully!" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save configuration";
      setToast({ content: message, error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = useCallback((newConfig: SiteConfig) => {
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  }, []);

  const handlePreview = useCallback((_previewConfig: SiteConfig) => {
    // The live preview will automatically update via postMessage
    // No additional action needed here
  }, []);

  const openLivePreview = useCallback(() => {
    if (config) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : window.location.origin.replace(":3001", ":3000"));

      window.open(`${baseUrl}/g/${configId}?preview=true&timestamp=${Date.now()}`, "_blank");
    }
  }, [config, configId]);

  const publishConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/configs/${configId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to publish configuration: ${response.statusText}`);
      }

      setToast({ content: "Configuration published successfully!" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish configuration";
      setToast({ content: message, error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Frame>
        <Loading />
      </Frame>
    );
  }

  if (error || !config) {
    return (
      <Frame>
        <Page title="Editor Error" subtitle="Failed to load configuration">
          <Layout>
            <Layout.Section>
              <Banner tone="critical">{error || "Configuration not found"}</Banner>
              <div className="mt-4">
                <Button onClick={() => window.history.back()}>Go Back</Button>
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title={`Editing: ${config.id}`}
        subtitle={`Configuration ID: ${configId}`}
        primaryAction={{
          content: saving ? "Saving..." : "Save Changes",
          onAction: saveConfig,
          disabled: saving || !hasUnsavedChanges,
          loading: saving,
          icon: SaveIcon,
        }}
        secondaryActions={[
          {
            content: "Publish",
            onAction: publishConfig,
            disabled: saving || hasUnsavedChanges,
          },
          {
            content: "Open Preview",
            onAction: openLivePreview,
            icon: ViewIcon,
          },
          {
            content: "Refresh",
            onAction: loadConfig,
            icon: RefreshIcon,
          },
        ]}
      >
        {hasUnsavedChanges && (
          <div className="mb-4">
            <Banner tone="warning">
              You have unsaved changes. Don't forget to save before publishing or leaving the page.
            </Banner>
          </div>
        )}

        <Layout>
          {/* Main editor area */}
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab} />

              <div className="p-6">
                {activeTab === 0 && (
                  <VisualEditor
                    config={config}
                    onConfigChange={handleConfigChange}
                    onPreview={handlePreview}
                  />
                )}

                {activeTab === 1 && (
                  <AssetManager
                    onSelectAsset={(asset) => {
                      setToast({ content: `Selected asset: ${asset.originalName}` });
                    }}
                    folder={`configs/${configId}/assets`}
                  />
                )}

                {activeTab === 2 && (
                  <div className="space-y-4">
                    <Card>
                      <div className="p-4">
                        <Text as="h3" variant="headingMd" fontWeight="bold" tone="base">
                          Configuration Settings
                        </Text>
                        <div className="mt-4">
                          <LegacyStack>
                            <div>
                              <strong>Shop Domain:</strong> {config.settings?.shopDomain || "N/A"}
                            </div>
                            <div>
                              <strong>Config ID:</strong> {config.id}
                            </div>
                            <div>
                              <strong>Created:</strong>{" "}
                              {new Date(config.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <strong>Last Updated:</strong>{" "}
                              {new Date(config.updatedAt).toLocaleDateString()}
                            </div>
                          </LegacyStack>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="p-4">
                        <Text as="h3" variant="headingMd" fontWeight="bold" tone="base">
                          SEO Settings
                        </Text>
                        <div className="mt-4">
                          <p>SEO configuration options will be added here.</p>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="p-4">
                        <Text as="h3" variant="headingMd" fontWeight="bold" tone="base">
                          Theme Settings
                        </Text>
                        <div className="mt-4">
                          <p>Theme customization options will be added here.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 3 && <AnalyticsDashboard configId={configId} />}
              </div>
            </Card>
          </Layout.Section>

          {/* Live preview sidebar */}
          <Layout.Section variant="oneThird">
            <LivePreview config={config} isLoading={loading} error={error} onRefresh={loadConfig} />
          </Layout.Section>
        </Layout>

        {/* Toast notifications */}
        {toast && (
          <Toast
            content={toast.content}
            {...(toast.error !== undefined && { error: toast.error })}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}
