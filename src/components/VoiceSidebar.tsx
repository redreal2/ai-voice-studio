import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Volume2, Loader2 } from "lucide-react";
import type { FileItem, Voice } from "@/pages/Index";

interface VoiceSidebarProps {
  open: boolean;
  onClose: () => void;
  voices: Voice[];
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  selectedFile: FileItem | null;
  onPlay: (file: FileItem) => void;
  isLoading: boolean;
}

const VoiceSidebar = ({
  open,
  onClose,
  voices,
  selectedVoice,
  onSelectVoice,
  selectedFile,
  onPlay,
  isLoading,
}: VoiceSidebarProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-surface border-l border-[hsl(0_0%_100%/0.06)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(0_0%_100%/0.06)]">
              <div>
                <h2 className="text-foreground font-medium text-base">Sélecteur de voix</h2>
                {selectedFile && (
                  <p className="font-mono text-xs text-muted-foreground mt-1 truncate max-w-[250px]">
                    {selectedFile.name}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-surface-hover transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {voices.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                return (
                  <motion.button
                    key={voice.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectVoice(voice)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-secondary border border-accent/30"
                        : "bg-background/50 border border-transparent hover:bg-secondary"
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-accent/20" : "bg-muted"
                      }`}>
                        <Volume2 className={`w-4 h-4 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="voice-indicator"
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent animate-pulse-dot"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm text-foreground font-medium">{voice.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{voice.style}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="px-6 py-5 border-t border-[hsl(0_0%_100%/0.06)]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || !selectedFile}
                onClick={() => selectedFile && onPlay(selectedFile)}
                className="w-full py-3 rounded-xl bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    L'IA génère l'audio...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-0.5" />
                    Lancer la lecture
                  </>
                )}
              </motion.button>
              <p className="text-center font-mono text-[10px] text-muted-foreground mt-3">
                Voix : {selectedVoice.name} · {selectedVoice.style}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceSidebar;
