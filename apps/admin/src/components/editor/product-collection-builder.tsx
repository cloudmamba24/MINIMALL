"use client";

import type { Category } from "@minimall/core";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Icon,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
  SearchIcon,
} from "@shopify/polaris-icons";
import { useState, useMemo, useCallback } from "react";

interface Product {
  id: string;
  title: string;
  image?: string;
  price?: string;
  vendor?: string;
  category?: string;
}

interface ProductCollectionBuilderProps {
  products: Product[];
  selectedProducts: string[];
  onProductsChange: (productIds: string[]) => void;
  onSync: () => void;
}

export function ProductCollectionBuilder({
  products,
  selectedProducts,
  onProductsChange,
  onSync,
}: ProductCollectionBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Group products by category
  const categories = useMemo(() => {
    const cats = new Set(["All"]);
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
      if (p.vendor) cats.add(p.vendor);
    });
    return Array.from(cats);
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery === "" || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        product.category === selectedCategory ||
        product.vendor === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredProducts.map(p => p.id);
    onProductsChange([...new Set([...selectedProducts, ...allIds])]);
  }, [filteredProducts, selectedProducts, onProductsChange]);

  const handleDeselectAll = useCallback(() => {
    const filteredIds = filteredProducts.map(p => p.id);
    onProductsChange(selectedProducts.filter(id => !filteredIds.includes(id)));
  }, [filteredProducts, selectedProducts, onProductsChange]);

  const handleToggleProduct = useCallback((productId: string) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  }, [selectedProducts, onProductsChange]);

  return (
    <div className="product-collection-builder">
      {/* Header with search and sync */}
      <Card>
        <div className="p-4">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingLg" as="h2">
              Product Collections
            </Text>
            <Button onClick={onSync}>
              SYNC PRODUCTS FROM SHOPIFY
            </Button>
          </InlineStack>

          <div className="mt-4">
            <TextField
              label=""
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
              prefix={<Icon source={SearchIcon} />}
              autoComplete="off"
            />
          </div>
        </div>
      </Card>

      {/* Category sidebar and product grid */}
      <div className="mt-4 flex gap-4">
        {/* Categories sidebar */}
        <Card>
          <div className="p-4 w-64">
            <Text variant="headingMd" as="h3">
              Select and add new items
            </Text>
            
            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 flex items-center justify-between ${
                    selectedCategory === category.toLowerCase() ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      label=""
                      checked={selectedCategory === category.toLowerCase()}
                      onChange={() => {}}
                    />
                    <Text variant="bodyMd" as="span">
                      {category}
                    </Text>
                  </span>
                  <span className="text-gray-500">›</span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button fullWidth icon={DragHandleIcon}>
                Add new item
              </Button>
            </div>
          </div>
        </Card>

        {/* Product grid */}
        <div className="flex-1">
          <Card>
            <div className="p-4">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h3">
                  Menu Items
                </Text>
                <InlineStack>
                  <Button size="slim" onClick={handleSelectAll}>
                    All
                  </Button>
                  <Button size="slim" onClick={handleDeselectAll}>
                    None
                  </Button>
                </InlineStack>
              </InlineStack>

              {/* Product list */}
              <div className="mt-4 space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      label=""
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleToggleProduct(product.id)}
                    />
                    
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        {product.title}
                      </Text>
                      {product.vendor && (
                        <Text variant="bodySm" tone="subdued" as="p">
                          {product.vendor}
                        </Text>
                      )}
                    </div>
                    
                    <Button size="slim">
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Selected products preview */}
      {selectedProducts.length > 0 && (
        <Card>
          <div className="p-4">
            <Text variant="headingMd" as="h3">
              Selected Products ({selectedProducts.length})
            </Text>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProducts.map(id => {
                const product = products.find(p => p.id === id);
                if (!product) return null;
                return (
                  <Badge key={id} tone="success">
                    {product.title}
                  </Badge>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}