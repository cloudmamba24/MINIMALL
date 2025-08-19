"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StoryProgressBarsProps {
  totalItems: number;
  currentIndex: number;
  isPaused: boolean;
  onComplete: () => void;
  duration?: number; // Duration in ms for each item
  isVideo?: boolean;
  videoDuration?: number; // Actual video duration in seconds
}

export function StoryProgressBars({
  totalItems,
  currentIndex,
  isPaused,
  onComplete,
  duration = 5000,
  isVideo = false,
  videoDuration = 0,
}: StoryProgressBarsProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  // Use video duration if available, otherwise default duration
  const itemDuration = isVideo && videoDuration > 0 ? videoDuration * 1000 : duration;

  useEffect(() => {
    // Reset progress when index changes
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();

    if (isPaused) {
      // Store elapsed time when pausing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start progress animation
    const updateInterval = 16; // ~60fps
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = elapsedRef.current + (now - startTimeRef.current);
      const newProgress = Math.min((elapsed / itemDuration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress >= 100) {
        onComplete();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentIndex, isPaused, itemDuration, onComplete]);

  // Sync with video playback if using requestVideoFrameCallback
  useEffect(() => {
    if (!isVideo || !window.requestVideoFrameCallback) return;

    const video = document.querySelector('video:not([data-ignore-progress])') as HTMLVideoElement;
    if (!video) return;

    videoRef.current = video;
    let frameId: number;

    const updateProgressFromVideo = () => {
      if (video.duration && video.currentTime) {
        const videoProgress = (video.currentTime / video.duration) * 100;
        setProgress(videoProgress);
        
        if (videoProgress >= 99.5) {
          onComplete();
        } else if (!isPaused) {
          frameId = video.requestVideoFrameCallback(updateProgressFromVideo);
        }
      }
    };

    if ('requestVideoFrameCallback' in video) {
      frameId = video.requestVideoFrameCallback(updateProgressFromVideo);
    }

    return () => {
      if (frameId && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameId);
      }
    };
  }, [currentIndex, isVideo, isPaused, onComplete]);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
      {Array.from({ length: totalItems }).map((_, index) => (
        <div
          key={index}
          className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width:
                index < currentIndex
                  ? "100%"
                  : index === currentIndex
                  ? `${progress}%`
                  : "0%",
            }}
            transition={{
              duration: 0.1,
              ease: "linear",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Hook to use with video elements
export function useVideoProgress(videoElement: HTMLVideoElement | null) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoElement) return;

    const handleLoadedMetadata = () => setDuration(videoElement.duration);
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);

    // Initial state
    if (videoElement.duration) setDuration(videoElement.duration);
    setIsPlaying(!videoElement.paused);

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [videoElement]);

  return { duration, currentTime, isPlaying };
}