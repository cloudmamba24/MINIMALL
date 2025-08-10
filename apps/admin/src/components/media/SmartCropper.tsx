"use client";

import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  FormLayout,
  Modal,
  RangeSlider,
  Select,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  CropIcon,
  ImageIcon,
  ResetIcon,
  ViewIcon,
  AdjustIcon,
} from "@shopify/polaris-icons";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { type ProcessingOptions } from "../../lib/image-processing";
import { conditionalProps } from "../../lib/type-utils";

interface SmartCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  originalFilename: string;
  onProcess: (options: ProcessingOptions) => Promise<void>;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

export function SmartCropper({
  open,
  onClose,
  imageUrl,
  originalFilename,
  onProcess,
}: SmartCropperProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cropping options
  const [aspectRatio, setAspectRatio] = useState<ProcessingOptions["aspectRatio"]>("original");
  const [smartCrop, setSmartCrop] = useState(true);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  
  // Format options
  const [format, setFormat] = useState<ProcessingOptions["format"]>("auto");
  const [quality, setQuality] = useState([80]);
  const [progressive, setProgressive] = useState(true);
  
  // Enhancement options
  const [sharpen, setSharpen] = useState(false);
  const [enhance, setEnhance] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  
  // Responsive options
  const [generateVariants, setGenerateVariants] = useState(true);
  const [customSizes, setCustomSizes] = useState("400,800,1200,1600");
  
  // Canvas refs for focus point selection
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const aspectRatioOptions = [
    { label: "Original", value: "original" },
    { label: "Square (1:1)", value: "1:1" },
    { label: "Portrait (4:5)", value: "4:5" },
    { label: "Story (9:16)", value: "9:16" },
    { label: "Landscape (16:9)", value: "16:9" },
    { label: "Photo (3:2)", value: "3:2" },
  ];

  const formatOptions = [
    { label: "Auto (Best)", value: "auto" },
    { label: "WebP", value: "webp" },
    { label: "AVIF", value: "avif" },
    { label: "JPEG", value: "jpeg" },
    { label: "PNG", value: "png" },
  ];

  // Load image metadata on mount
  useEffect(() => {
    if (open && imageUrl) {
      loadImageMetadata();
    }
  }, [open, imageUrl]);

  const loadImageMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media/process?imageUrl=${encodeURIComponent(imageUrl)}`);
      if (!response.ok) throw new Error("Failed to load image metadata");
      
      const data = await response.json();
      setImageMetadata({
        width: data.metadata.width,
        height: data.metadata.height,
        format: data.metadata.format,
        size: data.fileSize,
        aspectRatio: data.metadata.width / data.metadata.height,
      });
      
      // Apply suggested options
      const suggested = data.suggestedOptions;
      setAspectRatio(suggested.aspectRatio || "original");
      setFormat(suggested.format || "auto");
      setQuality([suggested.quality || 80]);
      setSharpen(suggested.sharpen || false);
      setEnhance(suggested.enhance || false);
      setCustomSizes(suggested.sizes?.join(",") || "400,800,1200,1600");
    } catch (error) {
      console.error("Failed to load image metadata:", error);
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

  // Handle canvas click for focus point selection
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    setFocusPoint({ x: Math.round(x), y: Math.round(y) });
  }, []);

  // Draw focus point on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageMetadata) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw focus point
    const x = (focusPoint.x / 100) * canvas.width;
    const y = (focusPoint.y / 100) * canvas.height;
    
    ctx.strokeStyle = "#ff6b35";
    ctx.fillStyle = "#ff6b35";
    ctx.lineWidth = 2;
    
    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 107, 53, 0.3)";
    ctx.fill();
  }, [focusPoint, imageMetadata]);

  const generatePreview = useCallback(async () => {
    if (!imageMetadata) return;
    
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("imageUrl", imageUrl);
      formData.append("uploadToR2", "false"); // Preview only
      formData.append("generateVariants", "false");
      formData.append("options", JSON.stringify({
        aspectRatio,
        smartCrop,
        focusPoint: smartCrop ? focusPoint : undefined,
        format: "webp", // Fast preview format
        quality: 60, // Lower quality for preview
        progressive,
        sharpen,
        enhance,
        removeBackground,
      }));
      
      const response = await fetch("/api/media/process", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Preview generation failed");
      
      const data = await response.json();
      // In a real implementation, you'd get the processed image buffer and create a preview URL
      // For now, we'll just indicate preview is ready
      setPreviewUrl("preview-ready");
    } catch (error) {
      console.error("Preview failed:", error);
    } finally {
      setProcessing(false);
    }
  }, [imageUrl, aspectRatio, smartCrop, focusPoint, format, quality, progressive, sharpen, enhance, removeBackground, imageMetadata]);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const sizes = customSizes.split(",").map(s => parseInt(s.trim())).filter(Boolean);
      
      const baseOptions = {
        smartCrop,
        quality: quality[0] ?? 85,
        progressive,
        sharpen,
        enhance,
        removeBackground,
        stripExif: true,
      };
      
      const optionalOptions = conditionalProps({
        aspectRatio,
        focusPoint: smartCrop ? focusPoint : undefined,
        format,
        sizes: generateVariants ? sizes : undefined,
      });
      
      const options = { ...baseOptions, ...optionalOptions } as ProcessingOptions;
      
      await onProcess(options);
    } catch (error) {
      console.error("Processing failed:", error);
    } finally {
      setProcessing(false);
    }
  }, [aspectRatio, smartCrop, focusPoint, format, quality, progressive, customSizes, generateVariants, sharpen, enhance, removeBackground, onProcess]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
  }, []);

  const calculateNewDimensions = useCallback(() => {
    if (!imageMetadata || aspectRatio === "original" || !aspectRatio) return imageMetadata;
    
    const targetRatio = getAspectRatioValue(aspectRatio);
    const currentRatio = imageMetadata.aspectRatio;
    
    let newWidth = imageMetadata.width;
    let newHeight = imageMetadata.height;
    
    if (currentRatio > targetRatio) {
      newWidth = Math.round(newHeight * targetRatio);
    } else {
      newHeight = Math.round(newWidth / targetRatio);
    }
    
    return { ...imageMetadata, width: newWidth, height: newHeight, aspectRatio: targetRatio };
  }, [imageMetadata, aspectRatio]);

  if (loading) {
    return (
      <Modal open={open} onClose={onClose} title="Smart Cropper">
        <Modal.Section>
          <div className="text-center py-8">
            <Spinner size="large" />
            <Text variant="bodyLg" as="p">
              Analyzing image...
            </Text>
          </div>
        </Modal.Section>
      </Modal>
    );
  }

  const newDimensions = calculateNewDimensions();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Smart Cropper - ${originalFilename}`}
      size="large"
      primaryAction={{
        content: processing ? "Processing..." : "Process Image",
        onAction: handleProcess,
        loading: processing,
        disabled: !imageMetadata,
      }}
      secondaryActions={[
        {
          content: "Preview",
          onAction: generatePreview,
          loading: processing && !previewUrl,
          disabled: !imageMetadata,
        },
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <Card>
            <div className="p-4">
              <Text variant="headingMd" as="h3">
                Image Preview
              </Text>
              
              <div className="mt-4 relative">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={originalFilename}
                  className="w-full h-auto max-h-80 object-contain border border-gray-200 rounded"
                  onLoad={() => {
                    if (canvasRef.current && imageRef.current) {
                      const canvas = canvasRef.current;
                      const image = imageRef.current;
                      canvas.width = image.offsetWidth;
                      canvas.height = image.offsetHeight;
                    }
                  }}
                />
                
                {/* Focus Point Canvas Overlay */}
                {smartCrop && (
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    onClick={handleCanvasClick}
                    title="Click to set focus point"
                  />
                )}
              </div>
              
              {imageMetadata && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">Original</Text>
                    <Text variant="bodyMd" as="p">{imageMetadata.width} × {imageMetadata.height}</Text>
                    <Text variant="bodySm" tone="subdued" as="p">{formatFileSize(imageMetadata.size)}</Text>
                  </div>
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">After Crop</Text>
                    <Text variant="bodyMd" as="p">{newDimensions?.width} × {newDimensions?.height}</Text>
                    <Badge tone={newDimensions?.aspectRatio !== imageMetadata.aspectRatio ? "info" : "success"}>
                      {aspectRatio === "original" ? "No change" : "Modified"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Processing Options */}
          <Card>
            <div className="p-4 space-y-4">
              <Text variant="headingMd" as="h3">
                Processing Options
              </Text>
              
              <FormLayout>
                {/* Cropping Options */}
                <div>
                  <Text variant="headingMd" as="h4">
                    Cropping
                  </Text>
                  
                  <div className="mt-2 space-y-3">
                    <Select
                      label="Aspect Ratio"
                      options={aspectRatioOptions}
                      value={aspectRatio || "original"}
                      onChange={(value) => setAspectRatio(value as typeof aspectRatio)}
                    />
                    
                    <Checkbox
                      label="Smart Crop (AI Focus Detection)"
                      checked={smartCrop}
                      onChange={setSmartCrop}
                      helpText="Automatically find the best crop area based on image content"
                    />
                    
                    {smartCrop && (
                      <div className="text-sm bg-gray-50 p-3 rounded">
                        <Text variant="bodySm" tone="subdued" as="p">
                          Focus Point: {focusPoint.x}%, {focusPoint.y}%
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Click on the image above to adjust the focus point
                        </Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* Format Options */}
                <div>
                  <Text variant="headingMd" as="h4">
                    Format & Quality
                  </Text>
                  
                  <div className="mt-2 space-y-3">
                    <Select
                      label="Output Format"
                      options={formatOptions}
                      value={format || "auto"}
                      onChange={(value) => setFormat(value as typeof format)}
                    />
                    
                    <div>
                      <Text variant="bodyMd" as="p">
                        Quality: {quality[0] ?? 85}%
                      </Text>
                      <RangeSlider
                        label=""
                        value={quality[0] ?? 85}
                        min={20}
                        max={100}
                        step={5}
                        onChange={(value) => setQuality([typeof value === 'number' ? value : value[0]])}
                      />
                    </div>
                    
                    <Checkbox
                      label="Progressive (JPEG/WebP)"
                      checked={progressive}
                      onChange={setProgressive}
                      helpText="Better loading experience for large images"
                    />
                  </div>
                </div>

                {/* Enhancement Options */}
                <div>
                  <Text variant="headingMd" as="h4">
                    Enhancement
                  </Text>
                  
                  <div className="mt-2 space-y-3">
                    <Checkbox
                      label="Sharpen"
                      checked={sharpen}
                      onChange={setSharpen}
                    />
                    
                    <Checkbox
                      label="Auto Enhance"
                      checked={enhance}
                      onChange={setEnhance}
                      helpText="Improve brightness, contrast, and saturation"
                    />
                    
                    <Checkbox
                      label="Remove Background"
                      checked={removeBackground}
                      onChange={setRemoveBackground}
                      helpText="Experimental AI background removal"
                    />
                  </div>
                </div>

                {/* Responsive Variants */}
                <div>
                  <Text variant="headingMd" as="h4">
                    Responsive Variants
                  </Text>
                  
                  <div className="mt-2 space-y-3">
                    <Checkbox
                      label="Generate Responsive Variants"
                      checked={generateVariants}
                      onChange={setGenerateVariants}
                    />
                    
                    {generateVariants && (
                      <TextField
                        label="Sizes (widths in pixels)"
                        value={customSizes}
                        onChange={setCustomSizes}
                        placeholder="400,800,1200,1600"
                        helpText="Comma-separated list of widths"
                        autoComplete="off"
                      />
                    )}
                  </div>
                </div>
              </FormLayout>
            </div>
          </Card>
        </div>
      </Modal.Section>
    </Modal>
  );
}

function getAspectRatioValue(aspectRatio: string): number {
  switch (aspectRatio) {
    case "1:1": return 1;
    case "4:5": return 0.8;
    case "9:16": return 0.5625;
    case "16:9": return 1.7778;
    case "3:2": return 1.5;
    default: return 1;
  }
}