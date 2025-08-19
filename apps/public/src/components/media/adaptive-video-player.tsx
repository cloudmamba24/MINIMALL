"use client";

import MuxPlayer from "@mux/mux-player-react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

interface AdaptiveVideoPlayerProps {
  src: string; // Can be HLS manifest URL or regular video URL
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playbackId?: string; // Mux playback ID if using Mux
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  className?: string;
  preload?: "none" | "metadata" | "auto";
}

export function AdaptiveVideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = false,
  playbackId,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  className = "",
  preload = "metadata",
}: AdaptiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we have a Mux playback ID, use Mux Player
  if (playbackId) {
    const muxProps: any = {
      playbackId,
      autoPlay,
      muted,
      loop,
      className,
      streamType: "on-demand",
      primaryColor: "#8B5CF6",
      secondaryColor: "#EC4899",
      style: {
        "--controls-backdrop-color": "rgba(0, 0, 0, 0.5)",
        "--controls-text-color": "#ffffff",
      } as React.CSSProperties,
    };

    if (poster) muxProps.poster = poster;
    if (onPlay) muxProps.onPlay = onPlay;
    if (onPause) muxProps.onPause = onPause;
    if (onEnded) muxProps.onEnded = onEnded;
    if (onTimeUpdate) {
      muxProps.onTimeUpdate = (e: any) => {
        const video = e.target as HTMLVideoElement;
        onTimeUpdate(video.currentTime, video.duration);
      };
    }
    if (onLoadedMetadata) {
      muxProps.onLoadedMetadata = (e: any) => {
        const video = e.target as HTMLVideoElement;
        onLoadedMetadata(video.duration);
      };
    }
    if (controls === false) {
      muxProps["data-controls"] = "false";
    }

    return <MuxPlayer {...muxProps} />;
  }

  // Setup HLS.js for non-Mux HLS streams
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if src is an HLS manifest
    const isHLS = src.includes(".m3u8");

    if (isHLS) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = src;
        setIsReady(true);
      } else if (Hls.isSupported()) {
        // Use HLS.js for other browsers
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          // Adaptive bitrate settings
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
          abrMaxWithRealBitrate: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          // Performance optimizations
          maxBufferSize: 60 * 1000 * 1000, // 60 MB
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          if (autoPlay) {
            video.play().catch((e) => {
              console.log("Autoplay blocked:", e);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Fatal network error, trying to recover");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Fatal media error, trying to recover");
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal error, cannot recover");
                setError("Video playback error");
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else {
        setError("HLS not supported in this browser");
      }
    } else {
      // Regular video file
      video.src = src;
      setIsReady(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Preload management
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    // Start preloading based on prop
    if (preload === "auto") {
      video.load();
    }
  }, [isReady, preload]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <p className="text-white text-sm">Unable to load video</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline
      preload={preload}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onTimeUpdate={() => {
        if (videoRef.current) {
          onTimeUpdate?.(videoRef.current.currentTime, videoRef.current.duration);
        }
      }}
      onLoadedMetadata={() => {
        if (videoRef.current) {
          onLoadedMetadata?.(videoRef.current.duration);
        }
      }}
      data-ignore-progress={false}
    />
  );
}

// Preloader hook for next/previous videos
export function useVideoPreloader(urls: string[], currentIndex: number) {
  useEffect(() => {
    // Preload next and previous videos
    const preloadIndexes = [
      currentIndex - 1,
      currentIndex + 1,
    ].filter((i) => i >= 0 && i < urls.length);

    const links: HTMLLinkElement[] = [];

    preloadIndexes.forEach((index) => {
      const url = urls[index];
      if (url) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "fetch";
        link.href = url;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
        links.push(link);
      }
    });

    return () => {
      links.forEach((link) => document.head.removeChild(link));
    };
  }, [urls, currentIndex]);
}