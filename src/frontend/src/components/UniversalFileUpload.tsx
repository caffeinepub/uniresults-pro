/**
 * UniversalFileUpload.tsx
 * Reusable drag-and-drop file upload component that accepts any document type,
 * intelligently extracts rows, and returns data to parent via callbacks.
 */
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type ExtractedFileResult,
  extractFromFile,
  rowsToCourseText,
  rowsToStudentText,
} from "../utils/documentExtractor";

export type FileUploadMode = "student" | "course" | "generic";

export interface UniversalFileUploadProps {
  mode: FileUploadMode;
  onExtractedText?: (text: string, fileName: string, fileType: string) => void;
  onExtractedRows?: (
    rows: string[][],
    headers: string[],
    fileName: string,
    fileType: string,
  ) => void;
  onImage?: (dataUrl: string, name: string) => void;
  onSwitchToPaste?: () => void;
  accept?: string;
  className?: string;
}

const FILE_TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  txt: FileText,
  image: Image,
  pdf: File,
  doc: File,
  docx: File,
  default: File,
};

function getFileTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    csv: "CSV",
    xlsx: "Excel",
    xls: "Excel",
    txt: "Text",
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    webp: "Image",
    gif: "Image",
  };
  return map[ext] ?? ext.toUpperCase();
}

export default function UniversalFileUpload({
  mode,
  onExtractedText,
  onExtractedRows,
  onImage,
  onSwitchToPaste,
  accept = ".csv,.xlsx,.xls,.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif",
  className = "",
}: UniversalFileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedFileResult | null>(null);
  const [imageExtractText, setImageExtractText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setResult(null);
      setFileName(file.name);
      try {
        const extracted = await extractFromFile(file);
        setResult(extracted);

        if (extracted.type === "rows") {
          const { rows, headers } = extracted;
          if (rows.length === 0) {
            toast.warning("File opened but no data rows found.");
          } else {
            toast.success(`Extracted ${rows.length} rows from ${file.name}`);
            if (onExtractedRows) {
              onExtractedRows(
                rows,
                headers,
                file.name,
                getFileTypeLabel(file.name),
              );
            }
            // Also fire text callback for compatibility
            if (onExtractedText) {
              const text =
                mode === "course"
                  ? rowsToCourseText(rows, headers)
                  : rowsToStudentText(rows, headers);
              onExtractedText(text, file.name, getFileTypeLabel(file.name));
            }
          }
        } else if (extracted.type === "text") {
          toast.success(
            `Read ${extracted.text.length} characters from ${file.name}`,
          );
          if (onExtractedText) {
            onExtractedText(extracted.text, file.name, "Text");
          }
        } else if (extracted.type === "image") {
          toast.info("Image loaded. Please type or paste the text below.");
          if (onImage) onImage(extracted.dataUrl, extracted.name);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Failed to process ${file.name}`);
      } finally {
        setLoading(false);
      }
    },
    [mode, onExtractedText, onExtractedRows, onImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  function handleImageTextSubmit() {
    if (!imageExtractText.trim()) {
      toast.error("Please type or paste the text from the image first.");
      return;
    }
    if (onExtractedText) {
      onExtractedText(imageExtractText, fileName, "Image");
    }
    setImageExtractText("");
    setResult(null);
    toast.success("Image text submitted for processing.");
  }

  function reset() {
    setResult(null);
    setFileName("");
    setImageExtractText("");
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop zone */}
      <button
        type="button"
        className={`w-full relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: React.DragEvent<HTMLButtonElement>) =>
          handleDrop(e as unknown as React.DragEvent<HTMLDivElement>)
        }
        onClick={() => !loading && fileRef.current?.click()}
        aria-label="Upload file"
        data-ocid="universal-file-upload.drop-zone"
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
        {loading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {loading ? "Processing…" : "Drop file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports: CSV, Excel (.xlsx/.xls), PDF, Word (.doc/.docx), TXT,
            Images
          </p>
        </div>

        {/* File type icons row */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {["CSV", "Excel", "PDF", "Word", "TXT", "Image"].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </button>

      {/* Result feedback */}
      {result && (
        <div className="rounded-lg border overflow-hidden">
          {/* Row extraction success */}
          {result.type === "rows" && (
            <div className="flex items-start gap-3 p-3 bg-success/10 border-success/20">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Extracted {result.rows.length} rows from{" "}
                  <span className="font-mono text-xs">{fileName}</span>
                </p>
                {result.headers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Columns: {result.headers.slice(0, 6).join(", ")}
                    {result.headers.length > 6
                      ? ` +${result.headers.length - 6} more`
                      : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={reset}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Plain text success */}
          {result.type === "text" && (
            <div className="flex items-start gap-3 p-3 bg-success/10 border-success/20">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Text file loaded — {result.text.length.toLocaleString()}{" "}
                  characters
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Preview: {result.text.slice(0, 80)}…
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={reset}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Image — manual text entry */}
          {result.type === "image" && (
            <div className="p-3 space-y-3 bg-card">
              <div className="flex items-start gap-3">
                <Image className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Image uploaded: {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type or paste the text from this image into the box below.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={reset}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Image preview */}
              <img
                src={result.dataUrl}
                alt="Uploaded document"
                className="w-full max-h-48 object-contain rounded border bg-muted"
              />
              <Textarea
                placeholder="Type or paste the text you can see in this image here…"
                rows={4}
                value={imageExtractText}
                onChange={(e) => setImageExtractText(e.target.value)}
                className="font-mono text-xs"
                data-ocid="universal-file-upload.image-text"
              />
              <Button
                size="sm"
                onClick={handleImageTextSubmit}
                disabled={!imageExtractText.trim()}
                data-ocid="universal-file-upload.image-submit"
              >
                Process Image Text
              </Button>
            </div>
          )}

          {/* Word / PDF / ODT guidance */}
          {result.type === "word_guidance" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Word / PDF detected:{" "}
                    <span className="font-mono text-xs">{result.fileName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These file types can't be auto-extracted. Please:
                  </p>
                  <ol className="text-xs text-muted-foreground list-decimal pl-4 mt-1 space-y-0.5">
                    <li>
                      Open the file in Word, Google Docs, or your PDF viewer
                    </li>
                    <li>Select all content (Ctrl+A / Cmd+A)</li>
                    <li>Copy (Ctrl+C / Cmd+C)</li>
                    <li>Click "Switch to Paste tab" below and paste</li>
                  </ol>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={reset}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {onSwitchToPaste && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-400"
                  onClick={() => {
                    reset();
                    onSwitchToPaste();
                  }}
                  data-ocid="universal-file-upload.switch-paste"
                >
                  Switch to Paste Tab
                </Button>
              )}
            </div>
          )}

          {/* Unsupported file */}
          {result.type === "unsupported" && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  File type not supported:{" "}
                  <span className="font-mono text-xs">{result.fileType}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please use the Paste tab to manually enter data.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={reset}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── File type badge helper (reusable) ───────────────────────────────────────

export function FileTypeBadge({
  fileName,
  fileType,
}: { fileName?: string; fileType?: string }) {
  const raw =
    fileType?.toLowerCase() ?? fileName?.split(".").pop()?.toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    csv: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    xlsx: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    xls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    excel:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    pdf: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    doc: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    docx: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    word: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    image:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    txt: "bg-muted text-muted-foreground",
    text: "bg-muted text-muted-foreground",
    paste:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  };
  const label = raw.includes("excel")
    ? "Excel"
    : raw.includes("word") || raw === "doc" || raw === "docx"
      ? "Word"
      : raw.includes("pdf")
        ? "PDF"
        : raw.includes("image") ||
            ["jpg", "jpeg", "png", "webp", "gif"].includes(raw)
          ? "Image"
          : raw.toUpperCase() || "File";
  const color = colorMap[raw] ?? "bg-muted text-muted-foreground";
  const Icon = FILE_TYPE_ICONS[raw] ?? FILE_TYPE_ICONS.default;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
