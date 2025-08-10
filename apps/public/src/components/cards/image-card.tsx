"use client";

import { cn } from "@minimall/ui";
import Image from "next/image";
import { useState } from "react";

interface ImageCardProps {
  title: string;
  imageUrl?: string;
  link?: any;
  shape?: string;
  className?: string;
  onClick?: () => void;
}

export function ImageCard({
  title,
  imageUrl,
  link,
  shape = "square",
  className,
  onClick,
}: ImageCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getAspectRatio = () => {
    switch (shape) {
      case "landscape":
        return "aspect-[4/3]";
      case "portrait":
        return "aspect-[3/4]";
      case "wide":
        return "aspect-[16/9]";
      default:
        return "aspect-square";
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (link) {
      // Handle different link types
      if (typeof link === "string") {
        window.open(link, "_blank", "noopener,noreferrer");
      } else if (link.url) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div
      className={cn(
        "group cursor-pointer overflow-hidden rounded-lg bg-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        getAspectRatio(),
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative w-full h-full">
        {imageUrl && !imageError ? (
          <>
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={cn(
                "object-cover transition-all duration-300 group-hover:scale-105",
                imageLoading && "opacity-0"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageError(true)}
              priority={false}
            />

            {imageLoading && <div className="absolute inset-0 bg-muted loading-shimmer" />}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
            <div className="w-12 h-12 mb-3 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground text-center px-2">{title}</p>
          </div>
        )}

        {/* Overlay with title on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="w-full p-4">
            <h3 className="text-white font-medium text-sm truncate">{title}</h3>
          </div>
        </div>

        {/* Loading indicator */}
        {imageLoading && imageUrl && !imageError && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
