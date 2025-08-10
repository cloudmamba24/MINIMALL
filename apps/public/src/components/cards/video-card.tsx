"use client";

import { Pause, Play, Volume2, VolumeX, cn } from "@minimall/ui";
import Image from "next/image";
import { useRef, useState } from "react";

interface VideoCardProps {
  title: string;
  videoUrl?: string;
  imageUrl?: string; // Thumbnail
  link?: Record<string, unknown>;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
}

export function VideoCard({
  title,
  videoUrl,
  imageUrl,
  link,
  className,
  autoPlay = false,
  muted = true,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setShowThumbnail(false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoClick = () => {
    if (link) {
      if (typeof link === "string") {
        window.open(link, "_blank", "noopener,noreferrer");
      } else if (link.url) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    } else {
      handlePlayToggle();
    }
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg bg-muted aspect-square transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        className
      )}
      onClick={handleVideoClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleVideoClick();
        }
      }}
    >
      <div className="relative w-full h-full">
        {/* Thumbnail Image */}
        {showThumbnail && imageUrl && (
          <div className="absolute inset-0 z-10">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Video Element */}
        {videoUrl && !videoError ? (
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-300",
              showThumbnail && "opacity-0",
              !showThumbnail && "opacity-100 group-hover:scale-105"
            )}
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setVideoError(true)}
            onLoadedData={() => {
              if (autoPlay) {
                videoRef.current?.play();
                setShowThumbnail(false);
              }
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl.replace(".mp4", ".webm")} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
            <div className="w-12 h-12 mb-3 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <Play className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground text-center px-2">
              {videoError ? "Video unavailable" : title}
            </p>
          </div>
        )}

        {/* Play/Pause Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
          <button
            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:bg-black/70 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayToggle();
            }}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
        </div>

        {/* Video Controls */}
        {videoUrl && !videoError && !showThumbnail && (
          <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:bg-black/70"
              onClick={handleMuteToggle}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 z-10">
          <h3 className="text-white font-medium text-sm truncate">{title}</h3>
        </div>

        {/* Video Indicator Badge */}
        <div className="absolute top-2 left-2 z-10">
          <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs font-medium">
            VIDEO
          </div>
        </div>
      </div>
    </div>
  );
}
