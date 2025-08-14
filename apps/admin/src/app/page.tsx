"use client";

import { Button, Card, Layout, Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Create a separate component for App Bridge functionality
function NavigationButton({
  path,
  variant,
  size,
  children,
}: {
  path: string;
  variant?: "primary" | "plain" | "secondary" | "tertiary" | "monochromePlain";
  size: "large";
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleClick = () => {
    // For now, just use Next.js router
    // App Bridge navigation will be handled at a higher level
    router.push(path);
  };

  return (
    <Button {...(variant && { variant })} size={size} onClick={handleClick} fullWidth>
      {typeof children === "string" ? children : String(children)}
    </Button>
  );
}

export default function AdminHomePage() {
  return (
    <Page
      title="MiniMall Admin Dashboard"
      subtitle="Instagram-native link-in-bio platform for Shopify merchants"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "20px", textAlign: "center" }}>
              <h2>Welcome to MiniMall Admin</h2>
              <p style={{ margin: "20px 0" }}>
                Configure your Instagram-native link-in-bio experience
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >
                <NavigationButton variant="primary" size="large" path="/editor/new">
                  🎨 Create New Link-in-Bio Page
                </NavigationButton>

                <NavigationButton size="large" path="/editor">
                  📝 Manage Existing Pages
                </NavigationButton>

                <NavigationButton size="large" path="/analytics">
                  📊 View Analytics
                </NavigationButton>

                <NavigationButton size="large" path="/settings">
                  ⚙️ Settings
                </NavigationButton>
              </div>

              <div
                style={{
                  marginTop: "32px",
                  padding: "16px",
                  backgroundColor: "#f6f6f7",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
                  Quick Stats
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "16px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", color: "#008060" }}>3</div>
                    <div style={{ color: "#6d7175" }}>Active Pages</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", color: "#008060" }}>1.2k</div>
                    <div style={{ color: "#6d7175" }}>Total Views</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", color: "#008060" }}>45</div>
                    <div style={{ color: "#6d7175" }}>Conversions</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", color: "#008060" }}>$2,340</div>
                    <div style={{ color: "#6d7175" }}>Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
