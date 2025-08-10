"use client";

import { Button, Card, Layout, Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminHomePage() {
  const router = useRouter();

  // Remove auto-redirect - let users choose where to go

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
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => router.push("/editor/new")}
                  fullWidth
                >
                  🎨 Create New Link-in-Bio Page
                </Button>

                <Button size="large" onClick={() => router.push("/editor")} fullWidth>
                  📝 Manage Existing Pages
                </Button>

                <Button size="large" onClick={() => router.push("/analytics")} fullWidth>
                  📊 View Analytics
                </Button>

                <Button size="large" onClick={() => router.push("/settings")} fullWidth>
                  ⚙️ Settings
                </Button>
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
