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
  AlertCircle,
  CheckCircle,
  ClipboardPaste,
  Download,
  FileText,
  ImagePlus,
  Plus,
  ScanLine,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { parseStudentText } from "../../utils/documentExtractor";

interface JambRow {
  id: string;
  sn: string;
  jambRegNo: string;
  name: string;
  courseAdmitted: string;
  deptId: string;
  state: string;
  lga: string;
  gender: string;
  jambScore: string;
  aggregate: string;
  status: string;
}

function emptyRow(): JambRow {
  return {
    id: Math.random().toString(36).slice(2),
    sn: "",
    jambRegNo: "",
    name: "",
    courseAdmitted: "",
    deptId: "",
    state: "",
    lga: "",
    gender: "",
    jambScore: "",
    aggregate: "",
    status: "Accepted",
  };
}

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const STATUS_OPTIONS = [
  "Accepted",
  "Active",
  "Pending",
  "Deferred",
  "Rejected",
];

export default function JambAdmissionScannerTab() {
  const { students, departments, faculties, addStudent } = useApp();

  // ── Scanner state ────────────────────────────────────────────────
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanImageName, setScanImageName] = useState("");
  const [scanRows, setScanRows] = useState<JambRow[]>([
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);
  const [scanImported, setScanImported] = useState(0);
  const [academicSession, setAcademicSession] = useState("2025/2026");
  const scanFileRef = useRef<HTMLInputElement>(null);

  // ── Paste modal state ────────────────────────────────────────────
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteModalText, setPasteModalText] = useState("");

  // ── CSV Paste state ──────────────────────────────────────────────
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<JambRow[]>([]);
  const [csvImported, setCsvImported] = useState(0);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const deptOptions = departments.map((d) => ({
    id: String(d.id),
    label: (() => {
      const fac = faculties.find(
        (f) => String(f.id) === String((d as { facultyId?: bigint }).facultyId),
      );
      return fac ? `${d.name} (${fac.name})` : d.name;
    })(),
  }));

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

  // ── Paste candidates from text into scan rows ─────────────────────
  function handlePasteModalSubmit() {
    if (!pasteModalText.trim()) {
      toast.error("Paste some candidate data first.");
      return;
    }
    const extracted = parseStudentText(pasteModalText, departments);
    if (extracted.length === 0) {
      toast.error(
        "Could not parse any rows. Try: Reg No, Name, Course, State, LGA, Gender",
      );
      return;
    }
    const newRows: JambRow[] = extracted.map((r) => {
      const matchedDept = departments.find((d) => String(d.id) === r.deptId);
      return {
        id: Math.random().toString(36).slice(2),
        sn: r.sn,
        jambRegNo: r.regNo,
        name: r.name,
        courseAdmitted: matchedDept?.name ?? r.deptName ?? "",
        deptId: r.deptId,
        state: r.state,
        lga: r.lga,
        gender: r.gender,
        jambScore: r.jambScore,
        aggregate: r.aggregate,
        status: r.status || "Accepted",
      };
    });
    setScanRows(newRows);
    setPasteModalOpen(false);
    setPasteModalText("");
    toast.success(
      `${newRows.length} candidates loaded from paste. Review before importing.`,
    );
  }

  function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScanImage(ev.target?.result as string);
      toast.info('Document uploaded — click "Scan & Extract" to process');
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function updateScanRow(idx: number, field: keyof JambRow, value: string) {
    setScanRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  }

  function removeScanRow(idx: number) {
    setScanRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function addScanRow() {
    setScanRows((prev) => [...prev, emptyRow()]);
  }

  function importScanRows() {
    const valid = scanRows.filter((r) => r.name.trim() && r.deptId);
    if (valid.length === 0) {
      toast.error("No valid rows to import (Name and Department required)");
      return;
    }
    let count = 0;
    for (const row of valid) {
      const matric = generateMatric(row.deptId);
      const dept = departments.find((d) => String(d.id) === row.deptId);
      addStudent({
        id: BigInt(Date.now() + count),
        name: row.name.trim(),
        matricNumber: matric,
        jambRegNo: row.jambRegNo.trim() || undefined,
        regNo: row.jambRegNo.trim() || undefined,
        departmentId: BigInt(row.deptId),
        level: 100,
        status: row.status,
        gender: row.gender || undefined,
        state: row.state.trim() || undefined,
        lga: row.lga.trim() || undefined,
        admissionSession: academicSession,
        admissionDate: new Date().toISOString().slice(0, 10),
        programme: "Undergraduate Full Time",
        cgpa: 0,
        totalCreditUnits: 0,
        department: dept?.name ?? "",
      } as unknown as Parameters<typeof addStudent>[0]);
      count++;
    }
    setScanImported(count);
    setScanRows([emptyRow(), emptyRow(), emptyRow()]);
    setScanImage(null);
    toast.success(
      `${count} JAMB candidate${count !== 1 ? "s" : ""} imported successfully`,
    );
  }

  // ── CSV Parse ────────────────────────────────────────────────────
  function parseCSV(text: string): JambRow[] {
    const extracted = parseStudentText(text, departments);
    return extracted.map((r) => {
      const matchedDept = departments.find((d) => String(d.id) === r.deptId);
      return {
        id: Math.random().toString(36).slice(2),
        sn: r.sn,
        jambRegNo: r.regNo,
        name: r.name,
        courseAdmitted: matchedDept?.name ?? r.deptName ?? "",
        deptId: r.deptId,
        state: r.state,
        lga: r.lga,
        gender: r.gender,
        jambScore: r.jambScore,
        aggregate: r.aggregate,
        status: r.status || "Accepted",
      };
    });
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      setCsvRows(parsed);
      toast.success(`Parsed ${parsed.length} rows from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleCsvPaste() {
    const parsed = parseCSV(csvText);
    setCsvRows(parsed);
    if (parsed.length > 0)
      toast.success(`Parsed ${parsed.length} rows from pasted data`);
  }

  function importCsvRows() {
    const valid = csvRows.filter((r) => r.name.trim() && r.deptId);
    if (valid.length === 0) {
      toast.error("No valid rows to import (Name and Department required)");
      return;
    }
    let count = 0;
    for (const row of valid) {
      const matric = generateMatric(row.deptId);
      const dept = departments.find((d) => String(d.id) === row.deptId);
      addStudent({
        id: BigInt(Date.now() + count),
        name: row.name.trim(),
        matricNumber: matric,
        jambRegNo: row.jambRegNo.trim() || undefined,
        regNo: row.jambRegNo.trim() || undefined,
        departmentId: BigInt(row.deptId),
        level: 100,
        status: row.status,
        gender: row.gender || undefined,
        state: row.state.trim() || undefined,
        lga: row.lga.trim() || undefined,
        admissionSession: academicSession,
        admissionDate: new Date().toISOString().slice(0, 10),
        programme: "Undergraduate Full Time",
        cgpa: 0,
        totalCreditUnits: 0,
        department: dept?.name ?? "",
      } as unknown as Parameters<typeof addStudent>[0]);
      count++;
    }
    setCsvImported(count);
    setCsvRows([]);
    setCsvText("");
    toast.success(
      `${count} JAMB candidate${count !== 1 ? "s" : ""} imported successfully`,
    );
  }

  function downloadTemplate() {
    const header =
      "S/N,JAMB Reg No,Full Name,Course Admitted,State,LGA,Gender,JAMB Score,Aggregate";
    const sample = [
      "1,34521098CA,ADAMU IBRAHIM MUSA,Computer Science Education,Niger,Shiroro,Male,287,49.6",
      "2,34812345CB,FATIMA BELLO USMAN,Biology Education,Kebbi,Birnin Kebbi,Female,271,47.2",
    ];
    const blob = new Blob([[header, ...sample].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JAMB_Admission_Template_${academicSession}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            JAMB Admission Import
          </h2>
          <p className="text-sm text-muted-foreground">
            Scan JAMB admission documents or upload CSV to register admitted
            candidates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Session</Label>
          <Input
            className="w-28 h-8 text-sm"
            value={academicSession}
            onChange={(e) => setAcademicSession(e.target.value)}
            placeholder="2025/2026"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {
              students.filter((s) => s.admissionSession === academicSession)
                .length
            }
          </p>
          <p className="text-xs text-muted-foreground">
            Admitted ({academicSession})
          </p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">
            {
              students.filter(
                (s) => s.status === "Accepted" || s.status === "accepted",
              ).length
            }
          </p>
          <p className="text-xs text-muted-foreground">Total Accepted</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{departments.length}</p>
          <p className="text-xs text-muted-foreground">Departments</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {scanImported + csvImported}
          </p>
          <p className="text-xs text-muted-foreground">Imported This Session</p>
        </div>
      </div>

      <Tabs defaultValue="scanner">
        <TabsList className="mb-4">
          <TabsTrigger value="scanner" className="flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5" />
            AI Document Scanner
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            CSV / Paste Import
          </TabsTrigger>
          <TabsTrigger value="admitted" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Admitted Candidates
          </TabsTrigger>
        </TabsList>

        {/* ── AI Scanner Tab ──────────────────────────────────────── */}
        <TabsContent value="scanner" className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">
                How to import JAMB candidates:
              </span>
              <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                <li>
                  <strong>Option 1 — Upload image:</strong> Upload a photo/scan
                  of the JAMB list, then manually enter the candidate details in
                  the table below.
                </li>
                <li>
                  <strong>Option 2 — Paste text:</strong> Click "Paste
                  Candidates", paste candidate data copied from Word/Excel/CSV,
                  and click Parse to auto-populate the table.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Upload JAMB Document
              </Label>
              <input
                ref={scanFileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleScanFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => scanFileRef.current?.click()}
                data-ocid="jamb.scan.upload_button"
              >
                <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                Upload Document
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasteModalOpen(true)}
              data-ocid="jamb.scan.paste_button"
            >
              <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
              Paste Candidates
            </Button>
            <Button variant="outline" size="sm" onClick={addScanRow}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Row
            </Button>
          </div>

          {scanImported > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              {scanImported} candidate{scanImported !== 1 ? "s" : ""} imported
              successfully.
            </div>
          )}

          <div
            className={`grid gap-4 ${scanImage ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* Left: Scanned image */}
            {scanImage ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-xs font-medium border-b border-border flex items-center justify-between">
                  <span>📄 {scanImageName || "JAMB Document"}</span>
                  <Badge variant="secondary" className="text-xs">
                    Scanned
                  </Badge>
                </div>
                <div className="p-2 overflow-auto max-h-[500px]">
                  <img
                    src={scanImage}
                    alt="JAMB document"
                    className="w-full object-contain rounded"
                  />
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  💡 Review the document above. Enter candidate details in the
                  table, or click <strong>Paste Candidates</strong> to
                  auto-populate from copied text.
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="border-2 border-dashed border-border rounded-xl p-10 text-center w-full text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => scanFileRef.current?.click()}
              >
                <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  Click to upload JAMB admission document
                </p>
                <p className="text-xs mt-1">
                  JAMB admission lists, offer letters, candidate sheets
                </p>
                <p className="text-xs mt-1 text-muted-foreground/60">
                  JPG, PNG, or scanned image
                </p>
              </button>
            )}

            {/* Right: Editable extraction table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Candidate Data ({scanRows.length} rows)
                </p>
                {scanRows.some((r) => r.name) && (
                  <Button
                    size="sm"
                    onClick={importScanRows}
                    data-ocid="jamb.scan.import_button"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Import All
                  </Button>
                )}
              </div>
              <div className="rounded-xl border border-border overflow-auto max-h-[480px]">
                <table className="w-full text-xs min-w-[900px]">
                  <thead className="bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      {[
                        "S/N",
                        "JAMB Reg No",
                        "Full Name *",
                        "Course Admitted",
                        "Dept *",
                        "State",
                        "LGA",
                        "Sex",
                        "Score",
                        "Agg.",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium text-muted-foreground px-2 py-2 whitespace-nowrap"
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
                        className="border-b border-border/50 hover:bg-muted/10"
                      >
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-8"
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
                            value={row.jambRegNo}
                            onChange={(e) =>
                              updateScanRow(i, "jambRegNo", e.target.value)
                            }
                            placeholder="34521098CA"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-36"
                            value={row.name}
                            onChange={(e) =>
                              updateScanRow(i, "name", e.target.value)
                            }
                            placeholder="Full Name"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-32"
                            value={row.courseAdmitted}
                            onChange={(e) =>
                              updateScanRow(i, "courseAdmitted", e.target.value)
                            }
                            placeholder="Course"
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
                            <option value="">Select dept...</option>
                            {deptOptions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-24"
                            value={row.state}
                            onChange={(e) =>
                              updateScanRow(i, "state", e.target.value)
                            }
                          >
                            <option value="">State</option>
                            {NIGERIAN_STATES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
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
                            className="h-6 text-xs border border-border rounded px-1 bg-background"
                            value={row.gender}
                            onChange={(e) =>
                              updateScanRow(i, "gender", e.target.value)
                            }
                          >
                            <option value="">—</option>
                            <option value="Male">M</option>
                            <option value="Female">F</option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-14"
                            value={row.jambScore}
                            onChange={(e) =>
                              updateScanRow(i, "jambScore", e.target.value)
                            }
                            placeholder="287"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-6 text-xs w-14"
                            value={row.aggregate}
                            onChange={(e) =>
                              updateScanRow(i, "aggregate", e.target.value)
                            }
                            placeholder="49.6"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="h-6 text-xs border border-border rounded px-1 bg-background w-20"
                            value={row.status}
                            onChange={(e) =>
                              updateScanRow(i, "status", e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <button
                            type="button"
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
              {scanRows.some((r) => r.name) && (
                <Button
                  className="w-full"
                  onClick={importScanRows}
                  data-ocid="jamb.scan.import_all_button"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Import (
                  {scanRows.filter((r) => r.name.trim() && r.deptId).length}{" "}
                  candidates)
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── CSV / Paste Tab ────────────────────────────────────── */}
        <TabsContent value="csv" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Template
            </Button>
            <div>
              <input
                ref={csvFileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleCsvFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvFileRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload CSV
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Paste CSV data here (or upload file above)
            </Label>
            <textarea
              className="w-full h-32 text-xs border border-border rounded-lg p-3 font-mono bg-background resize-none"
              placeholder="S/N,JAMB Reg No,Full Name,Course Admitted,State,LGA,Gender,JAMB Score,Aggregate&#10;1,34521098CA,ADAMU IBRAHIM MUSA,Computer Science Education,Niger,Shiroro,Male,287,49.6"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <Button size="sm" className="mt-2" onClick={handleCsvPaste}>
              Parse Data
            </Button>
          </div>

          {csvImported > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4" />
              {csvImported} candidate{csvImported !== 1 ? "s" : ""} imported
              successfully.
            </div>
          )}

          {csvRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Preview ({csvRows.length} rows)
                </p>
                <Button
                  size="sm"
                  onClick={importCsvRows}
                  data-ocid="jamb.csv.import_button"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Import All
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-auto max-h-80">
                <table className="w-full text-xs min-w-[800px]">
                  <thead className="bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      {[
                        "S/N",
                        "JAMB Reg No",
                        "Name",
                        "Course",
                        "Dept Match",
                        "State",
                        "LGA",
                        "Sex",
                        "Score",
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
                        className={`border-b border-border/50 ${!row.deptId ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}`}
                      >
                        <td className="px-2 py-1.5">{row.sn || i + 1}</td>
                        <td className="px-2 py-1.5 font-mono">
                          {row.jambRegNo}
                        </td>
                        <td className="px-2 py-1.5 font-medium">{row.name}</td>
                        <td className="px-2 py-1.5">{row.courseAdmitted}</td>
                        <td className="px-2 py-1.5">
                          {row.deptId ? (
                            <Badge variant="secondary" className="text-xs">
                              {departments.find(
                                (d) => String(d.id) === row.deptId,
                              )?.name ?? "Matched"}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              No match
                            </Badge>
                          )}
                        </td>
                        <td className="px-2 py-1.5">{row.state}</td>
                        <td className="px-2 py-1.5">{row.lga}</td>
                        <td className="px-2 py-1.5">{row.gender}</td>
                        <td className="px-2 py-1.5">{row.jambScore}</td>
                        <td className="px-2 py-1.5">
                          <Badge
                            className="text-xs"
                            variant={
                              row.status === "Accepted"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="w-full" onClick={importCsvRows}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Import (
                {csvRows.filter((r) => r.name.trim() && r.deptId).length} valid
                candidates)
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Admitted Candidates Tab ────────────────────────────── */}
        <TabsContent value="admitted" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <p className="text-sm font-medium">
              Admitted candidates for {academicSession} —{" "}
              {
                students.filter((s) => s.admissionSession === academicSession)
                  .length
              }{" "}
              record(s)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = students
                  .filter((s) => s.admissionSession === academicSession)
                  .map(
                    (s, i) =>
                      `${i + 1},${s.jambRegNo ?? ""},${s.name},${s.department ?? ""},${s.state ?? ""},${s.lga ?? ""},${s.gender ?? ""},${s.matricNumber}`,
                  );
                const csv = [
                  "S/N,JAMB Reg No,Name,Department,State,LGA,Gender,Matric No",
                  ...rows,
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Admitted_Candidates_${academicSession}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b border-border sticky top-0">
                <tr>
                  {[
                    "S/N",
                    "JAMB Reg No",
                    "Name",
                    "Department",
                    "State",
                    "LGA",
                    "Sex",
                    "Matric No",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left font-medium text-muted-foreground px-3 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => s.admissionSession === academicSession)
                  .map((s, i) => (
                    <tr
                      key={String(s.id)}
                      className="border-b border-border/50 hover:bg-muted/10"
                    >
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.jambRegNo ?? "-"}
                      </td>
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2">{s.department ?? "-"}</td>
                      <td className="px-3 py-2">{s.state ?? "-"}</td>
                      <td className="px-3 py-2">{s.lga ?? "-"}</td>
                      <td className="px-3 py-2">{s.gender ?? "-"}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.matricNumber}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            s.status === "Accepted" || s.status === "accepted"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs capitalize"
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                {students.filter((s) => s.admissionSession === academicSession)
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-8 text-center text-muted-foreground text-sm"
                    >
                      No admitted candidates for {academicSession} yet. Import
                      from the scanner or CSV tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Paste Candidates Modal ─────────────────────────────────── */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-primary" />
                Paste JAMB Candidate Data
              </h3>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setPasteModalOpen(false);
                  setPasteModalText("");
                }}
                data-ocid="jamb.paste.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy candidate rows from Word, Excel, or a JAMB printout and paste
              below. Supported formats: tab-separated, comma-separated (CSV), or
              space-separated. Column order: Reg No, Full Name, Course Admitted,
              State, LGA, Sex, JAMB Score.
            </p>
            <textarea
              className="w-full h-44 text-xs border border-border rounded-lg p-3 font-mono bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={
                "34521098CA\tADAMU IBRAHIM MUSA\tComputer Science Education\tNiger\tShiroro\tMale\t287\n34812345CB\tFATIMA BELLO USMAN\tBiology Education\tKebbi\tBirnin Kebbi\tFemale\t271"
              }
              value={pasteModalText}
              onChange={(e) => setPasteModalText(e.target.value)}
              data-ocid="jamb.paste.textarea"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPasteModalOpen(false);
                  setPasteModalText("");
                }}
                data-ocid="jamb.paste.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasteModalSubmit}
                disabled={!pasteModalText.trim()}
                data-ocid="jamb.paste.submit_button"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Parse & Load Candidates
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
