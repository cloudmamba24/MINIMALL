"use client";

import {
  Badge,
  Banner,
  Button,
  ButtonGroup,
  Card,
  EmptyState,
  Filters,
  LegacyStack,
  Modal,
  ResourceItem,
  ResourceList,
  Select,
  Spinner,
  Tabs,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import {
  DeleteIcon,
  EditIcon,
  FilterIcon,
  FolderIcon,
  ImageIcon,
  LayoutColumns2Icon,
  ListBulletedIcon,
  PlayIcon,
  SearchIcon,
  UploadIcon,
} from "@shopify/polaris-icons";
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

interface AssetFile {
  id: string;
  name: string;
  originalName: string;
  type: "image" | "video" | "document";
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  folder?: string;
  tags?: string[];
  uploadedAt: Date;
  lastModified?: Date;
}

interface AssetManagerProps {
  onSelectAsset?: (asset: AssetFile) => void;
  allowMultiSelect?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number;
  folder?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export function AssetManager({
  onSelectAsset,
  allowMultiSelect = false,
  acceptedTypes = ["image/*", "video/*"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  folder = "uploads",
}: AssetManagerProps) {
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, _setFolderFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTab, setSelectedTab] = useState(0);
  const [editingAsset, setEditingAsset] = useState<AssetFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "all", content: "All Assets", panelID: "all-assets" },
    { id: "images", content: "Images", panelID: "image-assets" },
    { id: "videos", content: "Videos", panelID: "video-assets" },
    { id: "recent", content: "Recent", panelID: "recent-assets" },
  ];

  // Load assets on mount
  useEffect(() => {
    loadAssets();
  }, [folder]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets?folder=${folder}`);
      if (!response.ok) throw new Error("Failed to load assets");

      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      setError("Failed to load assets");
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // File upload logic
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploads: UploadProgress[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploading(uploads);

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        if (!file) continue;

        try {
          // Create form data
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          // Upload with progress tracking
          const response = await fetch("/api/assets/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();

          // Update upload progress
          setUploading((prev) =>
            prev.map((upload, index) =>
              index === i ? { ...upload, progress: 100, status: "completed" as const } : upload
            )
          );

          // Add to assets list
          setAssets((prev) => [result.asset, ...prev]);
        } catch (error) {
          setUploading((prev) =>
            prev.map((upload, index) =>
              index === i
                ? {
                    ...upload,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : upload
            )
          );
        }
      }

      // Clear uploads after 3 seconds
      setTimeout(() => {
        setUploading([]);
      }, 3000);
    },
    [folder]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: maxFileSize,
    multiple: true,
  });

  // Filter assets based on current filters
  const filteredAssets = assets.filter((asset) => {
    // Search filter
    if (
      searchQuery &&
      !asset.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !asset.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Tab filter
    switch (selectedTab) {
      case 1: // Images
        return asset.type === "image";
      case 2: // Videos
        return asset.type === "video";
      case 3: {
        // Recent (last 24 hours)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(asset.uploadedAt) > dayAgo;
      }
      default: // All
        break;
    }

    // Type filter
    if (typeFilter !== "all" && asset.type !== typeFilter) {
      return false;
    }

    // Folder filter
    if (folderFilter !== "all" && asset.folder !== folderFilter) {
      return false;
    }

    return true;
  });

  const handleAssetSelect = (asset: AssetFile) => {
    if (allowMultiSelect) {
      setSelectedAssets((prev) =>
        prev.includes(asset.id) ? prev.filter((id) => id !== asset.id) : [...prev, asset.id]
      );
    } else {
      onSelectAsset?.(asset);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete asset");

      setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
      setSelectedAssets((prev) => prev.filter((id) => id !== assetId));
    } catch (_error) {
      setError("Failed to delete asset");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const _getAssetIcon = (asset: AssetFile) => {
    switch (asset.type) {
      case "image":
        return ImageIcon;
      case "video":
        return PlayIcon;
      default:
        return FolderIcon;
    }
  };

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <Banner tone="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      {/* Upload area */}
      <Card>
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Text variant="bodyLg" as="p">
                {isDragActive ? "Drop files here..." : "Drag & drop files here, or click to select"}
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Supports: {acceptedTypes.join(", ")} • Max size: {formatFileSize(maxFileSize)}
              </Text>
            </div>
          </div>
        </div>

        {/* File rejections */}
        {fileRejections.length > 0 && (
          <div className="mt-4">
            <Banner tone="warning">
              <Text variant="bodySm" as="p">
                Some files were rejected: {fileRejections.map((r) => r.file.name).join(", ")}
              </Text>
            </Banner>
          </div>
        )}

        {/* Upload progress */}
        {uploading.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploading.map((upload) => (
              <div
                key={upload.file.name + upload.file.size}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <Text variant="bodySm" as="span">
                  {upload.file.name}
                </Text>
                {upload.status === "uploading" && <Spinner size="small" />}
                {upload.status === "completed" && <Badge tone="success">Completed</Badge>}
                {upload.status === "error" && (
                  <Badge tone="critical">{`Error: ${upload.error || "Upload failed"}`}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />

      {/* Filters and search */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <TextField
                label="Search assets"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by filename..."
                prefix={<SearchIcon />}
                autoComplete="off"
              />
            </div>
            <div className="w-48">
              <Select
                label="Type"
                options={[
                  { label: "All types", value: "all" },
                  { label: "Images", value: "image" },
                  { label: "Videos", value: "video" },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>
            <ButtonGroup>
              <Button
                pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                icon={LayoutColumns2Icon}
              />
              <Button
                pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                icon={ListBulletedIcon}
              />
            </ButtonGroup>
          </div>
        </div>
      </Card>

      {/* Assets display */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <Spinner size="large" />
            <Text variant="bodyLg" as="p">
              Loading assets...
            </Text>
          </div>
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            heading="No assets found"
            action={{ content: "Upload files", onAction: () => {} }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Upload some files to get started with your asset library.</p>
          </EmptyState>
        ) : viewMode === "grid" ? (
          // Grid view
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`relative group border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAssets.includes(asset.id)
                    ? "border-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleAssetSelect(asset)}
              >
                <div className="aspect-square p-2">
                  {asset.type === "image" ? (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.originalName}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                      <UploadIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <ButtonGroup>
                    <Button size="slim" onClick={() => setEditingAsset(asset)} icon={EditIcon} />
                    <Button
                      size="slim"
                      tone="critical"
                      onClick={() => handleDeleteAsset(asset.id)}
                      icon={DeleteIcon}
                    />
                  </ButtonGroup>
                </div>

                <div className="p-2">
                  <Text variant="bodySm" truncate as="p">
                    {asset.originalName}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {formatFileSize(asset.size)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <ResourceList
            resourceName={{ singular: "asset", plural: "assets" }}
            items={filteredAssets}
            renderItem={(asset) => {
              const { id, originalName, type, size, uploadedAt, url, thumbnailUrl } = asset;
              return (
                <ResourceItem
                  id={id}
                  onClick={() => handleAssetSelect(asset)}
                  media={<Thumbnail source={thumbnailUrl || url} alt={originalName} size="small" />}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Text variant="bodyMd" as="h3">
                        {originalName}
                      </Text>
                      <div className="flex gap-2 mt-1">
                        <Badge>{type}</Badge>
                        <Text variant="bodySm" tone="subdued" as="span">
                          {formatFileSize(size)} • {new Date(uploadedAt).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                    <ButtonGroup>
                      <Button size="slim" onClick={() => setEditingAsset(asset)}>
                        Edit
                      </Button>
                      <Button size="slim" tone="critical" onClick={() => handleDeleteAsset(id)}>
                        Delete
                      </Button>
                    </ButtonGroup>
                  </div>
                </ResourceItem>
              );
            }}
          />
        )}
      </Card>

      {/* Edit asset modal */}
      {editingAsset && (
        <Modal
          open={Boolean(editingAsset)}
          onClose={() => setEditingAsset(null)}
          title="Edit Asset"
          primaryAction={{
            content: "Save",
            onAction: () => {
              // TODO: Implement asset editing
              setEditingAsset(null);
            },
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setEditingAsset(null),
            },
          ]}
        >
          <Modal.Section>
            <LegacyStack>
              <TextField
                label="Name"
                value={editingAsset.name}
                onChange={(value) => setEditingAsset({ ...editingAsset, name: value })}
                autoComplete="off"
              />
              <TextField
                label="Alt text (for images)"
                value=""
                onChange={() => {}}
                helpText="Describe this image for accessibility"
                autoComplete="off"
              />
              <TextField
                label="Tags"
                value={editingAsset.tags?.join(", ") || ""}
                onChange={() => {}}
                helpText="Separate tags with commas"
                autoComplete="off"
              />
            </LegacyStack>
          </Modal.Section>
        </Modal>
      )}
    </div>
  );
}
