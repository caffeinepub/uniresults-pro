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
import { useRef, useState } from "react";
import { toast } from "sonner";

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

function parseCourseLines(text: string): CourseScanRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLower = lines[0]?.toLowerCase() || "";
  const startIdx =
    firstLower.includes("course") ||
    firstLower.includes("code") ||
    firstLower.includes("s/n")
      ? 1
      : 0;
  return lines
    .slice(startIdx)
    .map((line, idx) => {
      const sep = line.includes("\t") ? "\t" : ",";
      const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));
      // Support formats: SN, Code, Title, Units, Level, Semester, Status
      //                  Code, Title, Units, Status
      //                  Code, Title, Units
      let courseCode = "";
      let title = "";
      let creditUnits = "2";
      let level = "";
      let semester = "First";
      let status = "C";

      if (parts.length >= 5) {
        // Likely: SN, Code, Title, Units, Status (or similar with 5+ cols)
        // Detect if first col is numeric (S/N)
        const firstIsNum = /^\d+$/.test(parts[0]);
        if (firstIsNum) {
          courseCode = parts[1] || "";
          title = parts[2] || "";
          creditUnits = parts[3] || "2";
          status = parts[4] || "C";
        } else {
          courseCode = parts[0] || "";
          title = parts[1] || "";
          creditUnits = parts[2] || "2";
          status = parts[3] || "C";
          level = parts[4] || "";
          semester = parts[5] || "First";
        }
      } else if (parts.length >= 3) {
        courseCode = parts[0];
        title = parts[1];
        creditUnits = parts[2];
        status = parts[3] || "C";
      } else if (parts.length >= 2) {
        courseCode = parts[0];
        title = parts[1];
      } else {
        return null;
      }

      // Try extract level from course code (e.g. BIO101 → 100, EDU301 → 300)
      if (!level) {
        const m = courseCode
          .replace(/[\.\s]/g, "")
          .match(/([A-Za-z]+)(\d)(\d{2})/);
        if (m) level = `${m[2]}00`;
      }

      // Normalize status
      const statusNorm = status.toUpperCase();
      const normalizedStatus =
        statusNorm === "C" ||
        statusNorm === "CORE" ||
        statusNorm === "COMPULSORY"
          ? "Core"
          : "Elective";

      // Normalize semester from level context if not provided
      const normalizedSemester =
        semester === "Second" || semester === "2nd" || semester === "II"
          ? "Second"
          : "First";

      return {
        sn: idx + 1,
        courseCode: courseCode.replace(/[\.\s]/g, "").toUpperCase(),
        title: title,
        creditUnits: creditUnits || "2",
        level: level || "100",
        semester: normalizedSemester,
        status: normalizedStatus,
      } as CourseScanRow;
    })
    .filter(
      (r): r is CourseScanRow => r !== null && !!r.courseCode && !!r.title,
    );
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
  // Upload tab state
  const [uploadRows, setUploadRows] = useState<CourseScanRow[]>([]);
  const [uploadDeptId, setUploadDeptId] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileType, setUploadFileType] = useState("");
  const [uploadPreviewSrc, setUploadPreviewSrc] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste tab state
  const [pasteText, setPasteText] = useState("");
  const [pasteRows, setPasteRows] = useState<CourseScanRow[]>([]);
  const [pasteDeptId, setPasteDeptId] = useState("");
  const [pasteError, setPasteError] = useState("");

  // History tab state
  const [history, setHistory] = useState<CourseScanBatch[]>(loadHistory);
  const [viewBatch, setViewBatch] = useState<CourseScanBatch | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setUploadPreviewSrc(null);
    setUploadRows([]);
    setScanning(true);

    const ext = file.name.toLowerCase().split(".").pop() || "";
    setUploadFileType(ext);

    const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
    const isCsv = ext === "csv";

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreviewSrc(ev.target?.result as string);
        // Mock extraction after scanning
        setTimeout(() => {
          setScanning(false);
          setUploadRows([
            {
              sn: 1,
              courseCode: "GST111",
              title: "Communication in English",
              creditUnits: "2",
              level: "100",
              semester: "First",
              status: "Core",
            },
            {
              sn: 2,
              courseCode: "BIO101",
              title: "General Biology I",
              creditUnits: "2",
              level: "100",
              semester: "First",
              status: "Core",
            },
            {
              sn: 3,
              courseCode: "CHM101",
              title: "General Chemistry I",
              creditUnits: "2",
              level: "100",
              semester: "First",
              status: "Core",
            },
          ]);
          toast.info(
            "Image scanned — please review and correct the extracted data before importing",
          );
        }, 2000);
      };
      reader.readAsDataURL(file);
    } else if (isCsv) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCourseLines(text);
        setScanning(false);
        setUploadRows(rows);
        if (rows.length === 0) {
          toast.error("No valid courses found in CSV. Check column format.");
        } else {
          toast.success(`${rows.length} courses extracted from CSV`);
        }
      };
      reader.readAsText(file);
    } else {
      // PDF/DOC/DOCX/XLSX — mock extraction
      setTimeout(() => {
        setScanning(false);
        setUploadRows([
          {
            sn: 1,
            courseCode: "EDU101",
            title: "Introduction to Teaching",
            creditUnits: "2",
            level: "100",
            semester: "First",
            status: "Core",
          },
          {
            sn: 2,
            courseCode: "GST111",
            title: "Communication in English",
            creditUnits: "2",
            level: "100",
            semester: "First",
            status: "Core",
          },
          {
            sn: 3,
            courseCode: "BIO201",
            title: "Genetics I",
            creditUnits: "2",
            level: "200",
            semester: "First",
            status: "Core",
          },
        ]);
        toast.info(
          "Document processed — please review and correct the extracted data before importing",
        );
      }, 2500);
    }
  }

  function handleParse() {
    setPasteError("");
    const rows = parseCourseLines(pasteText);
    if (rows.length === 0) {
      setPasteError(
        "Could not parse any courses. Ensure each row has: Course Code, Title, Credit Units (tab or comma separated).",
      );
    } else {
      setPasteRows(rows);
      toast.success(`${rows.length} courses parsed`);
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

    // Save to history
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

  const ftBadge = getFileTypeBadge(uploadFileType);

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
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Upload + Preview */}
                <div className="space-y-3">
                  <div>
                    <Label>Upload Course Document</Label>
                    <label
                      htmlFor="course-scan-file-input"
                      className="mt-1 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                      data-ocid="courses.scan.dropzone"
                    >
                      {uploadPreviewSrc ? (
                        <img
                          src={uploadPreviewSrc}
                          alt="preview"
                          className="max-h-40 rounded"
                        />
                      ) : uploadFileName ? (
                        <div className="flex flex-col items-center gap-1">
                          <FileText className="w-10 h-10 text-muted-foreground" />
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${ftBadge.color}`}
                          >
                            {ftBadge.label}
                          </span>
                          <p className="text-xs text-muted-foreground text-center truncate max-w-[180px]">
                            {uploadFileName}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground text-center">
                            PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG
                          </p>
                        </>
                      )}
                    </label>
                    <input
                      ref={fileInputRef}
                      id="course-scan-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      data-ocid="courses.scan.file_input"
                    />
                  </div>

                  {scanning && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Scanning document...
                    </div>
                  )}

                  {!scanning && uploadRows.length > 0 && (
                    <div className="text-xs p-2 bg-green-50 border border-green-200 rounded text-green-700">
                      ✓ {uploadRows.length} courses extracted — review &amp;
                      edit before importing
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
              <div>
                <Label>Paste course data from Word or Excel</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Paste rows directly from a Word document or Excel spreadsheet.
                  Accepted formats: tab or comma separated with columns: S/N,
                  Course Code, Title, Credit Units, Status.
                </p>
                <Textarea
                  data-ocid="courses.scan.paste.textarea"
                  className="font-mono text-xs min-h-[140px]"
                  placeholder={
                    "S/N\tCourse Code\tTitle\tUnit\tStatus\n1\tGST111\tCommunication in English\t2\tC\n2\tBIO101\tGeneral Biology I\t2\tC"
                  }
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    setPasteRows([]);
                    setPasteError("");
                  }}
                />
                {pasteError && (
                  <p className="text-xs text-destructive mt-1">{pasteError}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleParse}
                  disabled={!pasteText.trim()}
                  data-ocid="courses.scan.parse_button"
                >
                  <ScanLine className="w-4 h-4 mr-1" /> Parse
                </Button>
              </div>

              {pasteRows.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs p-2 bg-green-50 border border-green-200 rounded text-green-700">
                    ✓ {pasteRows.length} courses parsed — review &amp; edit
                    below before importing
                  </div>
                  <EditableCoursesTable
                    rows={pasteRows}
                    onChange={setPasteRows}
                  />
                  <div>
                    <Label>Department</Label>
                    <Select value={pasteDeptId} onValueChange={setPasteDeptId}>
                      <SelectTrigger
                        className="mt-1"
                        data-ocid="courses.scan.paste.dept.select"
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
