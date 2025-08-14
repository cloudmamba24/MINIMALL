"use client";

import { StreamingUploader, type UploadProgress, type UploadResult } from "@minimall/core/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader,
  Pause,
  Play,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";

interface StreamingImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
  maxSize?: number; // in MB
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
}

interface UploadState {
  status: "idle" | "uploading" | "completed" | "error" | "paused";
  progress?: UploadProgress;
  error?: string;
  uploader?: StreamingUploader;
  result?: UploadResult;
}

export function StreamingImageUpload({
  value,
  onChange,
  onRemove,
  className = "",
  disabled = false,
  maxSize = 50, // 50MB default for streaming
  quality = 0.85,
  maxWidth = 2048,
  maxHeight = 2048,
}: StreamingImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setUploadState({ status: "idle" });
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setUploadState({
          status: "error",
          error: `File size exceeds ${maxSize}MB limit`,
        });
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        setUploadState({
          status: "error",
          error: "Only JPEG, PNG, WebP, GIF, and SVG images are allowed",
        });
        return;
      }

      try {
        const uploader = new StreamingUploader(file, {
          quality,
          maxWidth,
          maxHeight,
          onProgress: (progress) => {
            setUploadState((prev) => ({
              ...prev,
              status: "uploading",
              progress,
              uploader,
            }));
          },
          onComplete: (result) => {
            setUploadState({
              status: "completed",
              result,
            });
            onChange(result.url);
          },
          onError: (error) => {
            setUploadState({
              status: "error",
              error: error.message,
            });
          },
        });

        setUploadState({
          status: "uploading",
          uploader,
        });

        await uploader.upload();
      } catch (error) {
        console.error("Upload error:", error);
        setUploadState({
          status: "error",
          error: "Upload failed. Please try again.",
        });
      }
    },
    [maxSize, quality, maxWidth, maxHeight, onChange]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = async () => {
    if (uploadState.uploader) {
      await uploadState.uploader.cancel();
      resetUploadState();
    }
  };

  const handleRemove = () => {
    onRemove?.();
    resetUploadState();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (value && uploadState.status !== "uploading") {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <img src={value} alt="Uploaded asset preview" className="w-full h-48 object-cover" />

          {/* Upload result info */}
          {uploadState.result && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {uploadState.result.compressed && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {uploadState.result.originalSize &&
                    (
                      ((uploadState.result.originalSize - uploadState.result.size) /
                        uploadState.result.originalSize) *
                      100
                    ).toFixed(0)}
                  % smaller
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {!disabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                    title="Replace image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploadState.status === "uploading"}
      />

      <motion.div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}
          ${uploadState.status === "error" ? "border-red-500 bg-red-50" : ""}
        `}
        onClick={!disabled && uploadState.status === "idle" ? openFileDialog : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        {...(!disabled && uploadState.status === "idle"
          ? {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 },
            }
          : {})}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Status Icon */}
          <div className="p-3 bg-gray-100 rounded-full">
            {uploadState.status === "uploading" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Loader className="w-6 h-6 text-blue-500" />
              </motion.div>
            )}
            {uploadState.status === "completed" && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
            {uploadState.status === "error" && <AlertCircle className="w-6 h-6 text-red-500" />}
            {uploadState.status === "idle" &&
              (dragActive ? (
                <Upload className="w-6 h-6 text-blue-500" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              ))}
          </div>

          {/* Status Text */}
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {uploadState.status === "uploading" && "Uploading..."}
              {uploadState.status === "completed" && "Upload Complete"}
              {uploadState.status === "error" && "Upload Failed"}
              {uploadState.status === "idle" && "Upload an image"}
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              {uploadState.status === "idle" &&
                `Drag and drop or click to browse (max ${maxSize}MB)`}
              {uploadState.status === "error" && uploadState.error}
              {uploadState.status === "completed" && uploadState.result && (
                <span>
                  {formatBytes(uploadState.result.size)}
                  {uploadState.result.compressed &&
                    uploadState.result.originalSize &&
                    ` • Optimized (${(((uploadState.result.originalSize - uploadState.result.size) / uploadState.result.originalSize) * 100).toFixed(0)}% smaller)`}
                </span>
              )}
            </p>
          </div>

          {/* Progress Bar for Uploading */}
          {uploadState.status === "uploading" && uploadState.progress && (
            <div className="w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadState.progress.percentage}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(uploadState.progress.percentage)}%</span>
                <span>
                  {formatBytes(uploadState.progress.loaded)} /{" "}
                  {formatBytes(uploadState.progress.total)}
                </span>
              </div>
              {uploadState.progress.speed && uploadState.progress.remainingTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(uploadState.progress.speed)}/s •{" "}
                  {formatTime(uploadState.progress.remainingTime)} remaining
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {uploadState.status === "uploading" && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Cancel Upload
            </button>
          )}

          {uploadState.status === "error" && (
            <button
              type="button"
              onClick={resetUploadState}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}

          {/* Supported Formats */}
          {uploadState.status === "idle" && (
            <div className="flex space-x-2 text-xs text-gray-400">
              <span>JPEG</span>
              <span>PNG</span>
              <span>WebP</span>
              <span>GIF</span>
              <span>SVG</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
