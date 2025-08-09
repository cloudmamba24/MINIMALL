'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, LegacyStack, Text, Icon, Badge, ButtonGroup } from '@shopify/polaris';
import { PlusIcon, DragHandleIcon, EditIcon, DeleteIcon, DuplicateIcon } from '@shopify/polaris-icons';
import type { SiteConfig, ContentItem } from '@minimall/core';

interface VisualEditorProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onPreview?: (config: SiteConfig) => void;
}

interface DragItem {
  id: string;
  type: ContentItem['type'];
  item: ContentItem;
}

// Component types for the content palette
const COMPONENT_TYPES = [
  { type: 'image' as const, label: 'Image', description: 'Add photos, artwork, or graphics' },
  { type: 'video' as const, label: 'Video', description: 'Embed videos or clips' },
  { type: 'product' as const, label: 'Product', description: 'Showcase products from your shop' },
  { type: 'text' as const, label: 'Text', description: 'Add headings, descriptions, or links' },
  { type: 'link' as const, label: 'Link', description: 'External links and CTAs' },
  { type: 'social' as const, label: 'Social', description: 'Social media links and feeds' },
] as const;

// Sortable item component
function SortableItem({ item, onEdit, onDelete, onDuplicate }: {
  item: ContentItem;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: ContentItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getItemPreview = (item: ContentItem) => {
    switch (item.type) {
      case 'image':
        return item.src ? (
          <img src={item.src} alt={item.alt || ''} className="w-16 h-16 object-cover rounded" />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">No image</Text>
          </div>
        );
      case 'video':
        return (
          <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Video</Text>
          </div>
        );
      case 'product':
        return (
          <div className="w-16 h-16 bg-green-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Product</Text>
          </div>
        );
      case 'text':
        return (
          <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Text</Text>
          </div>
        );
      case 'link':
        return (
          <div className="w-16 h-16 bg-orange-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Link</Text>
          </div>
        );
      case 'social':
        return (
          <div className="w-16 h-16 bg-pink-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Social</Text>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            <Text variant="bodySm" color="subdued">Item</Text>
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
                <Text variant="headingMd">{item.title || `${item.type} item`}</Text>
                <Badge tone="info">{item.type}</Badge>
              </div>
              {item.description && (
                <Text variant="bodySm" color="subdued">{item.description}</Text>
              )}
            </LegacyStack>
          </div>

          {/* Action buttons */}
          <ButtonGroup>
            <Button size="slim" onClick={() => onEdit(item)}>
              <Icon source={EditIcon} />
            </Button>
            <Button size="slim" onClick={() => onDuplicate(item)}>
              <Icon source={DuplicateIcon} />
            </Button>
            <Button size="slim" tone="critical" onClick={() => onDelete(item.id)}>
              <Icon source={DeleteIcon} />
            </Button>
          </ButtonGroup>
        </div>
      </Card>
    </div>
  );
}

// Component palette for adding new items
function ComponentPalette({ onAddComponent }: {
  onAddComponent: (type: ContentItem['type']) => void;
}) {
  return (
    <Card title="Add Components">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
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
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = config.content || [];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newContent = arrayMove(items, oldIndex, newIndex);
        const updatedConfig = {
          ...config,
          content: newContent,
        };
        onConfigChange(updatedConfig);
        onPreview?.(updatedConfig);
      }
    }

    setActiveId(null);
  }, [config, onConfigChange, onPreview]);

  const addComponent = useCallback((type: ContentItem['type']) => {
    const newItem: ContentItem = {
      id: `${type}-${Date.now()}`,
      type,
      title: `New ${type}`,
      position: (config.content?.length || 0) + 1,
      isVisible: true,
      ...(type === 'image' && {
        src: '',
        alt: '',
        width: 400,
        height: 300,
      }),
      ...(type === 'video' && {
        src: '',
        thumbnail: '',
        autoplay: false,
      }),
      ...(type === 'product' && {
        productId: '',
        handle: '',
        showPrice: true,
        showDescription: true,
      }),
      ...(type === 'text' && {
        content: 'Add your text here...',
        style: {
          fontSize: 16,
          color: '#000000',
          textAlign: 'left' as const,
        },
      }),
      ...(type === 'link' && {
        href: '',
        target: '_blank',
        style: {
          buttonStyle: 'primary' as const,
        },
      }),
      ...(type === 'social' && {
        platform: 'instagram' as const,
        username: '',
        showFollowers: false,
      }),
    };

    const updatedConfig = {
      ...config,
      content: [...(config.content || []), newItem],
    };
    
    onConfigChange(updatedConfig);
    onPreview?.(updatedConfig);
  }, [config, onConfigChange, onPreview]);

  const editItem = useCallback((item: ContentItem) => {
    setEditingItem(item);
  }, []);

  const deleteItem = useCallback((id: string) => {
    const updatedConfig = {
      ...config,
      content: (config.content || []).filter(item => item.id !== id),
    };
    onConfigChange(updatedConfig);
    onPreview?.(updatedConfig);
  }, [config, onConfigChange, onPreview]);

  const duplicateItem = useCallback((item: ContentItem) => {
    const duplicatedItem: ContentItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      title: `${item.title} (Copy)`,
      position: (config.content?.length || 0) + 1,
    };

    const updatedConfig = {
      ...config,
      content: [...(config.content || []), duplicatedItem],
    };
    
    onConfigChange(updatedConfig);
    onPreview?.(updatedConfig);
  }, [config, onConfigChange, onPreview]);

  const items = config.content || [];
  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Component palette */}
      <ComponentPalette onAddComponent={addComponent} />

      {/* Content list */}
      <Card title="Page Content">
        <div className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Text variant="bodyLg" color="subdued">
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
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={editItem}
                      onDelete={deleteItem}
                      onDuplicate={duplicateItem}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeItem && (
                  <div className="opacity-90">
                    <SortableItem
                      item={activeItem}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
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