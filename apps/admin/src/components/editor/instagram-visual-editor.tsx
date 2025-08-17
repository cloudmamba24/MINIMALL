"use client";

import type { Category, SiteConfig } from "@minimall/core";
import {
  Badge,
  Button,
  Card,
  Grid,
  Icon,
  InlineStack,
  Layout,
  LegacyStack,
  Select,
  Tabs,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import {
  DragHandleIcon,
  ImageIcon,
  PlusIcon,
  ProductIcon,
  RefreshIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { useCallback, useMemo, useState } from "react";
import { ProductCollectionBuilder } from "./product-collection-builder";

interface InstagramVisualEditorProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onPreview?: (config: SiteConfig) => void;
}

type EditorView = "collections" | "instagram" | "products";

export function InstagramVisualEditor({
  config,
  onConfigChange,
  onPreview,
}: InstagramVisualEditorProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<EditorView>("collections");

  // Extract shop products from config
  const shopCategory = config.categories?.find((c) => c.id === "shop");
  const products = useMemo(() => {
    if (!shopCategory?.categoryType?.[1]?.children) return [];
    return shopCategory.categoryType[1].children.map((product: Category) => {
      const productCard = product.card[1];
      return {
        id: product.id,
        title: product.title || "Untitled Product",
        image: productCard.image || (productCard as any).imageUrl,
        price: (productCard as any).price || "$0.00",
        description: productCard.description,
      };
    });
  }, [shopCategory]);

  // Extract Instagram posts
  const instagramCategory = config.categories?.find((c) => c.id === "instagram");
  const instagramPosts = useMemo(() => {
    if (!instagramCategory?.categoryType?.[1]?.children) return [];
    return instagramCategory.categoryType[1].children.map((post: Category) => {
      const postCard = post.card[1];
      return {
        id: post.id,
        title: post.title || "Instagram Post",
        image: postCard.image || (postCard as any).imageUrl,
        productTags: (postCard as any).productTags || [],
      };
    });
  }, [instagramCategory]);

  const tabs = [
    {
      id: "sync",
      content: "Sync Products",
      panelID: "sync-panel",
    },
    {
      id: "organize",
      content: "Organize Store",
      panelID: "organize-panel",
    },
    {
      id: "instagram",
      content: "Instagram Content",
      panelID: "instagram-panel",
    },
  ];

  const collections = [
    { label: "All Products", value: "all" },
    { label: "New Arrivals", value: "new" },
    { label: "Best Sellers", value: "bestsellers" },
    { label: "Women", value: "women" },
    { label: "Men", value: "men" },
  ];

  const handleProductToggle = useCallback((productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSyncProducts = useCallback(() => {
    // This would sync with Shopify
    console.log("Syncing products from Shopify...");
  }, []);

  return (
    <div className="instagram-visual-editor">
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
        
        <div className="p-6">
          {selectedTab === 0 && (
            // Sync Products Tab
            <ProductCollectionBuilder
              products={products}
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
              onSync={handleSyncProducts}
            />
          )}

          {selectedTab === 1 && (
            // Organize Store Tab
            <Layout>
              <Layout.Section>
                <Card>
                  <div className="p-4">
                    <Text variant="headingMd" as="h3">
                      Store Layout
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Drag and drop to organize your store sections
                    </Text>
                    
                    <div className="mt-4 space-y-2">
                      {["Instagram Feed", "Shop Products", "Lookbook", "About"].map((section) => (
                        <Card key={section}>
                          <div className="p-3 flex items-center gap-3">
                            <Icon source={DragHandleIcon} />
                            <Text variant="bodyMd" as="span">
                              {section}
                            </Text>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <Text variant="headingMd" as="h3">
                      Featured Collections
                    </Text>
                    
                    <Grid>
                      {["New Arrivals", "Best Sellers", "Sale"].map((collection) => (
                        <Grid.Cell
                          key={collection}
                          columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
                        >
                          <Card>
                            <div className="p-4 text-center">
                              <div className="w-full h-32 bg-gray-100 mb-3 rounded flex items-center justify-center">
                                <Icon source={ImageIcon} />
                              </div>
                              <Text variant="bodyMd" as="p">
                                {collection}
                              </Text>
                              <Button size="slim" fullWidth>
                                Edit
                              </Button>
                            </div>
                          </Card>
                        </Grid.Cell>
                      ))}
                    </Grid>
                  </div>
                </Card>
              </Layout.Section>
            </Layout>
          )}

          {selectedTab === 2 && (
            // Instagram Content Tab
            <Layout>
              <Layout.Section>
                <Card>
                  <div className="p-4">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h3">
                        Instagram Posts
                      </Text>
                      <Button icon={PlusIcon}>
                        Add Post
                      </Button>
                    </InlineStack>
                    
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Tag products in your Instagram content to make them shoppable
                    </Text>
                  </div>
                </Card>

                <Grid>
                  {instagramPosts.map((post) => (
                    <Grid.Cell
                      key={post.id}
                      columnSpan={{ xs: 6, sm: 4, md: 3 }}
                    >
                      <Card>
                        <div className="relative">
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <Icon source={ImageIcon} />
                            </div>
                          )}
                          {post.productTags.length > 0 && (
                            <div className="absolute top-2 right-2">
                              <Badge tone="info">
                                {`${post.productTags.length} products`}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <Button size="slim" fullWidth>
                            Tag Products
                          </Button>
                        </div>
                      </Card>
                    </Grid.Cell>
                  ))}
                </Grid>
              </Layout.Section>
            </Layout>
          )}
        </div>
      </Card>

    </div>
  );
}