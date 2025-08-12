"use client";

import { Button, Card, Layout, Page } from "@shopify/polaris";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ConfigListItem {
  id: string;
  shop?: string | null;
  slug?: string | null;
  updatedAt?: string | Date | null;
}

export default function EditorListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConfigListItem[]>([]);

  const suffix = useMemo(() => {
    const host = searchParams.get("host");
    const shop = searchParams.get("shop");
    const qs = new URLSearchParams();
    if (host) qs.set("host", host);
    if (shop) qs.set("shop", shop);
    const str = qs.toString();
    return str ? `?${str}` : "";
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/configs");
        const json = await res.json();
        setItems(json.items || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Page title="Your Pages" subtitle="Manage your link-in-bio pages">
      <Layout>
        <Layout.Section>
          <Card>
            <div
              style={{
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600 }}>Pages</div>
              <Button variant="primary" onClick={() => router.push(`/editor/new${suffix}`)}>
                Create New
              </Button>
            </div>
            <div style={{ padding: 16 }}>
              {loading && <div>Loading…</div>}
              {!loading && items.length === 0 && (
                <div style={{ color: "#6d7175" }}>No pages yet. Create your first one.</div>
              )}
              {!loading && items.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 12,
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{ border: "1px solid #dfe3e8", borderRadius: 8, padding: 12 }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.id}</div>
                      <div style={{ color: "#6d7175", fontSize: 12 }}>
                        {item.shop || ""} {item.slug ? `• ${item.slug}` : ""}
                      </div>
                      <div style={{ color: "#6d7175", fontSize: 12, marginTop: 6 }}>
                        Updated{" "}
                        {(() => {
                          const dateValue =
                            typeof item.updatedAt === "string"
                              ? new Date(item.updatedAt)
                              : item.updatedAt ?? null;
                          return dateValue ? dateValue.toLocaleString() : "—";
                        })()}
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <Button onClick={() => router.push(`/editor/${item.id}${suffix}`)}>
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
