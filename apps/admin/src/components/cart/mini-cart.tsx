"use client";

import { Badge, Button, Card, Icon, Popover, Text } from "@shopify/polaris";
import {
  CartIcon,
  DeleteIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@shopify/polaris-icons";
import { useCallback, useState } from "react";

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface MiniCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function MiniCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: MiniCartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = useCallback(
    (productId: string, delta: number) => {
      const item = items.find((i) => i.productId === productId);
      if (item) {
        const newQuantity = Math.max(0, item.quantity + delta);
        if (newQuantity === 0) {
          onRemoveItem(productId);
        } else {
          onUpdateQuantity(productId, newQuantity);
        }
      }
    },
    [items, onUpdateQuantity, onRemoveItem]
  );

  const activator = (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      icon={CartIcon}
      disclosure={isOpen ? "up" : "down"}
    >
      {`Cart ${totalItems > 0 ? `(${totalItems})` : ""}`}
    </Button>
  );

  return (
    <Popover
      active={isOpen}
      activator={activator}
      onClose={() => setIsOpen(false)}
      preferredAlignment="right"
      preferredPosition="below"
    >
      <div className="w-96 max-h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <Text variant="headingMd" as="h3">
            Shopping Cart
          </Text>
          {totalItems > 0 && (
            <Text variant="bodySm" tone="subdued" as="p">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Icon source={CartIcon} />
              <Text variant="bodyMd" tone="subdued" as="p">
                Your cart is empty
              </Text>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <div className="p-3">
                    <div className="flex gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded"></div>
                      )}
                      
                      <div className="flex-1">
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          {item.title}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          ${item.price.toFixed(2)}
                        </Text>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleQuantityChange(item.productId, -1)}
                            className="p-1"
                          >
                            <Icon source={MinusCircleIcon} />
                          </button>
                          <Text variant="bodyMd" as="span">
                            {item.quantity}
                          </Text>
                          <button
                            onClick={() => handleQuantityChange(item.productId, 1)}
                            className="p-1"
                          >
                            <Icon source={PlusCircleIcon} />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-red-500"
                      >
                        <Icon source={DeleteIcon} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between mb-3">
              <Text variant="bodyMd" as="span">
                Subtotal
              </Text>
              <Text variant="bodyMd" fontWeight="semibold" as="span">
                ${totalPrice.toFixed(2)}
              </Text>
            </div>
            
            <Button fullWidth onClick={onCheckout}>
              CHECKOUT
            </Button>
            
            <div className="mt-2 text-center">
              <Text variant="bodySm" tone="subdued" as="p">
                You are saving 30%
              </Text>
              <Text variant="bodySm" tone="success" as="p">
                Remove from cart
              </Text>
            </div>
          </div>
        )}
      </div>
    </Popover>
  );
}