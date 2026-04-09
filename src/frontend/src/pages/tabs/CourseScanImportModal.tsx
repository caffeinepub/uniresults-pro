import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ClipboardPaste,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  ImageIcon,
  Loader2,
  ScanLine,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import UniversalFileUpload from "../../components/UniversalFileUpload";
import { useApp } from "../../context/AppContext";
import {
  parseCourseText,
  rowsToCourseText,
} from "../../utils/documentExtractor";

export interface CourseScanRow {
  sn: number;
  courseCode: string;
  title: string;
  creditUnits: string;
  level: string;
  semester: string;
  status: string; // Core or Elective
}

export interface CourseScanBatch {
  id: string;
  date: string;
  departmentId: string;
  departmentName: string;
  fileName: string;
  fileType: string;
  rows: CourseScanRow[];
}

const SCAN_HISTORY_KEY = "courseScanHistory";

function loadHistory(): CourseScanBatch[] {
  try {
    return JSON.parse(localStorage.getItem(SCAN_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: CourseScanBatch[]) {
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
}

function getFileTypeBadge(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes("csv"))
    return { label: "CSV", color: "bg-green-100 text-green-700" };
  if (t.includes("xlsx") || t.includes("xls") || t.includes("spreadsheet"))
    return { label: "Excel", color: "bg-emerald-100 text-emerald-700" };
  if (t.includes("pdf"))
    return { label: "PDF", color: "bg-red-100 text-red-700" };
  if (t.includes("doc"))
    return { label: "Word", color: "bg-blue-100 text-blue-700" };
  if (
    t.includes("png") ||
    t.includes("jpg") ||
    t.includes("jpeg") ||
    t.includes("image")
  )
    return { label: "Image", color: "bg-purple-100 text-purple-700" };
  return { label: "File", color: "bg-gray-100 text-gray-700" };
}

function EditableCoursesTable({
  rows,
  onChange,
}: {
  rows: CourseScanRow[];
  onChange: (rows: CourseScanRow[]) => void;
}) {
  function update(idx: number, field: keyof CourseScanRow, value: string) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function addRow() {
    onChange([
      ...rows,
      {
        sn: rows.length + 1,
        courseCode: "",
        title: "",
        creditUnits: "2",
        level: "100",
        semester: "First",
        status: "Core",
      },
    ]);
  }

  return (
    <div className="space-y-2">
      <div className="overflow-auto max-h-64 border rounded-lg">
        <table className="text-xs w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-1.5 text-left w-8">#</th>
              <th className="p-1.5 text-left">Code</th>
              <th className="p-1.5 text-left min-w-[160px]">Title</th>
              <th className="p-1.5 text-left w-14">Units</th>
              <th className="p-1.5 text-left w-16">Level</th>
              <th className="p-1.5 text-left w-20">Semester</th>
              <th className="p-1.5 text-left w-20">Status</th>
              <th className="p-1.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`scan-row-${r.courseCode || i}`}
                className="border-t hover:bg-muted/30"
              >
                <td className="p-1 text-muted-foreground text-center">
                  {i + 1}
                </td>
                <td className="p-1">
                  <Input
                    className="h-6 text-xs font-mono px-1 py-0"
                    value={r.courseCode}
                    onChange={(e) => update(i, "courseCode", e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <Input
                    className="h-6 text-xs px-1 py-0"
                    value={r.title}
                    onChange={(e) => update(i, "title", e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <Input
                    className="h-6 text-xs w-12 px-1 py-0"
                    value={r.creditUnits}
                    onChange={(e) => update(i, "creditUnits", e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <select
                    className="h-6 text-xs border rounded px-1 w-full"
                    value={r.level}
                    onChange={(e) => update(i, "level", e.target.value)}
                  >
                    {[
                      "100",
                      "200",
                      "300",
                      "400",
                      "500",
                      "600",
                      "700",
                      "800",
                    ].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <select
                    className="h-6 text-xs border rounded px-1 w-full"
                    value={r.semester}
                    onChange={(e) => update(i, "semester", e.target.value)}
                  >
                    <option value="First">First</option>
                    <option value="Second">Second</option>
                  </select>
                </td>
                <td className="p-1">
                  <select
                    className="h-6 text-xs border rounded px-1 w-full"
                    value={r.status}
                    onChange={(e) => update(i, "status", e.target.value)}
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </td>
                <td className="p-1 text-center">
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="text-xs text-primary underline"
        onClick={addRow}
      >
        + Add row
      </button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  departments: Array<{ id: bigint; name: string }>;
  onImport: (
    deptId: string,
    rows: CourseScanRow[],
    fileName: string,
    fileType: string,
  ) => void;
}

export default function CourseScanImportModal({
  open,
  onClose,
  departments,
  onImport,
}: Props) {
  const { addScanHistory } = useApp();
  // Upload tab state
  const [uploadRows, setUploadRows] = useState<CourseScanRow[]>([]);
  const [uploadDeptId, setUploadDeptId] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileType, setUploadFileType] = useState("");
  const [scanning] = useState(false);

  // Paste tab state
  const [pasteText, setPasteText] = useState("");
  const [pasteRows, setPasteRows] = useState<CourseScanRow[]>([]);
  const [pasteDeptId, setPasteDeptId] = useState("");
  const [pasteError, setPasteError] = useState("");

  // History tab state
  const [history, setHistory] = useState<CourseScanBatch[]>(loadHistory);
  const [viewBatch, setViewBatch] = useState<CourseScanBatch | null>(null);

  // Upload tab guidance state (no longer used — guidance handled by UniversalFileUpload)
  // handleFileChange removed — replaced by handleUniversalExtracted

  // Paste tab step state
  const [pasteStep, setPasteStep] = useState(1);

  function handleUniversalExtracted(
    text: string,
    fileName: string,
    fileType: string,
  ) {
    setUploadFileName(fileName);
    setUploadFileType(fileType);
    const extracted = parseCourseText(text);
    const rows: CourseScanRow[] = extracted.map((r) => ({
      sn: r.sn,
      courseCode: r.courseCode,
      title: r.title,
      creditUnits: r.creditUnits,
      level: r.level,
      semester: r.semester,
      status: r.status,
    }));
    setUploadRows(rows);
    if (rows.length === 0) {
      toast.warning("No courses found in this file. Try the Paste tab.");
    } else {
      toast.success(`Extracted ${rows.length} courses from ${fileName}`);
    }
  }

  function handleUniversalRows(
    rows: string[][],
    headers: string[],
    fileName: string,
    fileType: string,
  ) {
    const text = rowsToCourseText(rows, headers);
    handleUniversalExtracted(text, fileName, fileType);
  }

  function handleParse() {
    setPasteError("");
    const extracted = parseCourseText(pasteText);
    const rows: CourseScanRow[] = extracted.map((r) => ({
      sn: r.sn,
      courseCode: r.courseCode,
      title: r.title,
      creditUnits: r.creditUnits,
      level: r.level,
      semester: r.semester,
      status: r.status,
    }));
    if (rows.length === 0) {
      setPasteError(
        "Could not parse any courses. Ensure each row has: Course Code, Title, Credit Units (tab or comma separated, or multi-line block format).",
      );
    } else {
      setPasteRows(rows);
      setPasteStep(2);
      // Count unique levels for summary
      const levels = [...new Set(rows.map((r) => r.level))].sort();
      toast.success(
        `Extracted ${rows.length} courses from ${levels.length} level(s): ${levels.join(", ")}`,
      );
    }
  }

  function handleImport(
    rows: CourseScanRow[],
    deptId: string,
    fileName: string,
    fileType: string,
  ) {
    if (!deptId) {
      toast.error("Select a department first");
      return;
    }
    if (rows.length === 0) {
      toast.error("No courses to import");
      return;
    }
    const dept = departments.find((d) => String(d.id) === deptId);
    onImport(deptId, rows, fileName, fileType);

    // Save to local history (modal)
    const batch: CourseScanBatch = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      departmentId: deptId,
      departmentName: dept?.name ?? "-",
      fileName: fileName || "Pasted Data",
      fileType: fileType || "paste",
      rows,
    };
    const updated = [batch, ...loadHistory()].slice(0, 50);
    saveHistory(updated);
    setHistory(updated);

    // Save to global scan history
    addScanHistory({
      type: "course",
      fileName: fileName || "Pasted Data",
      fileType: fileType || "paste",
      extractedCount: rows.length,
      previewText: rows
        .slice(0, 5)
        .map((r) => `${r.courseCode} - ${r.title}`)
        .join("; "),
      rows: rows.map((r) => [
        r.courseCode,
        r.title,
        r.creditUnits,
        r.level,
        r.semester,
        r.status,
      ]),
      headers: ["Code", "Title", "Credits", "Level", "Semester", "Status"],
      departmentId: deptId,
      departmentName: dept?.name,
    });

    toast.success(
      `${rows.length} courses imported for ${dept?.name ?? "department"}`,
    );
    onClose();
  }

  function deleteHistory(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          data-ocid="courses.scan.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Scan &amp; Import Courses
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload">
            <TabsList className="w-full">
              <TabsTrigger
                value="upload"
                className="flex-1"
                data-ocid="courses.scan.upload.tab"
              >
                <Upload className="w-4 h-4 mr-1.5" /> Upload File
              </TabsTrigger>
              <TabsTrigger
                value="paste"
                className="flex-1"
                data-ocid="courses.scan.paste.tab"
              >
                <ClipboardPaste className="w-4 h-4 mr-1.5" /> Paste Data
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex-1"
                data-ocid="courses.scan.history.tab"
              >
                <History className="w-4 h-4 mr-1.5" /> Scan History
              </TabsTrigger>
            </TabsList>

            {/* ── Upload File Tab ── */}
            <TabsContent value="upload" className="space-y-4 pt-3">
              {/* 3-step progress indicator */}
              <div className="flex items-center gap-1 mb-1">
                {["1. Upload File", "2. Review & Edit", "3. Import"].map(
                  (label, idx) => (
                    <div key={label} className="flex items-center gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          uploadRows.length > 0 && !scanning
                            ? idx === 0
                              ? "bg-success/20 text-success"
                              : idx === 1
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            : idx === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {uploadRows.length > 0 && !scanning && idx === 0
                          ? "✓ "
                          : ""}
                        {label}
                      </span>
                      {idx < 2 && <div className="w-5 h-px bg-border" />}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Upload + Preview */}
                <div className="space-y-3">
                  <div>
                    <Label>Upload Course Document</Label>
                    <UniversalFileUpload
                      mode="course"
                      onExtractedText={handleUniversalExtracted}
                      onExtractedRows={handleUniversalRows}
                      className="mt-1"
                      data-ocid="courses.scan.dropzone"
                    />
                  </div>

                  {!scanning && uploadRows.length > 0 && (
                    <div className="text-xs p-2 bg-green-50 border border-green-200 rounded text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {uploadRows.length} courses extracted — review &amp;
                        edit before importing
                      </span>
                    </div>
                  )}

                  <div>
                    <Label>Department</Label>
                    <Select
                      value={uploadDeptId}
                      onValueChange={setUploadDeptId}
                    >
                      <SelectTrigger
                        className="mt-1"
                        data-ocid="courses.scan.dept.select"
                      >
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={String(d.id)} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right: Editable Table */}
                <div className="space-y-2">
                  <Label>Extracted Courses (Review &amp; Edit)</Label>
                  {uploadRows.length === 0 && !scanning ? (
                    <div className="border-2 border-dashed border-border rounded-lg h-48 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        Upload a file to see extracted courses
                      </p>
                    </div>
                  ) : (
                    <EditableCoursesTable
                      rows={uploadRows}
                      onChange={setUploadRows}
                    />
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  data-ocid="courses.scan.import_button"
                  disabled={
                    uploadRows.length === 0 || !uploadDeptId || scanning
                  }
                  onClick={() =>
                    handleImport(
                      uploadRows,
                      uploadDeptId,
                      uploadFileName,
                      uploadFileType,
                    )
                  }
                >
                  Import {uploadRows.length > 0 ? `${uploadRows.length} ` : ""}
                  Courses
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Paste Data Tab ── */}
            <TabsContent value="paste" className="space-y-4 pt-3">
              {/* 3-step progress indicator */}
              <div className="flex items-center gap-1 mb-1">
                {["1. Paste", "2. Review & Edit", "3. Import"].map(
                  (label, idx) => (
                    <div key={label} className="flex items-center gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          idx + 1 === pasteStep
                            ? "bg-primary text-primary-foreground"
                            : idx + 1 < pasteStep
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1 < pasteStep ? "✓ " : ""}
                        {label}
                      </span>
                      {idx < 2 && <div className="w-5 h-px bg-border" />}
                    </div>
                  ),
                )}
              </div>

              {pasteStep === 1 && (
                <div>
                  <Label>Paste course data from Word or Excel</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Paste rows directly from a Word document or Excel
                    spreadsheet. Supported formats: multi-line block
                    (code/title/units/status on separate lines), tab-separated,
                    or comma-separated. Semester headings like "First Semester
                    100 Level" are auto-detected.
                  </p>
                  <Textarea
                    data-ocid="courses.scan.paste.textarea"
                    className="font-mono text-xs min-h-[160px]"
                    placeholder={
                      "Paste course data here — multi-line block, tab-separated, or comma-separated\n\nExample (tab-separated):\nS/N\tCourse Code\tTitle\tUnit\tStatus\n1\tGST111\tCommunication in English\t2\tC\n\nOr multi-line block (one field per line):\nGST111\nCommunication in English\n2\nC"
                    }
                    value={pasteText}
                    onChange={(e) => {
                      setPasteText(e.target.value);
                      setPasteRows([]);
                      setPasteError("");
                      setPasteStep(1);
                    }}
                    onBlur={() => {
                      if (pasteText.trim() && pasteRows.length === 0) {
                        // Auto-trigger parse on blur if not yet parsed
                      }
                    }}
                  />
                  {pasteError && (
                    <p className="text-xs text-destructive mt-1">
                      {pasteError}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleParse}
                    disabled={!pasteText.trim()}
                    data-ocid="courses.scan.parse_button"
                  >
                    <ScanLine className="w-4 h-4 mr-1" /> Parse Pasted Data
                  </Button>
                </div>
              )}

              {pasteStep >= 2 && pasteRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>
                        Extracted {pasteRows.length} courses from{" "}
                        {
                          [...new Set(pasteRows.map((r) => r.level))].sort()
                            .length
                        }{" "}
                        level(s) — review &amp; edit below
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setPasteStep(1);
                        setPasteRows([]);
                      }}
                    >
                      ← Change Data
                    </Button>
                  </div>
                  <EditableCoursesTable
                    rows={pasteRows}
                    onChange={setPasteRows}
                  />
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={pasteDeptId}
                      onValueChange={(v) => {
                        setPasteDeptId(v);
                        setPasteStep(3);
                      }}
                    >
                      <SelectTrigger
                        className="mt-1"
                        data-ocid="courses.scan.paste.dept.select"
                      >
                        <SelectValue placeholder="Select department to import into" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={String(d.id)} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  data-ocid="courses.scan.paste.import_button"
                  disabled={pasteRows.length === 0 || !pasteDeptId}
                  onClick={() =>
                    handleImport(pasteRows, pasteDeptId, "Pasted Data", "paste")
                  }
                >
                  Import {pasteRows.length > 0 ? `${pasteRows.length} ` : ""}
                  Courses
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── History Tab ── */}
            <TabsContent value="history" className="pt-3">
              {history.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-3 py-16 text-muted-foreground"
                  data-ocid="courses.scan.history.empty_state"
                >
                  <History className="w-10 h-10" />
                  <p className="text-sm">No scan history yet</p>
                  <p className="text-xs">
                    Import courses using the Upload or Paste tabs to see them
                    here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((batch) => {
                    const badge = getFileTypeBadge(batch.fileType);
                    return (
                      <div
                        key={batch.id}
                        className="border rounded-xl p-3 flex items-center justify-between gap-3"
                        data-ocid="courses.scan.history.item.1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {batch.fileType === "png" ||
                          batch.fileType === "jpg" ||
                          batch.fileType === "jpeg" ? (
                            <ImageIcon className="w-8 h-8 text-muted-foreground shrink-0" />
                          ) : batch.fileType === "csv" ? (
                            <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
                          ) : (
                            <FileText className="w-8 h-8 text-blue-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {batch.departmentName}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {batch.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(batch.date).toLocaleString()} &bull;{" "}
                              {batch.rows.length} courses
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewBatch(batch)}
                            data-ocid="courses.scan.history.view_button"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteHistory(batch.id)}
                            data-ocid="courses.scan.history.delete_button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View History Batch Dialog */}
      {viewBatch && (
        <Dialog open={!!viewBatch} onOpenChange={() => setViewBatch(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Scan History — {viewBatch.departmentName}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              Imported on {new Date(viewBatch.date).toLocaleString()} &bull;{" "}
              {viewBatch.rows.length} courses
            </p>
            <div className="overflow-auto border rounded-lg max-h-64">
              <table className="text-xs w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-1.5 text-left">#</th>
                    <th className="p-1.5 text-left">Code</th>
                    <th className="p-1.5 text-left">Title</th>
                    <th className="p-1.5 text-left">Units</th>
                    <th className="p-1.5 text-left">Level</th>
                    <th className="p-1.5 text-left">Semester</th>
                    <th className="p-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewBatch.rows.map((r, i) => (
                    <tr
                      key={`view-${viewBatch.id}-row-${r.courseCode || i}`}
                      className="border-t"
                    >
                      <td className="p-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="p-1.5 font-mono">{r.courseCode}</td>
                      <td className="p-1.5">{r.title}</td>
                      <td className="p-1.5">{r.creditUnits}</td>
                      <td className="p-1.5">{r.level}</td>
                      <td className="p-1.5">{r.semester}</td>
                      <td className="p-1.5">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewBatch(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
