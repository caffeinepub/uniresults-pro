import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  ClipboardPaste,
  Clock,
  Download,
  FileUp,
  History,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { parseStudentText } from "../../utils/documentExtractor";

interface ImportRow {
  id: string;
  sn: string;
  regNo: string;
  name: string;
  deptId: string;
  level: string;
  state: string;
  lga: string;
  gender: string;
  status: string;
}

const emptyRow = (): ImportRow => ({
  id: Math.random().toString(36).slice(2),
  sn: "",
  regNo: "",
  name: "",
  deptId: "",
  level: "100",
  state: "",
  lga: "",
  gender: "",
  status: "accepted",
});

export default function BulkRegistrationTab() {
  const {
    students,
    departments,
    faculties,
    addStudent,
    addJambScanBatch,
    removeJambScanBatch,
    jambScanBatches,
  } = useApp();

  // ── CSV Upload state ────────────────────────────────────────────
  const [csvRows, setCsvRows] = useState<ImportRow[]>([]);
  const [csvImported, setCsvImported] = useState(0);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // ── Scanner state ───────────────────────────────────────────────
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanRows, setScanRows] = useState<ImportRow[]>([
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);
  const [docType, setDocType] = useState("Student Admission List");
  const [scanImported, setScanImported] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────
  function generateMatric(deptId: string) {
    const dept = departments.find((d) => String(d.id) === deptId);
    const code =
      dept?.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 3)
        .toUpperCase() ?? "STU";
    const year = new Date().getFullYear();
    const seq = String(
      students.length + Math.floor(Math.random() * 1000) + 1,
    ).padStart(3, "0");
    return `${code}/${year}/${seq}`;
  }

  function importRows(rows: ImportRow[], onDone: (count: number) => void) {
    const valid = rows.filter((r) => r.name.trim() && r.deptId);
    if (valid.length === 0) {
      toast.error("No valid rows to import (Name and Department required)");
      return;
    }
    let count = 0;
    for (const row of valid) {
      const matric = generateMatric(row.deptId);
      addStudent({
        id: BigInt(Date.now() + count),
        name: row.name.trim(),
        matricNumber: matric,
        departmentId: BigInt(row.deptId),
        level: BigInt(Number(row.level) || 100),
        status: (row.status as any) || "accepted",
        userPrincipal: `student-bulk-${Date.now()}-${count}`,
        regNo: row.regNo.trim() || undefined,
        jambRegNo: row.regNo.trim() || undefined,
        gender: row.gender || undefined,
        state: row.state || undefined,
        lga: row.lga || undefined,
      } as any);
      count++;
    }
    toast.success(
      `${count} student${count !== 1 ? "s" : ""} imported successfully`,
    );
    onDone(count);
  }

  // ── CSV upload ──────────────────────────────────────────────────
  function handleDownloadTemplate() {
    const headers = "S/N,Reg No,Name,Department,Level,State,LGA,Sex,Status";
    const example =
      "1,12345678AB,Amara Okonkwo,Computer Science Education,100,Kogi,Lokoja,Female,accepted";
    const csv = [headers, example].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bulk_student_registration_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const data = lines.slice(1);
      const parsed: ImportRow[] = data.map((line, idx) => {
        const cols = line.split(",");
        const deptName = cols[3]?.trim() ?? "";
        const matchedDept = departments.find(
          (d) => d.name.toLowerCase() === deptName.toLowerCase(),
        );
        return {
          id: Math.random().toString(36).slice(2),
          sn: cols[0]?.trim() ?? String(idx + 1),
          regNo: cols[1]?.trim() ?? "",
          name: cols[2]?.trim() ?? "",
          deptId: matchedDept
            ? String(matchedDept.id)
            : departments[0]
              ? String(departments[0].id)
              : "",
          level: cols[4]?.trim() ?? "100",
          state: cols[5]?.trim() ?? "",
          lga: cols[6]?.trim() ?? "",
          gender: cols[7]?.trim() ?? "",
          status: cols[8]?.trim() ?? "accepted",
        };
      });
      setCsvRows(parsed.filter((r) => r.name));
    };
    reader.readAsText(file);
  }

  function handleCsvImport() {
    importRows(csvRows, (count) => {
      setCsvImported(count);
      setCsvRows([]);
      if (csvFileRef.current) csvFileRef.current.value = "";
    });
  }

  function updateCsvRow(i: number, field: keyof ImportRow, value: string) {
    setCsvRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  // ── Scanner ─────────────────────────────────────────────────────
  function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScanImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function updateScanRow(i: number, field: keyof ImportRow, value: string) {
    setScanRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  function addScanRow() {
    setScanRows((prev) => [...prev, emptyRow()]);
  }

  function removeScanRow(i: number) {
    setScanRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleScanImport() {
    const imageToSave = scanImage;
    const rowsToSave = scanRows;
    const docTypeToSave = docType;
    importRows(scanRows, (count) => {
      // Save scan batch to history
      addJambScanBatch({
        id: Math.random().toString(36).slice(2) + Date.now(),
        date: new Date().toISOString(),
        image: imageToSave,
        docType: docTypeToSave,
        rows: rowsToSave
          .filter((r) => r.name.trim() && r.deptId)
          .map((r) => {
            const dept = departments.find((d) => String(d.id) === r.deptId);
            return {
              sn: r.sn,
              regNo: r.regNo,
              name: r.name,
              deptName: dept?.name ?? r.deptId,
              level: r.level,
              state: r.state,
              gender: r.gender,
              status: r.status,
            };
          }),
        importedCount: count,
      });
      setScanImported(count);
      setScanRows([emptyRow(), emptyRow(), emptyRow()]);
      setScanImage(null);
      if (scanFileRef.current) scanFileRef.current.value = "";
    });
  }

  const deptOptions = departments.map((d) => {
    const fac = faculties.find(
      (f) => String(f.id) === String((d as any).facultyId),
    );
    return {
      id: String(d.id),
      label: `${d.name}${fac ? ` (${fac.name})` : ""}`,
    };
  });

  const statusOptions = [
    "accepted",
    "active",
    "deferred",
    "graduated",
    "withdrawn",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Bulk Student Registration
        </h1>
        <p className="text-sm text-muted-foreground">
          Import students via CSV template upload or by manually entering data
          from a scanned document.
        </p>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="w-full max-w-2xl">
          <TabsTrigger
            value="csv"
            data-ocid="bulk_reg.csv.tab"
            className="flex-1"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            data-ocid="bulk_reg.scanner.tab"
            className="flex-1"
          >
            <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
            Scan &amp; Import
          </TabsTrigger>
          <TabsTrigger
            value="history"
            data-ocid="bulk_reg.history.tab"
            className="flex-1"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Scan History
            {jambScanBatches.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {jambScanBatches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="paste"
            data-ocid="bulk_reg.paste.tab"
            className="flex-1"
          >
            <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
            Paste Data
          </TabsTrigger>
        </TabsList>

        {/* ── CSV Upload Tab ─────────────────────────────────────── */}
        <TabsContent value="csv" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              size="sm"
              data-ocid="bulk_reg.download_button"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Blank Template
            </Button>
            <div>
              <input
                ref={csvFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFile}
                id="csv-upload"
              />
              <Button
                variant="outline"
                size="sm"
                data-ocid="bulk_reg.upload_button"
                onClick={() => csvFileRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload CSV File
              </Button>
            </div>
          </div>

          {csvImported > 0 && csvRows.length === 0 && (
            <div
              className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3"
              data-ocid="bulk_reg.success_state"
            >
              <CheckCircle className="w-4 h-4" />
              {csvImported} student{csvImported !== 1 ? "s" : ""} imported
              successfully.
            </div>
          )}

          {csvRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {csvRows.length} rows parsed — review before importing
                </p>
                <Badge variant="outline">{csvRows.length} rows</Badge>
              </div>
              <div className="rounded-xl border border-border overflow-auto max-h-96">
                <table className="w-full text-xs min-w-[800px]">
                  <thead className="bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      {[
                        "S/N",
                        "Reg No",
                        "Name",
                        "Department",
                        "Level",
                        "State",
                        "LGA",
                        "Sex",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium text-muted-foreground px-2 py-2"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/50"
                        data-ocid={`bulk_reg.csv.item.${i + 1}`}
                      >
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-10"
                            value={row.sn}
                            onChange={(e) =>
                              updateCsvRow(i, "sn", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-28"
                            value={row.regNo}
                            onChange={(e) =>
                              updateCsvRow(i, "regNo", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-36"
                            value={row.name}
                            onChange={(e) =>
                              updateCsvRow(i, "name", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-40"
                            value={row.deptId}
                            onChange={(e) =>
                              updateCsvRow(i, "deptId", e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {deptOptions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-16"
                            value={row.level}
                            onChange={(e) =>
                              updateCsvRow(i, "level", e.target.value)
                            }
                          >
                            {["100", "200", "300", "400", "500"].map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-24"
                            value={row.state}
                            onChange={(e) =>
                              updateCsvRow(i, "state", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-24"
                            value={row.lga}
                            onChange={(e) =>
                              updateCsvRow(i, "lga", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-20"
                            value={row.gender}
                            onChange={(e) =>
                              updateCsvRow(i, "gender", e.target.value)
                            }
                          >
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-24"
                            value={row.status}
                            onChange={(e) =>
                              updateCsvRow(i, "status", e.target.value)
                            }
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                data-ocid="bulk_reg.csv.submit_button"
                onClick={handleCsvImport}
                className="bg-primary text-primary-foreground"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Import ({csvRows.length} students)
              </Button>
            </div>
          )}

          {csvRows.length === 0 && csvImported === 0 && (
            <button
              type="button"
              className="border-2 border-dashed border-border rounded-xl p-10 text-center w-full text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
              data-ocid="bulk_reg.csv.dropzone"
              onClick={() => csvFileRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Click to upload a CSV file</p>
              <p className="text-xs mt-1">
                First download the blank template, fill it in, then upload
              </p>
            </button>
          )}
        </TabsContent>

        {/* ── Scan & Import Tab ──────────────────────────────────── */}
        <TabsContent value="scanner" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Document Type
              </Label>
              <select
                className="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option>Student Admission List</option>
                <option>Result Sheet</option>
                <option>Course Registration Form</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Upload Image
              </Label>
              <input
                ref={scanFileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleScanFile}
                id="scan-upload"
              />
              <Button
                variant="outline"
                size="sm"
                data-ocid="bulk_reg.scan.upload_button"
                onClick={() => scanFileRef.current?.click()}
              >
                <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                Upload Document
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg px-4 py-2 text-xs text-muted-foreground">
            Upload a scanned document. View the image on the left and manually
            enter or correct the extracted data in the table.
          </div>

          {scanImported > 0 && (
            <div
              className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-3"
              data-ocid="bulk_reg.scan.success_state"
            >
              <CheckCircle className="w-4 h-4" />
              {scanImported} student{scanImported !== 1 ? "s" : ""} imported
              successfully.
            </div>
          )}

          <div
            className={`grid gap-4 ${scanImage ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* Left: Image preview */}
            {scanImage ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-xs font-medium border-b border-border">
                  Scanned Document — {docType}
                </div>
                <div className="p-2 overflow-auto max-h-[500px]">
                  <img
                    src={scanImage}
                    alt="Scanned document"
                    className="w-full object-contain rounded"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="border-2 border-dashed border-border rounded-xl p-10 text-center w-full text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                data-ocid="bulk_reg.scan.dropzone"
                onClick={() => scanFileRef.current?.click()}
              >
                <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click to upload scanned document</p>
                <p className="text-xs mt-1">
                  Accepts JPG, PNG, or scanned PDF images
                </p>
              </button>
            )}

            {/* Right: Editable data table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Student Data Entry</p>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="bulk_reg.scan.add_row_button"
                  onClick={addScanRow}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Row
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-auto max-h-96">
                <table className="w-full text-xs min-w-[700px]">
                  <thead className="bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      {[
                        "S/N",
                        "Reg No",
                        "Name *",
                        "Dept *",
                        "Level",
                        "State",
                        "LGA",
                        "Sex",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium text-muted-foreground px-2 py-2"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scanRows.map((row, i) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/50"
                        data-ocid={`bulk_reg.scan.item.${i + 1}`}
                      >
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-10"
                            value={row.sn}
                            onChange={(e) =>
                              updateScanRow(i, "sn", e.target.value)
                            }
                            placeholder={String(i + 1)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-24"
                            value={row.regNo}
                            onChange={(e) =>
                              updateScanRow(i, "regNo", e.target.value)
                            }
                            placeholder="Reg No"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-32"
                            value={row.name}
                            onChange={(e) =>
                              updateScanRow(i, "name", e.target.value)
                            }
                            placeholder="Full Name"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-36"
                            value={row.deptId}
                            onChange={(e) =>
                              updateScanRow(i, "deptId", e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {deptOptions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-16"
                            value={row.level}
                            onChange={(e) =>
                              updateScanRow(i, "level", e.target.value)
                            }
                          >
                            {["100", "200", "300", "400", "500"].map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-20"
                            value={row.state}
                            onChange={(e) =>
                              updateScanRow(i, "state", e.target.value)
                            }
                            placeholder="State"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-20"
                            value={row.lga}
                            onChange={(e) =>
                              updateScanRow(i, "lga", e.target.value)
                            }
                            placeholder="LGA"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-18"
                            value={row.gender}
                            onChange={(e) =>
                              updateScanRow(i, "gender", e.target.value)
                            }
                          >
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-22"
                            value={row.status}
                            onChange={(e) =>
                              updateScanRow(i, "status", e.target.value)
                            }
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <button
                            type="button"
                            data-ocid={`bulk_reg.scan.delete_button.${i + 1}`}
                            onClick={() => removeScanRow(i)}
                            className="text-destructive hover:text-destructive/80 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                data-ocid="bulk_reg.scan.submit_button"
                onClick={handleScanImport}
                className="bg-primary text-primary-foreground w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Import (
                {scanRows.filter((r) => r.name.trim() && r.deptId).length} valid
                rows)
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Scan History Tab ───────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Scanned Documents</span>
              <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                {jambScanBatches.length} document
                {jambScanBatches.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {jambScanBatches.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="bulk_reg.history.empty_state"
            >
              <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No scanned documents yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use the Scanner tab to import JAMB documents and they will
                appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...jambScanBatches]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((batch, idx) => (
                  <div
                    key={batch.id}
                    className="border border-border rounded-xl overflow-hidden bg-card"
                    data-ocid={`bulk_reg.history.item.${idx + 1}`}
                  >
                    {/* Card header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b border-border">
                      <div className="flex flex-wrap items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(batch.date).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">
                          {batch.docType}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {batch.importedCount} student
                          {batch.importedCount !== 1 ? "s" : ""} imported
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                        data-ocid={`bulk_reg.history.delete_button.${idx + 1}`}
                        onClick={() => setDeleteBatchId(batch.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Thumbnail */}
                      {batch.image && (
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            className="relative group cursor-pointer"
                            onClick={() => setPreviewImage(batch.image)}
                          >
                            <img
                              src={batch.image}
                              alt="Scanned document"
                              className="w-28 h-36 object-cover rounded-lg border border-border shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </button>
                          <button
                            type="button"
                            className="mt-1.5 text-xs text-primary hover:underline flex items-center gap-1"
                            data-ocid={`bulk_reg.history.view_image_button.${idx + 1}`}
                            onClick={() => setPreviewImage(batch.image)}
                          >
                            <ZoomIn className="w-3 h-3" />
                            View Full Image
                          </button>
                        </div>
                      )}

                      {/* Rows table */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {batch.rows.length} student
                          {batch.rows.length !== 1 ? "s" : ""} in this batch
                        </p>
                        <ScrollArea className="h-48 rounded-lg border border-border">
                          <table className="w-full text-xs min-w-[600px]">
                            <thead className="bg-muted/50 border-b border-border sticky top-0">
                              <tr>
                                {[
                                  "S/N",
                                  "JAMB Reg No",
                                  "Name",
                                  "Department",
                                  "Level",
                                  "State",
                                  "Gender",
                                  "Status",
                                ].map((h) => (
                                  <th
                                    key={h}
                                    className="text-left font-medium text-muted-foreground px-3 py-2 whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {batch.rows.map((row, ri) => (
                                <tr
                                  key={`${row.regNo || row.name}-${ri}`}
                                  className="border-b border-border/40 hover:bg-muted/20"
                                >
                                  <td className="px-3 py-1.5 text-muted-foreground">
                                    {row.sn || String(ri + 1)}
                                  </td>
                                  <td className="px-3 py-1.5 font-mono">
                                    {row.regNo || "—"}
                                  </td>
                                  <td className="px-3 py-1.5 font-medium">
                                    {row.name}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    {row.deptName}
                                  </td>
                                  <td className="px-3 py-1.5">{row.level}</td>
                                  <td className="px-3 py-1.5">
                                    {row.state || "—"}
                                  </td>
                                  <td className="px-3 py-1.5 capitalize">
                                    {row.gender || "—"}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <span className="capitalize bg-success/10 text-success text-[10px] rounded-full px-2 py-0.5 font-medium">
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ── Paste Data Tab ──────────────────────────────────── */}
        <TabsContent value="paste" className="space-y-4 pt-4">
          <PasteDataTab importRows={importRows} departments={departments} />
        </TabsContent>
      </Tabs>

      {/* ── Image Preview Modal ─────────────────────────────────── */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl" data-ocid="bulk_reg.history.modal">
          <DialogHeader>
            <DialogTitle>Scanned Document</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="overflow-auto max-h-[70vh]">
              <img
                src={previewImage}
                alt="Scanned document preview"
                className="w-full object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              data-ocid="bulk_reg.history.close_button"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Batch Confirmation Dialog ───────────────────── */}
      <Dialog
        open={!!deleteBatchId}
        onOpenChange={() => setDeleteBatchId(null)}
      >
        <DialogContent data-ocid="bulk_reg.history.dialog">
          <DialogHeader>
            <DialogTitle>Delete Scan Record?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the scan record and all extracted student data from
            history. The imported students remain in the system.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline"
              data-ocid="bulk_reg.history.cancel_button"
              onClick={() => setDeleteBatchId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="text-sm bg-destructive text-destructive-foreground px-4 py-1.5 rounded-md hover:bg-destructive/90"
              data-ocid="bulk_reg.history.confirm_button"
              onClick={() => {
                if (deleteBatchId) removeJambScanBatch(deleteBatchId);
                setDeleteBatchId(null);
              }}
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Paste Data Tab Component ─────────────────────────────────────────────────
interface PasteDataTabProps {
  importRows: (rows: ImportRow[], onDone: (count: number) => void) => void;
  departments: Array<{ id: bigint | number; name: string }>;
}

interface PasteRow {
  id: string;
  sn: string;
  regNo: string;
  name: string;
  deptId: string;
  level: string;
  state: string;
  lga: string;
  gender: string;
  status: string;
  hasError: boolean;
}

// Step progress indicator
function StepIndicator({ step }: { step: number }) {
  const steps = ["1. Paste Data", "2. Review & Edit", "3. Import"];
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              idx + 1 === step
                ? "bg-primary text-primary-foreground"
                : idx + 1 < step
                  ? "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {idx + 1 < step ? <CheckCircle className="w-3 h-3" /> : null}
            {label}
          </div>
          {idx < steps.length - 1 && (
            <div className="w-6 h-px bg-border flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function PasteDataTab({ importRows, departments }: PasteDataTabProps) {
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<PasteRow[]>([]);
  const [imported, setImported] = useState(0);
  const [step, setStep] = useState(1);

  function parseText() {
    if (!rawText.trim()) {
      toast.error("Paste some data first.");
      return;
    }
    const extracted = parseStudentText(rawText, departments);
    if (extracted.length === 0) {
      toast.error(
        "Could not parse any rows. Try tab-separated or comma-separated format: Reg No, Name, Department, State, LGA, Gender",
      );
      return;
    }
    const rows: PasteRow[] = extracted.map((r) => ({
      id: Math.random().toString(36).slice(2),
      sn: r.sn,
      regNo: r.regNo,
      name: r.name,
      deptId: r.deptId,
      level: r.level || "100",
      state: r.state,
      lga: r.lga,
      gender: r.gender,
      status: r.status || "accepted",
      hasError: !r.name.trim(),
    }));
    setParsedRows(rows);
    setStep(2);
    const errorCount = rows.filter((r) => r.hasError).length;
    const readyCount = rows.length - errorCount;
    toast.success(
      `Parsed ${rows.length} rows — ${readyCount} ready, ${errorCount} need correction`,
    );
  }

  function updateRow(id: string, field: keyof PasteRow, value: string) {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        updated.hasError = !updated.name.trim();
        return updated;
      }),
    );
  }

  function handleImport() {
    const validRows = parsedRows.filter((r) => !r.hasError);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    const importable: ImportRow[] = validRows.map((r) => ({
      id: r.id,
      sn: r.sn,
      regNo: r.regNo,
      name: r.name,
      deptId: r.deptId,
      level: r.level || "100",
      state: r.state,
      lga: r.lga,
      gender: r.gender,
      status: r.status || "accepted",
    }));
    importRows(importable, (count) => {
      setImported(count);
      setParsedRows([]);
      setRawText("");
      setStep(3);
    });
  }

  const statusOptions = [
    "accepted",
    "active",
    "deferred",
    "graduated",
    "withdrawn",
  ];
  const validCount = parsedRows.filter((r) => !r.hasError).length;
  const errorCount = parsedRows.filter((r) => r.hasError).length;

  return (
    <div className="space-y-4">
      <StepIndicator step={step} />

      {step === 3 && imported > 0 ? (
        <div className="flex flex-col items-center gap-4 py-10">
          <CheckCircle className="w-12 h-12 text-success" />
          <p className="text-lg font-semibold">
            {imported} students imported successfully!
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setStep(1);
              setImported(0);
            }}
          >
            Import More
          </Button>
        </div>
      ) : step === 1 ? (
        <>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Supported formats:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Copy a table from Word or Excel (tab-separated columns)</li>
              <li>Comma-separated CSV data</li>
              <li>
                JAMB printout format: Reg No, Name, Course, State, LGA, Sex
              </li>
              <li>Auto-detects column headers if present</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paste_area">Paste Student Data Here</Label>
            <textarea
              id="paste_area"
              className="w-full min-h-[180px] font-mono text-xs border border-border rounded-lg p-3 bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={
                "S/N\tJAMB Reg No\tFull Name\tDepartment\tState\tLGA\tSex\n1\t34521098CA\tAmaka Okonkwo\tBiology Education\tAnambra\tAWKA\tFemale\n2\t34812345CB\tEmeka Obi\tComputer Science Education\tEnugu\tEnugu North\tMale"
              }
              value={rawText}
              data-ocid="bulk_reg.paste.textarea"
              onChange={(e) => {
                setRawText(e.target.value);
              }}
            />
          </div>

          <Button
            onClick={parseText}
            disabled={!rawText.trim()}
            data-ocid="bulk_reg.paste.parse_button"
          >
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Parse Data
          </Button>
        </>
      ) : (
        <>
          {/* Step 2: Review */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-success font-medium">
                ✓ {validCount} rows ready to import
              </span>
              {errorCount > 0 && (
                <span className="text-destructive font-medium">
                  ⚠ {errorCount} need correction (missing name)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setParsedRows([]);
                }}
              >
                ← Back
              </Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-white"
                onClick={handleImport}
                disabled={validCount === 0}
                data-ocid="bulk_reg.paste.import_button"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Import All Valid Rows ({validCount})
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-10">
                    #
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Reg No
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Name *
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-16">
                    Level
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    State
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    LGA
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Gender
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={
                      row.hasError
                        ? "bg-red-50 dark:bg-red-950/20"
                        : "hover:bg-muted/30"
                    }
                    data-ocid={`bulk_reg.paste.item.${idx + 1}`}
                  >
                    <td className="px-2 py-1 text-muted-foreground text-center">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border-b border-border bg-transparent focus:outline-none focus:border-primary font-mono"
                        value={row.regNo}
                        onChange={(e) =>
                          updateRow(row.id, "regNo", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className={`w-full border-b bg-transparent focus:outline-none focus:border-primary ${row.hasError ? "border-destructive text-destructive" : "border-border"}`}
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row.id, "name", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        className={`w-full border-b bg-transparent focus:outline-none focus:border-primary text-xs ${!row.deptId ? "border-warning text-warning-foreground" : "border-border"}`}
                        value={row.deptId}
                        onChange={(e) =>
                          updateRow(row.id, "deptId", e.target.value)
                        }
                      >
                        <option value="">-- Select Dept --</option>
                        {departments.map((d) => (
                          <option key={String(d.id)} value={String(d.id)}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        className="w-full border-b border-border bg-transparent focus:outline-none focus:border-primary text-xs"
                        value={row.level}
                        onChange={(e) =>
                          updateRow(row.id, "level", e.target.value)
                        }
                      >
                        {["100", "200", "300", "400", "500", "600"].map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border-b border-border bg-transparent focus:outline-none focus:border-primary"
                        value={row.state}
                        onChange={(e) =>
                          updateRow(row.id, "state", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border-b border-border bg-transparent focus:outline-none focus:border-primary"
                        value={row.lga}
                        onChange={(e) =>
                          updateRow(row.id, "lga", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        className="w-full border-b border-border bg-transparent focus:outline-none text-xs"
                        value={row.gender}
                        onChange={(e) =>
                          updateRow(row.id, "gender", e.target.value)
                        }
                      >
                        <option value="">—</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      {row.hasError ? (
                        <span className="text-destructive text-xs font-medium">
                          ⚠ Name required
                        </span>
                      ) : (
                        <select
                          className="w-full border-b border-border bg-transparent focus:outline-none text-xs"
                          value={row.status}
                          onChange={(e) =>
                            updateRow(row.id, "status", e.target.value)
                          }
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
