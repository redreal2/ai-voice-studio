import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
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
  elevenLabsId: string;
}

const VOICES: Voice[] = [
  { id: "v1", name: "Sarah", style: "Narratrice", elevenLabsId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "v2", name: "Roger", style: "Sérieux", elevenLabsId: "CwhRBWXzGAHq8TQ4Fs17" },
  { id: "v3", name: "Laura", style: "Dynamique", elevenLabsId: "FGY2WhTYpPnrIDTdsKH5" },
  { id: "v4", name: "George", style: "Narrateur", elevenLabsId: "JBFqnCBsd6RMkjVDRZzb" },
  { id: "v5", name: "Lily", style: "Calme", elevenLabsId: "pFZP5JQG7iQjIQuC4Bku" },
  { id: "v6", name: "Daniel", style: "Professionnel", elevenLabsId: "onwK4e9ZLuTAKqWW03F9" },
];

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingFile, setPlayingFile] = useState<FileItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFiles = async (rawFiles: File[]) => {
    const newFiles: FileItem[] = [];
    for (const f of rawFiles) {
      const content = await readFileContent(f).catch(() => "");
      newFiles.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: formatSize(f.size),
        type: f.name.split(".").pop()?.toUpperCase() || "FILE",
        status: "ready",
        content: content || `Contenu du fichier ${f.name}`,
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} fichier${newFiles.length > 1 ? "s" : ""} importé${newFiles.length > 1 ? "s" : ""}`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
  }, []);

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setSidebarOpen(true);
  };

  const handlePlay = async (file: FileItem) => {
    if (!file.content) {
      toast.error("Impossible de lire le contenu du fichier");
      return;
    }

    // Stop current audio
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }

    setIsLoading(true);
    setPlayingFile(file);
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: f.id === file.id ? "processing" : f.status === "playing" ? "ready" : f.status,
      }))
    );
    setSidebarOpen(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: file.content.substring(0, 5000),
            voiceId: selectedVoice.elevenLabsId,
            speed: 1,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Erreur ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        setFiles((prev) => prev.map((f) => ({ ...f, status: f.status === "playing" ? "ready" : f.status })));
      };

      setAudioElement(audio);
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: f.id === file.id ? "playing" : f.status,
        }))
      );
      toast.success("Lecture lancée avec la voix de " + selectedVoice.name);
    } catch (error) {
      console.error("TTS error:", error);
      setIsLoading(false);
      setPlayingFile(null);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "ready" })));
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération audio");
    }
  };

  const handleTogglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleClosePlayer = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }
    setAudioElement(null);
    setPlayingFile(null);
    setIsPlaying(false);
    setFiles((prev) => prev.map((f) => ({ ...f, status: f.status === "playing" ? "ready" : f.status })));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) {
      setSidebarOpen(false);
      setSelectedFile(null);
    }
    if (playingFile?.id === id) handleClosePlayer();
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
                  Glissez-déposez vos fichiers texte ici. L'IA les lira avec une voix naturelle ElevenLabs.
                </p>
                <label className="cursor-pointer px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                  Importer un fichier
                  <input type="file" className="hidden" multiple accept=".txt,.md,.csv,.json,.html" onChange={handleFileInput} />
                </label>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-4">
                  Formats supportés : TXT, MD, CSV, JSON, HTML
                </p>
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
              <motion.label
                layout
                key="add-more"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full aspect-[4/5] rounded-lg border border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Ajouter</span>
                <input type="file" className="hidden" multiple accept=".txt,.md,.csv,.json,.html" onChange={handleFileInput} />
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
        isLoading={isLoading}
      />

      {/* Audio Player */}
      <AnimatePresence>
        {(playingFile || isLoading) && (
          <AudioPlayer
            file={playingFile!}
            voice={selectedVoice}
            isPlaying={isPlaying}
            isLoading={isLoading}
            audioElement={audioElement}
            onTogglePlay={handleTogglePlay}
            onClose={handleClosePlayer}
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
