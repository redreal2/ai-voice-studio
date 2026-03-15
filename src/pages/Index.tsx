import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload } from "lucide-react";
import FileCard from "@/components/FileCard";
import VoiceSidebar from "@/components/VoiceSidebar";
import AudioPlayer from "@/components/AudioPlayer";

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "ready" | "processing" | "playing";
  content?: string;
}

export interface Voice {
  id: string;
  name: string;
  style: string;
  preview?: string;
}

const VOICES: Voice[] = [
  { id: "v1", name: "Clara", style: "Narratrice" },
  { id: "v2", name: "Thomas", style: "Sérieuse" },
  { id: "v3", name: "Sophie", style: "Dynamique" },
  { id: "v4", name: "Lucas", style: "Narrateur" },
  { id: "v5", name: "Emma", style: "Calme" },
];

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingFile, setPlayingFile] = useState<FileItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileItem[] = droppedFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: formatSize(f.size),
      type: f.name.split(".").pop()?.toUpperCase() || "FILE",
      status: "ready" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(e.target.files || []);
    const newFiles: FileItem[] = inputFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: formatSize(f.size),
      type: f.name.split(".").pop()?.toUpperCase() || "FILE",
      status: "ready" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setSidebarOpen(true);
  };

  const handlePlay = (file: FileItem) => {
    setPlayingFile(file);
    setIsPlaying(true);
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: f.id === file.id ? "playing" : f.status === "playing" ? "ready" : f.status,
      }))
    );
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) {
      setSidebarOpen(false);
      setSelectedFile(null);
    }
    if (playingFile?.id === id) {
      setPlayingFile(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-foreground" />
          </div>
          <span className="text-foreground font-medium tracking-tight text-lg">Echo Desktop</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {files.length} fichier{files.length !== 1 ? "s" : ""}
        </span>
      </motion.header>

      {/* Desktop Area */}
      <main
        className="pt-24 pb-32 px-8 min-h-screen"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {files.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              <motion.div
                animate={isDragOver ? { scale: 1.05, borderColor: "hsl(217, 91%, 60%)" } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center w-full max-w-lg rounded-2xl border-2 border-dashed border-muted p-16 transition-colors"
              >
                <motion.div
                  animate={isDragOver ? { y: -8 } : { y: 0 }}
                  className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-6"
                >
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </motion.div>
                <h1 className="text-2xl font-medium text-foreground tracking-tight mb-2">
                  Écoutez vos documents.
                </h1>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
                  Glissez-déposez vos fichiers ici ou cliquez pour importer. L'IA les lira avec une voix naturelle.
                </p>
                <label className="cursor-pointer px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                  Importer un fichier
                  <input type="file" className="hidden" multiple accept=".pdf,.txt,.doc,.docx,.md" onChange={handleFileInput} />
                </label>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Grid */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => handleFileClick(file)}
                  onRemove={() => handleRemoveFile(file.id)}
                />
              ))}

              {/* Add more button */}
              <motion.label
                layout
                key="add-more"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full aspect-[4/5] rounded-lg border border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Ajouter</span>
                <input type="file" className="hidden" multiple accept=".pdf,.txt,.doc,.docx,.md" onChange={handleFileInput} />
              </motion.label>
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Voice Sidebar */}
      <VoiceSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        voices={VOICES}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        selectedFile={selectedFile}
        onPlay={handlePlay}
      />

      {/* Audio Player */}
      <AnimatePresence>
        {playingFile && (
          <AudioPlayer
            file={playingFile}
            voice={selectedVoice}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onClose={() => {
              setPlayingFile(null);
              setIsPlaying(false);
              setFiles((prev) => prev.map((f) => ({ ...f, status: f.status === "playing" ? "ready" : f.status })));
            }}
          />
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="text-xl text-foreground font-medium">Déposez vos fichiers ici</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default Index;
