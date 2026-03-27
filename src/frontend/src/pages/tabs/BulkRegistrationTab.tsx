import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  CheckCircle,
  Download,
  FileUp,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

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
  const { students, departments, faculties, addStudent } = useApp();

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
    importRows(scanRows, (count) => {
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
        <TabsList className="w-full max-w-sm">
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
                            {["100", "200", "300", "400", "500", "600"].map(
                              (l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ),
                            )}
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
                            {["100", "200", "300", "400", "500", "600"].map(
                              (l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ),
                            )}
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
      </Tabs>
    </div>
  );
}
