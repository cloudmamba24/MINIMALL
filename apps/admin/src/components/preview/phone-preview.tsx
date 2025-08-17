"use client";

import type { Category, SiteConfig } from "@minimall/core";
import { Badge, Button, Icon, Text } from "@shopify/polaris";
import {
  CartIcon,
  HeartIcon,
  HomeIcon,
  PersonIcon,
  SearchIcon,
  ShareIcon,
} from "@shopify/polaris-icons";
import { useCallback, useState } from "react";

interface PhonePreviewProps {
  config: SiteConfig;
  onProductClick?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

type TabType = "instagram" | "store" | "about";

export function PhonePreview({ config, onProductClick, onAddToCart }: PhonePreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("instagram");
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [showQuickView, setShowQuickView] = useState<string | null>(null);

  // Extract data from config
  const shopCategory = config.categories?.find((c) => c.id === "shop");
  const instagramCategory = config.categories?.find((c) => c.id === "instagram");
  
  const products = shopCategory?.categoryType?.[1]?.children || [];
  const instagramPosts = instagramCategory?.categoryType?.[1]?.children || [];

  const handleAddToCart = useCallback((productId: string) => {
    setCartItems((prev) => [...prev, productId]);
    onAddToCart?.(productId);
  }, [onAddToCart]);

  const handleProductClick = useCallback((productId: string) => {
    setShowQuickView(productId);
    onProductClick?.(productId);
  }, [onProductClick]);

  return (
    <div className="phone-preview">
      {/* iPhone Frame */}
      <div className="relative mx-auto" style={{ width: "375px" }}>
        {/* Phone Shell */}
        <div className="relative bg-black rounded-[40px] p-2 shadow-2xl">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>
          
          {/* Screen */}
          <div className="bg-white rounded-[32px] overflow-hidden" style={{ height: "812px" }}>
            {/* Status Bar */}
            <div className="bg-white px-6 pt-3 pb-1 flex justify-between items-center text-xs">
              <span className="font-medium">9:41</span>
              <div className="flex gap-1">
                <span>📶</span>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Instagram Header */}
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-0.5">
                  <div className="w-full h-full bg-white rounded-full p-0.5">
                    <img
                      src={config.settings?.brand?.logo || "/api/placeholder/32/32"}
                      alt="Brand"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <Text variant="bodyMd" as="span" fontWeight="semibold">
                  @{config.settings?.brand?.name || "yourstore"}
                </Text>
              </div>
              <Icon source={ShareIcon} />
            </div>

            {/* Bio Section */}
            <div className="bg-white px-4 py-3 border-b">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-0.5">
                  <div className="w-full h-full bg-white rounded-full p-0.5">
                    <img
                      src={config.settings?.brand?.logo || "/api/placeholder/80/80"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Text variant="headingMd" as="h1" fontWeight="semibold">
                    {config.settings?.brand?.name || "Your Store"}
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {config.settings?.brand?.subtitle || "Shop our latest collection"}
                  </Text>
                  <a href="#" className="text-blue-500 text-sm">
                    {config.settings?.shopDomain || "shop.com"}
                  </a>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex justify-around mt-3 pt-3 border-t">
                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    {products.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Products
                  </Text>
                </div>
                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    {instagramPosts.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Posts
                  </Text>
                </div>
                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    10.2K
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Followers
                  </Text>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full mt-3 bg-black text-white py-2 rounded-lg text-sm font-medium">
                VISIT THE WEBSITE
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("instagram")}
                  className={`flex-1 py-3 text-center ${
                    activeTab === "instagram"
                      ? "border-b-2 border-black font-medium"
                      : "text-gray-500"
                  }`}
                >
                  INSTAGRAM
                </button>
                <button
                  onClick={() => setActiveTab("store")}
                  className={`flex-1 py-3 text-center ${
                    activeTab === "store"
                      ? "border-b-2 border-black font-medium"
                      : "text-gray-500"
                  }`}
                >
                  STORE
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex-1 py-3 text-center ${
                    activeTab === "about"
                      ? "border-b-2 border-black font-medium"
                      : "text-gray-500"
                  }`}
                >
                  ABOUT
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-gray-50 overflow-y-auto" style={{ height: "calc(100% - 320px)" }}>
              {activeTab === "instagram" && (
                <div className="grid grid-cols-3 gap-0.5">
                  {instagramPosts.map((post: Category) => {
                    const postCard = post.card?.[1];
                    const productTags = (postCard as any)?.productTags || [];
                    return (
                      <div
                        key={post.id}
                        className="relative aspect-square bg-white cursor-pointer hover:opacity-90"
                        onClick={() => handleProductClick(post.id)}
                      >
                        {postCard?.image ? (
                          <img
                            src={postCard.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                        {productTags.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-white/90 rounded-full p-1">
                              <Icon source={CartIcon} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "store" && (
                <div className="p-4">
                  {/* Product Carousel */}
                  <div className="mb-4">
                    <Text variant="headingMd" as="h2" fontWeight="semibold">
                      New Arrivals
                    </Text>
                    <div className="flex gap-3 overflow-x-auto py-3">
                      {products.slice(0, 5).map((product: Category) => {
                        const productCard = product.card?.[1];
                        return (
                          <div
                            key={product.id}
                            className="flex-shrink-0 w-40 cursor-pointer"
                            onClick={() => handleProductClick(product.id)}
                          >
                            <div className="relative">
                              {productCard?.image ? (
                                <img
                                  src={productCard.image}
                                  alt={product.title}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product.id);
                                }}
                                className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg"
                              >
                                <Icon source={CartIcon} />
                              </button>
                            </div>
                            <Text variant="bodySm" as="p" fontWeight="medium">
                              {product.title}
                            </Text>
                            <Text variant="bodySm" as="p" tone="subdued">
                              ${(productCard as any)?.price || "0.00"}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div>
                    <Text variant="headingMd" as="h2" fontWeight="semibold">
                      All Products
                    </Text>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {products.map((product: Category) => {
                        const productCard = product.card?.[1];
                        return (
                          <div
                            key={product.id}
                            className="cursor-pointer"
                            onClick={() => handleProductClick(product.id)}
                          >
                            <div className="relative">
                              {productCard?.image ? (
                                <img
                                  src={productCard.image}
                                  alt={product.title}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                              )}
                            </div>
                            <Text variant="bodySm" as="p" fontWeight="medium">
                              {product.title}
                            </Text>
                            <Text variant="bodySm" as="p" tone="subdued">
                              ${(productCard as any)?.price || "0.00"}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "about" && (
                <div className="p-4">
                  <div className="bg-white rounded-lg p-4">
                    <Text variant="headingLg" as="h2" fontWeight="semibold">
                      ABOUT {config.settings?.brand?.name?.toUpperCase() || "US"}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      {(config.settings?.brand as any)?.description ||
                        "We bring you the latest trends and timeless classics."}
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Cart Badge */}
            {cartItems.length > 0 && (
              <div className="absolute bottom-20 right-4 bg-black text-white rounded-full px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Icon source={CartIcon} />
                  <span className="font-medium">{cartItems.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}