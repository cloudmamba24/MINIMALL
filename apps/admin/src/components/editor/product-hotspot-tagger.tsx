"use client";

import { Badge, Button, Card, Icon, Modal, Select, Text } from "@shopify/polaris";
import { DeleteIcon, PlusCircleIcon, ProductIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";

interface ProductHotspot {
  id: string;
  productId: string;
  position: { x: number; y: number };
  label: string;
}

interface Product {
  id: string;
  title: string;
  image?: string;
  price?: string;
}

interface ProductHotspotTaggerProps {
  imageUrl: string;
  products: Product[];
  hotspots?: ProductHotspot[];
  onHotspotsChange: (hotspots: ProductHotspot[]) => void;
}

export function ProductHotspotTagger({
  imageUrl,
  products,
  hotspots = [],
  onHotspotsChange,
}: ProductHotspotTaggerProps) {
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAddingHotspot) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPendingPosition({ x, y });
      setShowProductModal(true);
    },
    [isAddingHotspot]
  );

  const handleAddHotspot = useCallback(() => {
    if (!selectedProduct || !pendingPosition) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newHotspot: ProductHotspot = {
      id: `hotspot-${Date.now()}`,
      productId: selectedProduct,
      position: pendingPosition,
      label: product.title,
    };

    onHotspotsChange([...hotspots, newHotspot]);
    setShowProductModal(false);
    setSelectedProduct("");
    setPendingPosition(null);
    setIsAddingHotspot(false);
  }, [selectedProduct, pendingPosition, products, hotspots, onHotspotsChange]);

  const handleRemoveHotspot = useCallback(
    (hotspotId: string) => {
      onHotspotsChange(hotspots.filter((h) => h.id !== hotspotId));
    },
    [hotspots, onHotspotsChange]
  );

  const productOptions = products.map((p) => ({
    label: p.title,
    value: p.id,
  }));

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Text variant="headingMd" as="h3">
            Product Tagging
          </Text>
          <Button
            icon={PlusCircleIcon}
            onClick={() => setIsAddingHotspot(!isAddingHotspot)}
            pressed={isAddingHotspot}
          >
            {isAddingHotspot ? "Click on image to tag" : "Add Hotspot"}
          </Button>
        </div>

        {/* Image with hotspots */}
        <div
          className={`relative cursor-${isAddingHotspot ? "crosshair" : "default"}`}
          onClick={handleImageClick}
        >
          <img src={imageUrl} alt="Content" className="w-full rounded-lg" />

          {/* Render existing hotspots */}
          {hotspots.map((hotspot) => {
            const product = products.find((p) => p.id === hotspot.productId);
            return (
              <div
                key={hotspot.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hotspot.position.x}%`,
                  top: `${hotspot.position.y}%`,
                }}
              >
                {/* Hotspot dot */}
                <div className="relative">
                  <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
                    <div className="w-6 h-6 bg-black rounded-full"></div>
                  </div>

                  {/* Product tooltip */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 min-w-[150px] opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                      {product?.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Icon source={ProductIcon} />
                        </div>
                      )}
                      <div>
                        <Text variant="bodySm" fontWeight="semibold" as="p">
                          {product?.title || hotspot.label}
                        </Text>
                        {product?.price && (
                          <Text variant="bodySm" tone="subdued" as="p">
                            ${product.price}
                          </Text>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHotspot(hotspot.id);
                      }}
                      className="absolute top-1 right-1 text-red-500"
                    >
                      <Icon source={DeleteIcon} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending hotspot indicator */}
          {isAddingHotspot && pendingPosition && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${pendingPosition.x}%`,
                top: `${pendingPosition.y}%`,
              }}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        {/* Hotspot list */}
        {hotspots.length > 0 && (
          <div className="mt-4">
            <Text variant="headingSm" as="h4">
              Tagged Products ({hotspots.length})
            </Text>
            <div className="flex flex-wrap gap-2 mt-2">
              {hotspots.map((hotspot) => {
                const product = products.find((p) => p.id === hotspot.productId);
                return (
                  <Badge key={hotspot.id} tone="info">
                    {product?.title || hotspot.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product selection modal */}
      <Modal
        open={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setPendingPosition(null);
          setSelectedProduct("");
        }}
        title="Select Product to Tag"
        primaryAction={{
          content: "Add Tag",
          onAction: handleAddHotspot,
          disabled: !selectedProduct,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowProductModal(false);
              setPendingPosition(null);
              setSelectedProduct("");
            },
          },
        ]}
      >
        <Modal.Section>
          <Select
            label="Choose a product"
            options={productOptions}
            value={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="Select a product..."
          />

          {selectedProduct && (
            <div className="mt-4">
              {(() => {
                const product = products.find((p) => p.id === selectedProduct);
                if (!product) return null;
                return (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <Icon source={ProductIcon} />
                      </div>
                    )}
                    <div>
                      <Text variant="bodyMd" fontWeight="semibold" as="p">
                        {product.title}
                      </Text>
                      {product.price && (
                        <Text variant="bodySm" tone="subdued" as="p">
                          ${product.price}
                        </Text>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </Card>
  );
}