'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  shopId?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className = '',
  shopId = 'demo',
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shopId', shopId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onChange(result.url);
        
        // Show warning if using fallback
        if (result.fallback === 'base64') {
          console.warn('Using temporary data URL - configure R2 storage for permanent hosting');
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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

  if (value) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-48 object-cover"
          />
          <AnimatePresence>
            {!disabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  onClick={onRemove}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <motion.div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onClick={!disabled && !uploading ? openFileDialog : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={!disabled && !uploading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !uploading ? { scale: 0.98 } : undefined}
      >
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-8 h-8 text-blue-500" />
            </motion.div>
          ) : (
            <div className="p-3 bg-gray-100 rounded-full">
              {dragActive ? (
                <Upload className="w-6 h-6 text-blue-500" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {uploading ? 'Uploading...' : 'Upload an image'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {uploading 
                ? 'Please wait while we process your image'
                : 'Drag and drop or click to browse (max 10MB)'
              }
            </p>
          </div>
          
          {!uploading && (
            <div className="flex space-x-2 text-xs text-gray-400">
              <span>JPEG</span>
              <span>PNG</span>
              <span>WebP</span>
              <span>GIF</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}