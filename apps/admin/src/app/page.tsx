"use client";

import { Button, Card, Layout, Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminHomePage() {
  const router = useRouter();

  // Auto-redirect to analytics dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/analytics");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

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
              
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Button 
                  variant="primary" 
                  onClick={() => router.push("/analytics")}
                >
                  View Analytics
                </Button>
                
                <Button 
                  onClick={() => router.push("/editor/new")}
                >
                  Create New Config
                </Button>
              </div>
              
              <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
                Redirecting to analytics dashboard in 2 seconds...
              </p>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}