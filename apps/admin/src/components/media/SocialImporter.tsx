"use client";

import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  FormLayout,
  Modal,
  Select,
  Spinner,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import {
  // DownloadIcon, // This icon doesn't exist in Polaris icons
  ImageIcon,
  ImportIcon,
  LinkIcon,
  PlayIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import React, { useState, useCallback } from "react";
import { type SocialMediaPost, getSupportedPlatforms } from "../../lib/social-extractors";
import { DragDropUrlImport } from "./DragDropUrlImport";

interface SocialImporterProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (assets: ImportedAsset[]) => void;
  folder?: string;
}

interface ImportedAsset {
  id: string;
  url: string;
  type: "image" | "video";
  filename: string;
  size: number;
  metadata: Record<string, any>;
}

interface ImportResult {
  success: boolean;
  post?: SocialMediaPost;
  assets?: ImportedAsset[];
  error?: string;
}

export function SocialImporter({
  open,
  onClose,
  onImportComplete,
  folder = "social-imports",
}: SocialImporterProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "import" | "complete">("input");

  // Form state
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [downloadMedia, setDownloadMedia] = useState(true);
  const [processImages, setProcessImages] = useState(true);
  const [generateTags, setGenerateTags] = useState(true);

  // Preview state
  const [previewPost, setPreviewPost] = useState<SocialMediaPost | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const supportedPlatforms = getSupportedPlatforms();

  const validateUrl = useCallback(async (urlToValidate: string) => {
    try {
      const response = await fetch(`/api/social/import?url=${encodeURIComponent(urlToValidate)}`);
      const data = await response.json();

      if (!data.valid) {
        return false;
      }

      console.log(`[SocialImporter] URL validated for ${data.platform}`);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const extractContent = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/social/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folder,
          downloadMedia: false, // Preview mode - don't download yet
          processImages: false,
          generateTags,
        }),
      });

      const data: ImportResult = await response.json();

      if (!data.success) {
        setUrlError(data.error || "Failed to extract content");
        return;
      }

      setPreviewPost(data.post || null);
      setStep("preview");
    } catch (error) {
      setUrlError("Failed to extract content");
    } finally {
      setLoading(false);
    }
  }, [url, folder, generateTags]);

  const importContent = useCallback(async () => {
    if (!previewPost) return;

    setImporting(true);
    setStep("import");

    try {
      const response = await fetch("/api/social/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folder,
          downloadMedia,
          processImages,
          generateTags,
        }),
      });

      const data: ImportResult = await response.json();

      if (!data.success) {
        setUrlError(data.error || "Import failed");
        setStep("preview");
        return;
      }

      setImportResult(data);
      setStep("complete");

      if (data.assets) {
        onImportComplete(data.assets);
      }
    } catch (error) {
      setUrlError("Import failed");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }, [url, folder, downloadMedia, processImages, generateTags, previewPost, onImportComplete]);

  const handleUrlSubmit = useCallback(
    async (urls: string[]) => {
      if (urls.length > 0 && urls[0]) {
        setUrl(urls[0]); // For now, take the first URL
        setStep("preview");
        await extractContent();
      }
    },
    [extractContent]
  );

  const handleNext = useCallback(async () => {
    switch (step) {
      case "preview":
        await importContent();
        break;
    }
  }, [step, importContent]);

  const handleBack = useCallback(() => {
    switch (step) {
      case "preview":
        setStep("input");
        setPreviewPost(null);
        break;
      case "import":
        setStep("preview");
        break;
      case "complete":
        onClose();
        break;
    }
  }, [step, onClose]);

  const resetForm = useCallback(() => {
    setUrl("");
    setUrlError(null);
    setPreviewPost(null);
    setImportResult(null);
    setStep("input");
    setDownloadMedia(true);
    setProcessImages(true);
    setGenerateTags(true);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
  }, []);

  const getPrimaryAction = () => {
    switch (step) {
      case "input":
        return undefined; // No primary action for input step with drag & drop
      case "preview":
        return {
          content: importing ? "Importing..." : "Import Media",
          onAction: handleNext,
          loading: importing,
          disabled: !previewPost,
        };
      case "import":
        return {
          content: "Importing...",
          onAction: () => {},
          loading: true,
          disabled: true,
        };
      case "complete":
        return {
          content: "Done",
          onAction: handleClose,
        };
    }
  };

  const getSecondaryActions = () => {
    const actions = [];

    if (step === "preview" || step === "import") {
      actions.push({
        content: "Back",
        onAction: handleBack,
      });
    }

    actions.push({
      content: "Cancel",
      onAction: handleClose,
    });

    return actions;
  };

  const primaryAction = getPrimaryAction();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import from Social Media"
      size="large"
      {...(primaryAction && { primaryAction })}
      secondaryActions={getSecondaryActions()}
    >
      <Modal.Section>
        {step === "input" && (
          <div className="space-y-6">
            {/* Enhanced Drag & Drop URL Import */}
            <DragDropUrlImport
              onUrlSubmit={handleUrlSubmit}
              onValidateUrl={validateUrl}
              loading={loading}
              error={urlError}
              acceptedDomains={supportedPlatforms.map((p) => p.platform.replace(/^(www\.)?/, ""))}
              placeholder="Drop Instagram, TikTok, Twitter, YouTube, or Pinterest URLs here"
            />

            {/* Import Options */}
            <Card>
              <div className="p-4">
                <Text variant="headingMd" as="h3">
                  Import Options
                </Text>
                <div className="mt-4 space-y-3">
                  <Checkbox
                    label="Download media files"
                    checked={downloadMedia}
                    onChange={setDownloadMedia}
                    helpText="Download and store images/videos in your asset library"
                  />

                  <Checkbox
                    label="Process images"
                    checked={processImages}
                    onChange={setProcessImages}
                    disabled={!downloadMedia}
                    helpText="Optimize images for web with format conversion and compression"
                  />

                  <Checkbox
                    label="Generate content tags"
                    checked={generateTags}
                    onChange={setGenerateTags}
                    helpText="Automatically generate tags based on content analysis"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "preview" && previewPost && (
          <div className="space-y-6">
            {/* Post Preview */}
            <Card>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImportIcon />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text variant="headingMd" as="h3">
                        @{previewPost.author.username}
                      </Text>
                      {previewPost.author.verified && <Badge tone="info">Verified</Badge>}
                      <Badge>{previewPost.platform}</Badge>
                    </div>

                    {previewPost.caption && (
                      <Text variant="bodyMd" as="p" truncate>
                        {previewPost.caption}
                      </Text>
                    )}

                    {previewPost.hashtags.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {previewPost.hashtags.slice(0, 5).map((tag, index) => (
                          <Badge key={`hashtag-${index}`}>
                            {`#${Array.isArray(tag) ? tag.join(" ") : String(tag)}`}
                          </Badge>
                        ))}
                        {previewPost.hashtags.length > 5 && (
                          <Badge>{`+${previewPost.hashtags.length - 5} more`}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Media Preview */}
            <Card>
              <div className="p-4">
                <Text variant="headingMd" as="h3">
                  Media ({previewPost.media.length})
                </Text>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewPost.media.map((media, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-200 rounded-lg overflow-hidden aspect-square"
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.thumbnailUrl || media.url}
                          alt={media.altText || `Media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <PlayIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <Text variant="bodySm" tone="subdued" as="p">
                              Video {media.duration && `(${media.duration}s)`}
                            </Text>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <Badge tone={media.type === "image" ? "info" : "success"}>
                          {media.type}
                        </Badge>
                      </div>

                      {media.width && media.height && (
                        <div className="absolute bottom-2 right-2">
                          <Badge>{`${media.width} × ${media.height}`}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Engagement Stats */}
            {previewPost.engagement && (
              <Card>
                <div className="p-4">
                  <Text variant="headingMd" as="h3">
                    Engagement
                  </Text>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewPost.engagement.likes && (
                      <div className="text-center">
                        <Text variant="headingLg" as="p">
                          {previewPost.engagement.likes.toLocaleString()}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Likes
                        </Text>
                      </div>
                    )}

                    {previewPost.engagement.views && (
                      <div className="text-center">
                        <Text variant="headingLg" as="p">
                          {previewPost.engagement.views.toLocaleString()}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Views
                        </Text>
                      </div>
                    )}

                    {previewPost.engagement.comments && (
                      <div className="text-center">
                        <Text variant="headingLg" as="p">
                          {previewPost.engagement.comments.toLocaleString()}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Comments
                        </Text>
                      </div>
                    )}

                    {previewPost.engagement.shares && (
                      <div className="text-center">
                        <Text variant="headingLg" as="p">
                          {previewPost.engagement.shares.toLocaleString()}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Shares
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {step === "import" && (
          <div className="text-center py-8">
            <Spinner size="large" />
            <Text variant="headingMd" as="h2">
              Importing content...
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              Downloading and processing media files
            </Text>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-6">
            {/* Success Message */}
            <Card>
              <div className="p-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImportIcon className="w-8 h-8 text-green-600" />
                </div>

                <Text variant="headingLg" as="h2">
                  Import Complete!
                </Text>

                <Text variant="bodyMd" tone="subdued" as="p">
                  Successfully imported {importResult.assets?.length || 0} media files
                </Text>
              </div>
            </Card>

            {/* Imported Assets */}
            {importResult.assets && importResult.assets.length > 0 && (
              <Card>
                <div className="p-4">
                  <Text variant="headingMd" as="h3">
                    Imported Assets
                  </Text>

                  <div className="mt-4 space-y-3">
                    {importResult.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <Thumbnail source={asset.url} alt={asset.filename} size="small" />

                        <div className="flex-1">
                          <Text variant="bodyMd" as="p">
                            {asset.filename}
                          </Text>
                          <div className="flex gap-2 mt-1">
                            <Badge tone={asset.type === "image" ? "info" : "success"}>
                              {asset.type}
                            </Badge>
                            <Text variant="bodySm" tone="subdued" as="span">
                              {formatFileSize(asset.size)}
                            </Text>
                          </div>
                        </div>

                        <Button size="slim" icon={ViewIcon} url={asset.url} external>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal.Section>
    </Modal>
  );
}
