import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, X, Gauge } from "lucide-react";
import type { FileItem, Voice } from "@/pages/Index";

interface AudioPlayerProps {
  file: FileItem;
  voice: Voice;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

const WAVE_BARS = 40;

const AudioPlayer = ({ file, voice, isPlaying, onTogglePlay, onClose }: AudioPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 0;
        return p + 0.2 * speed;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const nextSpeed = () => {
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

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
        className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </motion.button>

      {/* Waveform + Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-foreground font-medium truncate">{file.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">· {voice.name}</span>
        </div>

        {/* Waveform visualization */}
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
        <div className="mt-1.5 h-[2px] bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speed */}
      <button
        onClick={nextSpeed}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-surface-hover transition-colors flex-shrink-0"
      >
        <Gauge className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono text-[11px] text-muted-foreground">{speed}x</span>
      </button>

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
