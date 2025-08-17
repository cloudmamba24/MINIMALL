"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardDetails, Category, SiteConfig } from "@minimall/core";
import { Badge, Button, ButtonGroup, Card, Icon, LegacyStack, Text } from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
import React, { useState, useCallback } from "react";

interface VisualEditorProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onPreview?: (config: SiteConfig) => void;
}

// Legacy ContentItem interface for backward compatibility
interface ContentItem {
  id: string;
  type: "image" | "video" | "product" | "text" | "link" | "social";
  title?: string | undefined;
  description?: string | undefined;
  position: number;
  isVisible: boolean;
  // Image specific
  src?: string | undefined;
  alt?: string | undefined;
  width?: number;
  height?: number;
  // Video specific
  thumbnail?: string | undefined;
  autoplay?: boolean;
  // Product specific
  productId?: string | undefined;
  handle?: string | undefined;
  showPrice?: boolean;
  showDescription?: boolean;
  // Text specific
  content?: string | undefined;
  style?:
    | {
        fontSize?: number;
        color?: string;
        textAlign?: "left" | "center" | "right";
      }
    | undefined;
  // Link specific
  href?: string | undefined;
  target?: string | undefined;
  // Social specific
  platform?: "instagram" | "twitter" | "tiktok" | "youtube" | undefined;
  username?: string | undefined;
  showFollowers?: boolean;
}

// Removed unused DragItem interface

// Helper functions to convert between Category and ContentItem
const categoryToContentItem = (category: Category): ContentItem => {
  const [cardType, cardDetails] = category.card;
  const [categoryType, categoryDetails] = category.categoryType || [];

  // For product categories, extract product info from children
  let productInfo: {
    productId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    src?: string | undefined;
  } = {};
  
  if (categoryType === "products" && categoryDetails?.children?.length > 0) {
    const firstProduct = categoryDetails.children[0];
    if (firstProduct?.card?.[1]) {
      const productCard = firstProduct.card[1];
      productInfo = {
        productId: (productCard as any).productId || firstProduct.id,
        title: firstProduct.title || category.title,
        description: productCard.description || cardDetails.description || undefined,
        src: productCard.image || (productCard as any).imageUrl || undefined,
      };
    }
  }

  return {
    id: category.id,
    type: cardType as ContentItem["type"],
    title: productInfo.title || category.title,
    description: productInfo.description || cardDetails.description || undefined,
    position: category.order || 0,
    isVisible: category.visible !== false,
    // Map card details to content item properties
    ...(cardDetails.image && { src: cardDetails.image }),
    ...(cardDetails.imageUrl && { src: cardDetails.imageUrl }),
    ...(cardDetails.videoUrl && { src: cardDetails.videoUrl }),
    ...(cardDetails.link && { href: cardDetails.link }),
    ...(productInfo.productId && { productId: productInfo.productId }),
    ...(productInfo.src && { src: productInfo.src }),
    ...(cardDetails.products &&
      cardDetails.products.length > 0 && {
        productId: cardDetails.products[0]?.productId,
      }),
  };
};

const contentItemToCategory = (item: ContentItem): Category => {
  const cardDetails: Partial<CardDetails> = {
    ...(item.description && { description: item.description }),
    ...(item.src && { image: item.src }),
    ...(item.href && { link: item.href }),
    ...(item.productId && { products: [{ id: item.id, productId: item.productId }] }),
  };

  return {
    id: item.id,
    title: item.title || `${item.type} item`,
    card: [item.type, cardDetails as CardDetails],
    categoryType: [item.type, { children: [] }],
    order: item.position,
    visible: item.isVisible,
  };
};

// Component types for the content palette
const COMPONENT_TYPES = [
  { type: "image" as const, label: "Image", description: "Add photos, artwork, or graphics" },
  { type: "video" as const, label: "Video", description: "Embed videos or clips" },
  { type: "product" as const, label: "Product", description: "Showcase products from your shop" },
  { type: "text" as const, label: "Text", description: "Add headings, descriptions, or links" },
  { type: "link" as const, label: "Link", description: "External links and CTAs" },
  { type: "social" as const, label: "Social", description: "Social media links and feeds" },
] as const;

// Sortable item component
function SortableItem({
  item,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  item: ContentItem;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: ContentItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getItemPreview = (item: ContentItem) => {
    switch (item.type) {
      case "image":
        return item.src ? (
          <img src={item.src} alt={item.alt || ""} className="w-16 h-16 object-cover rounded" />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              No image
            </Text>
          </div>
        );
      case "video":
        return (
          <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Video
            </Text>
          </div>
        );
      case "product":
        return item.src ? (
          <img src={item.src} alt={item.title || "Product"} className="w-16 h-16 object-cover rounded" />
        ) : (
          <div className="w-16 h-16 bg-green-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Product
            </Text>
          </div>
        );
      case "text":
        return (
          <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Text
            </Text>
          </div>
        );
      case "link":
        return (
          <div className="w-16 h-16 bg-orange-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Link
            </Text>
          </div>
        );
      case "social":
        return (
          <div className="w-16 h-16 bg-pink-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Social
            </Text>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            <Text variant="bodySm" tone="subdued" as="span">
              Item
            </Text>
          </div>
        );
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card>
        <div className="p-4 flex items-center gap-4">
          {/* Drag handle */}
          <div {...listeners} className="cursor-move p-1 hover:bg-gray-100 rounded">
            <Icon source={DragHandleIcon} />
          </div>

          {/* Item preview */}
          {getItemPreview(item)}

          {/* Item details */}
          <div className="flex-1">
            <LegacyStack>
              <div className="flex items-center gap-2">
                <Text variant="headingMd" as="h3">
                  {item.title || `${item.type} item`}
                </Text>
                <Badge tone="info">{item.type}</Badge>
              </div>
              {item.description && (
                <Text variant="bodySm" tone="subdued" as="span">
                  {item.description}
                </Text>
              )}
            </LegacyStack>
          </div>

          {/* Action buttons */}
          <ButtonGroup>
            <Button size="slim" onClick={() => onEdit(item)} icon={EditIcon} />
            <Button size="slim" onClick={() => onDuplicate(item)} icon={DuplicateIcon} />
            <Button
              size="slim"
              tone="critical"
              onClick={() => onDelete(item.id)}
              icon={DeleteIcon}
            />
          </ButtonGroup>
        </div>
      </Card>
    </div>
  );
}

// Component palette for adding new items
function ComponentPalette({
  onAddComponent,
}: {
  onAddComponent: (type: ContentItem["type"]) => void;
}) {
  return (
    <Card>
      <div className="p-4">
        <Text variant="headingMd" as="h2">
          Add Components
        </Text>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {COMPONENT_TYPES.map((component) => (
            <Button
              key={component.type}
              size="slim"
              onClick={() => onAddComponent(component.type)}
              icon={PlusIcon}
            >
              {component.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function VisualEditor({ config, onConfigChange, onPreview }: VisualEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [_editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        // Since we're working with flattened items, we need to rebuild the categories
        // This is a simplified implementation - in production you'd want more sophisticated logic
        console.log("Drag and drop reordering is currently limited for products");
        // For now, just reset the active ID without reordering
        // A full implementation would need to track which items belong to which categories
        // and rebuild the category structure after reordering
      }

      setActiveId(null);
    },
    [config, onConfigChange, onPreview]
  );

  const addComponent = useCallback(
    (type: ContentItem["type"]) => {
      const newCategory: Category = {
        id: `${type}-${Date.now()}`,
        title: `New ${type}`,
        card: [
          type,
          {
            description: `A new ${type} component`,
            ...(type === "image" && { image: "" }),
            ...(type === "video" && { videoUrl: "" }),
            ...(type === "product" && { products: [] }),
            ...(type === "link" && { link: "" }),
          },
        ],
        categoryType: [type, { children: [] }],
        order: config.categories?.length || 0,
        visible: true,
      };

      const updatedConfig = {
        ...config,
        categories: [...(config.categories || []), newCategory],
      };

      onConfigChange(updatedConfig);
      onPreview?.(updatedConfig);
    },
    [config, onConfigChange, onPreview]
  );

  const editItem = useCallback((item: ContentItem) => {
    setEditingItem(item);
  }, []);

  const deleteItem = useCallback(
    (id: string) => {
      const updatedConfig = {
        ...config,
        categories: (config.categories || []).filter((category) => category.id !== id),
      };
      onConfigChange(updatedConfig);
      onPreview?.(updatedConfig);
    },
    [config, onConfigChange, onPreview]
  );

  const duplicateItem = useCallback(
    (item: ContentItem) => {
      // Convert ContentItem to Category for duplication
      const originalCategory = contentItemToCategory(item);
      const duplicatedCategory: Category = {
        ...originalCategory,
        id: `${item.type}-${Date.now()}",
        title: "${item.title} (Copy)`,
        order: config.categories?.length || 0,
      };

      const updatedConfig = {
        ...config,
        categories: [...(config.categories || []), duplicatedCategory],
      };

      onConfigChange(updatedConfig);
      onPreview?.(updatedConfig);
    },
    [config, onConfigChange, onPreview]
  );

  // Convert categories to content items for the UI
  const categories = config.categories || [];
  const items: ContentItem[] = [];
  
  // Flatten categories, expanding product categories to show individual products
  categories.forEach((category) => {
    const [categoryType, categoryDetails] = category.categoryType || [];
    
    if (categoryType === "products" && categoryDetails?.children?.length > 0) {
      // For product categories, add each product as a separate item
      categoryDetails.children.forEach((product: Category, index: number) => {
        if (product?.card?.[1]) {
          const productCard = product.card[1];
          items.push({
            id: product.id,
            type: "product",
            title: product.title || "Product",
            description: productCard.description || undefined,
            position: (category.order || 0) * 100 + index, // Maintain order within category
            isVisible: product.visible !== false,
            productId: (productCard as any).productId || product.id,
            src: productCard.image || (productCard as any).imageUrl,
            showPrice: true,
            showDescription: true,
          });
        }
      });
    } else {
      // For non-product categories, add as single item
      items.push(categoryToContentItem(category));
    }
  });
  
  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Component palette */}
      <ComponentPalette onAddComponent={addComponent} />

      {/* Content list */}
      <Card>
        <div className="p-4">
          <Text variant="headingMd" as="h2">
            Page Content
          </Text>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Text variant="bodyLg" tone="subdued" as="p">
                No content added yet. Use the components above to get started!
              </Text>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {/* Group products with a header */}
                  {items.filter(item => item.type !== "product").length > 0 && (
                    <>
                      <Text variant="headingSm" as="h3" tone="subdued">
                        Page Components
                      </Text>
                      {items.filter(item => item.type !== "product").map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onEdit={editItem}
                          onDelete={deleteItem}
                          onDuplicate={duplicateItem}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Show products in a separate section */}
                  {items.filter(item => item.type === "product").length > 0 && (
                    <>
                      <div className="mt-4">
                        <Text variant="headingSm" as="h3" tone="subdued">
                          Shop Products ({items.filter(item => item.type === "product").length} items)
                        </Text>
                      </div>
                      {items.filter(item => item.type === "product").map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onEdit={editItem}
                          onDelete={deleteItem}
                          onDuplicate={duplicateItem}
                        />
                      ))}
                    </>
                  )}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeItem && (
                  <div className="opacity-90">
                    <SortableItem
                      item={activeItem}
                      onEdit={() => undefined}
                      onDelete={() => undefined}
                      onDuplicate={() => undefined}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </Card>
    </div>
  );
}
