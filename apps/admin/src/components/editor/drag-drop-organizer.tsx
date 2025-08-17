"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
import { Card, Icon, Text } from "@shopify/polaris";
import { DragHandleIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";

interface DragDropItem {
  id: string;
  title: string;
  type: "section" | "product" | "collection";
  thumbnail?: string;
  children?: DragDropItem[];
}

interface DragDropOrganizerProps {
  items: DragDropItem[];
  onItemsChange: (items: DragDropItem[]) => void;
  renderItem?: (item: DragDropItem) => React.ReactNode;
}

function SortableItem({
  item,
  isDragging,
}: {
  item: DragDropItem;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card>
        <div className="flex items-center p-3">
          <div
            {...listeners}
            className="cursor-move p-1 hover:bg-gray-100 rounded mr-3"
          >
            <Icon source={DragHandleIcon} />
          </div>
          
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-12 h-12 object-cover rounded mr-3"
            />
          )}
          
          <div className="flex-1">
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {item.title}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              {item.type}
            </Text>
          </div>

          {item.children && item.children.length > 0 && (
            <div className="text-gray-500">
              {item.children.length} items
            </div>
          )}
        </div>

        {/* Nested items */}
        {item.children && item.children.length > 0 && (
          <div className="border-t px-3 py-2 bg-gray-50">
            <DragDropOrganizer
              items={item.children}
              onItemsChange={(newChildren) => {
                // Update nested children
                item.children = newChildren;
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export function DragDropOrganizer({
  items,
  onItemsChange,
  renderItem,
}: DragDropOrganizerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onItemsChange(newItems);
        }
      }

      setActiveId(null);
    },
    [items, onItemsChange]
  );

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  return (
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
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              isDragging={item.id === activeId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <div className="opacity-90">
            <Card>
              <div className="flex items-center p-3">
                <Icon source={DragHandleIcon} />
                <span className="ml-3">{activeItem.title}</span>
              </div>
            </Card>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}