import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, X, Gauge, Loader2 } from "lucide-react";
import type { FileItem, Voice } from "@/pages/Index";

interface AudioPlayerProps {
  file: FileItem;
  voice: Voice;
  isPlaying: boolean;
  isLoading: boolean;
  audioElement: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onClose: () => void;
}

const WAVE_BARS = 40;

const AudioPlayer = ({ file, voice, isPlaying, isLoading, audioElement, onTogglePlay, onClose }: AudioPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!audioElement) return;

    const updateProgress = () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        setProgress((audioElement.currentTime / audioElement.duration) * 100);
        setDuration(audioElement.duration);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    rafRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioElement]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentTime = audioElement ? audioElement.currentTime : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 flex items-center gap-6 w-[90vw] max-w-2xl"
    >
      {/* Play/Pause */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTogglePlay}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </motion.button>

      {/* Waveform + Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-foreground font-medium truncate">{file?.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">· {voice.name}</span>
          {duration > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>

        {/* Waveform */}
        <div className="flex items-end gap-[2px] h-5">
          {Array.from({ length: WAVE_BARS }).map((_, i) => {
            const barProgress = (i / WAVE_BARS) * 100;
            const isPast = barProgress < progress;
            const isCurrent = Math.abs(barProgress - progress) < 3;
            const randomHeight = 4 + Math.sin(i * 0.8) * 8 + Math.cos(i * 1.3) * 6;

            return (
              <motion.div
                key={i}
                animate={
                  isPlaying && isCurrent
                    ? { height: [randomHeight, randomHeight + 8, randomHeight], transition: { repeat: Infinity, duration: 0.4 } }
                    : isLoading
                    ? { height: [4, randomHeight, 4], transition: { repeat: Infinity, duration: 1, delay: i * 0.02 } }
                    : { height: randomHeight }
                }
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isPast ? "bg-accent" : "bg-muted"
                }`}
                style={{ height: randomHeight }}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          className="mt-1.5 h-[2px] bg-muted rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (!audioElement || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioElement.currentTime = pct * duration;
          }}
        >
          <motion.div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-surface-hover transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  );
};

export default AudioPlayer;
