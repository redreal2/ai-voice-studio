import { motion } from "framer-motion";
import { File, X } from "lucide-react";
import type { FileItem } from "@/pages/Index";

interface FileCardProps {
  file: FileItem;
  onClick: () => void;
  onRemove: () => void;
}

const typeIcons: Record<string, string> = {
  PDF: "📄",
  TXT: "📝",
  DOC: "📋",
  DOCX: "📋",
  MD: "📑",
  CSV: "📊",
  JSON: "⚙️",
  HTML: "🌐",
};

const FileCard = ({ file, onClick, onRemove }: FileCardProps) => {
  const isPlaying = file.status === "playing";
  const isProcessing = file.status === "processing";

  return (
    <motion.div
      layout
      layoutId={file.id}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onClick}
      className={`group relative w-full aspect-[4/5] rounded-lg bg-surface border cursor-pointer flex flex-col items-center justify-center p-4 transition-shadow ${
        isPlaying
          ? "border-accent file-shadow-hover"
          : isProcessing
          ? "border-accent/50 file-shadow"
          : "border-[hsl(0_0%_100%/0.05)] file-shadow hover:file-shadow-hover"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>

      {(isPlaying || isProcessing) && (
        <div className="absolute top-2 left-2">
          <div className={`w-2 h-2 rounded-full ${isProcessing ? "bg-accent/50" : "bg-accent"} animate-pulse-dot`} />
        </div>
      )}

      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-3 text-2xl">
        {typeIcons[file.type] || <File className="w-6 h-6 text-muted-foreground" />}
      </div>

      <span className="font-mono text-[11px] text-muted-foreground truncate w-full text-center leading-tight">
        {file.name}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground/50 mt-1">
        {file.size}
      </span>

      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider ${
        isPlaying
          ? "bg-accent/20 text-accent"
          : isProcessing
          ? "bg-accent/10 text-accent/70"
          : "bg-secondary text-muted-foreground"
      }`}>
        {isPlaying ? "Lecture" : isProcessing ? "Génération..." : "Prêt"}
      </div>
    </motion.div>
  );
};

export default FileCard;
