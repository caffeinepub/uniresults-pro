import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Download,
  FileUp,
  Pencil,
  Printer,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { type ExtendedStudent, useApp } from "../../context/AppContext";
import { generateMatricNumber } from "../../utils/matricUtils";

interface ParsedCandidate {
  regNo: string;
  surname: string;
  firstname: string;
  otherNames: string;
  course: string;
  state: string;
  lga: string;
  sex: string;
  isDuplicate: boolean;
  selected: boolean;
  mappedDeptId: bigint | null;
  mappedDeptName: string;
}

const DEPT_COURSE_MAP: Record<string, string[]> = {
  "Biology Education": ["biology", "bio edu"],
  "Chemistry Education": ["chemistry", "chem edu"],
  "Computer Science Education": [
    "computer science",
    "csc edu",
    "edu & computer",
    "education & computer",
  ],
  "Mathematics Education": ["mathematics", "math edu", "maths edu"],
  "Science Education": ["science education", "general science"],
  "Physics Education": ["physics", "phy edu"],
};

const DEPT_CODE_MAP: Record<string, string> = {
  "Biology Education": "BIO",
  "Chemistry Education": "CHM",
  "Computer Science Education": "CSE",
  "Mathematics Education": "MTE",
  "Science Education": "SCE",
  "Physics Education": "PHY",
};

function mapCourseToDept(
  courseName: string,
  departments: Array<{ id: bigint; name: string }>,
): { deptId: bigint | null; deptName: string } {
  const lower = courseName.toLowerCase();
  for (const [deptName, keywords] of Object.entries(DEPT_COURSE_MAP)) {
    if (keywords.some((k) => lower.includes(k))) {
      const dept = departments.find((d) =>
        d.name.toLowerCase().includes(deptName.toLowerCase().split(" ")[0]),
      );
      if (dept) return { deptId: dept.id, deptName: dept.name };
    }
  }
  const dept = departments.find(
    (d) =>
      lower.includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes(lower),
  );
  if (dept) return { deptId: dept.id, deptName: dept.name };
  return { deptId: null, deptName: courseName };
}

function getDeptCode(deptName: string): string {
  for (const [name, code] of Object.entries(DEPT_CODE_MAP)) {
    if (deptName.toLowerCase().includes(name.toLowerCase().split(" ")[0]))
      return code;
  }
  return (
    deptName
      .replace(/[^A-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "STD"
  );
}

function parseCSV(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

function downloadTemplate() {
  const header = "Reg No,Surname,Firstname,Other Names,Course,State,LGA,Sex";
  const sample =
    "19XXXXXXXXXX,IBRAHIM,AHMED,USMAN,Biology Education,Niger,Kontagora,Male";
  const blob = new Blob([`${header}\n${sample}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jamb_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type SortField =
  | "name"
  | "jambRegNo"
  | "matricNumber"
  | "department"
  | "state"
  | "status"
  | "level";
type SortDir = "asc" | "desc";

export default function JAMBImportTab() {
  const {
    students,
    departments,
    faculties,
    addStudent,
    updateStudent,
    logAudit,
    currentUser,
    jambRegistrationOpen,
    setJambRegistrationOpen,
  } = useApp();
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedCandidate[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Imported students panel state
  const [searchQ, setSearchQ] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingStudent, setEditingStudent] = useState<ExtendedStudent | null>(
    null,
  );
  const [editForm, setEditForm] = useState<Partial<ExtendedStudent>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState("import");

  // All students with a JAMB reg number
  const jambStudents = useMemo(() => {
    return students.filter((s) => s.jambRegNo && s.jambRegNo.trim() !== "");
  }, [students]);

  const getDeptName = (deptId: bigint | undefined) => {
    if (!deptId) return "—";
    const dept = departments.find((d) => String(d.id) === String(deptId));
    return dept?.name ?? "—";
  };

  const getFacultyName = (deptId: bigint | undefined) => {
    if (!deptId) return "—";
    const dept = departments.find((d) => String(d.id) === String(deptId));
    if (!dept) return "—";
    const fac = faculties.find((f) => String(f.id) === String(dept.facultyId));
    return fac?.name ?? "—";
  };

  // Filtered + sorted list
  const filteredStudents = useMemo(() => {
    const _getDeptName = (deptId: bigint | undefined) => {
      if (!deptId) return "";
      return (
        departments.find((d) => String(d.id) === String(deptId))?.name ?? ""
      );
    };
    let list = [...jambStudents];
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.jambRegNo ?? "").toLowerCase().includes(q) ||
          (s.matricNumber ?? "").toLowerCase().includes(q) ||
          _getDeptName(s.departmentId).toLowerCase().includes(q) ||
          (s.state ?? "").toLowerCase().includes(q),
      );
    }
    if (filterDept !== "all") {
      list = list.filter((s) => String(s.departmentId) === filterDept);
    }
    if (filterStatus !== "all") {
      list = list.filter((s) => s.status === filterStatus);
    }
    list.sort((a, b) => {
      let av = "";
      let bv = "";
      if (sortField === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortField === "jambRegNo") {
        av = a.jambRegNo ?? "";
        bv = b.jambRegNo ?? "";
      } else if (sortField === "matricNumber") {
        av = a.matricNumber ?? "";
        bv = b.matricNumber ?? "";
      } else if (sortField === "department") {
        av = _getDeptName(a.departmentId);
        bv = _getDeptName(b.departmentId);
      } else if (sortField === "state") {
        av = a.state ?? "";
        bv = b.state ?? "";
      } else if (sortField === "status") {
        av = a.status ?? "";
        bv = b.status ?? "";
      } else if (sortField === "level") {
        av = String(a.level ?? 0);
        bv = String(b.level ?? 0);
      }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [
    jambStudents,
    searchQ,
    filterDept,
    filterStatus,
    sortField,
    sortDir,
    departments,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const uniqueDepts = useMemo(() => {
    const ids = new Set(
      jambStudents.map((s) => String(s.departmentId)).filter(Boolean),
    );
    return departments.filter((d) => ids.has(String(d.id)));
  }, [jambStudents, departments]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of jambStudents) {
      map[s.status ?? "unknown"] = (map[s.status ?? "unknown"] ?? 0) + 1;
    }
    return map;
  }, [jambStudents]);

  const handleDelete = (id: bigint) => {
    // Remove student using setStudents via direct context manipulation
    // We use updateStudent with a special marker or rely on existing pattern
    // Since removeStudent isn't exported directly, use the setStudents workaround
    setConfirmDeleteId(null);
    try {
      const raw = localStorage.getItem("students");
      if (raw) {
        const parsed = JSON.parse(raw) as ExtendedStudent[];
        const updated = parsed.filter(
          (s: ExtendedStudent) => String(s.id) !== String(id),
        );
        localStorage.setItem("students", JSON.stringify(updated));
      }
    } catch {
      /* ignore */
    }
    // Trigger re-render by updating a student (force context refresh on next render)
    // Best: call updateStudent with a flag, or reload
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "Delete Student",
      `Deleted JAMB student id=${id}`,
    );
    toast.success("Student removed. Refresh the page to see updated list.");
    // Force page reload for immediate effect
    window.location.reload();
  };

  const openEdit = (student: ExtendedStudent) => {
    setEditingStudent(student);
    setEditForm({ ...student });
  };

  const saveEdit = () => {
    if (!editingStudent) return;
    updateStudent(editingStudent.id, editForm);
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "Edit Student",
      `Updated JAMB student ${editingStudent.name}`,
    );
    toast.success("Student record updated.");
    setEditingStudent(null);
    setEditForm({});
  };

  const exportCSV = () => {
    const header =
      "S/N,JAMB Reg No,Full Name,Matric Number,Department,Faculty,Level,State,LGA,Sex,Status,Entry Mode";
    const rows = filteredStudents.map((s, i) =>
      [
        i + 1,
        s.jambRegNo ?? "",
        s.name,
        s.matricNumber ?? "",
        getDeptName(s.departmentId),
        getFacultyName(s.departmentId),
        String(s.level ?? 100),
        s.state ?? "",
        s.lga ?? "",
        s.gender ?? "",
        s.status ?? "",
        s.entryMode ?? "",
      ].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jamb_imported_students.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV.");
  };

  const printTable = () => {
    const rows = filteredStudents
      .map(
        (s, i) =>
          `<tr>
        <td>${i + 1}</td>
        <td>${s.jambRegNo ?? ""}</td>
        <td>${s.name}</td>
        <td>${s.matricNumber ?? ""}</td>
        <td>${getDeptName(s.departmentId)}</td>
        <td>${String(s.level ?? 100)}</td>
        <td>${s.state ?? ""}</td>
        <td>${s.gender ?? ""}</td>
        <td>${s.status ?? ""}</td>
      </tr>`,
      )
      .join("");
    const html = `<html><head><title>JAMB Imported Students</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:4px 6px}th{background:#eee}h2{text-align:center}</style>
      </head><body>
      <h2>JAMB Imported Students</h2>
      <p>Total: ${filteredStudents.length} students | Printed: ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>S/N</th><th>JAMB Reg No</th><th>Full Name</th><th>Matric No</th><th>Department</th><th>Level</th><th>State</th><th>Sex</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  // --- Import logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? "");
      toast.success('File loaded. Click "Parse & Preview" to continue.');
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      toast.error("No data rows found. Please check your CSV.");
      return;
    }
    const data = rows.slice(1);
    const allDepts = [...departments];

    const parsed: ParsedCandidate[] = data.map((cols) => {
      const regNo = cols[0] ?? "";
      const surname = cols[1] ?? "";
      const firstname = cols[2] ?? "";
      const otherNames = cols[3] ?? "";
      const course = cols[4] ?? "";
      const state = cols[5] ?? "";
      const lga = cols[6] ?? "";
      const sex = cols[7] ?? "";
      const isDuplicate = students.some(
        (s) => s.jambRegNo && s.jambRegNo === regNo,
      );
      const { deptId, deptName } = mapCourseToDept(course, allDepts);
      return {
        regNo,
        surname,
        firstname,
        otherNames,
        course,
        state,
        lga,
        sex,
        isDuplicate,
        selected: !isDuplicate,
        mappedDeptId: deptId,
        mappedDeptName: deptId ? deptName : course,
      };
    });
    setParsedRows(parsed);
    setImportDone(null);
    toast.success(`Parsed ${parsed.length} rows. Review below.`);
  };

  const toggleSelect = (idx: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)),
    );
  };

  const handleImport = async (onlySelected = true) => {
    const toImport = onlySelected
      ? parsedRows.filter((r) => r.selected && !r.isDuplicate)
      : parsedRows.filter((r) => !r.isDuplicate);
    if (toImport.length === 0) {
      toast.error("No rows to import.");
      return;
    }
    setImporting(true);
    setImportProgress(0);
    let imported = 0;
    let skipped = 0;
    const year = new Date().getFullYear();

    const deptCounters: Record<string, number> = {};
    for (const s of students) {
      const did = String(s.departmentId ?? "");
      deptCounters[did] = (deptCounters[did] ?? 0) + 1;
    }

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
      await new Promise((r) => setTimeout(r, 10));

      if (!row.mappedDeptId) {
        skipped++;
        continue;
      }
      const deptId = row.mappedDeptId;
      const deptKey = String(deptId);
      deptCounters[deptKey] = (deptCounters[deptKey] ?? 0) + 1;
      const sn = String(deptCounters[deptKey]).padStart(3, "0");
      const deptCode = getDeptCode(row.mappedDeptName);
      const matric = `${deptCode}/${year}/${sn}`;
      const fullName = [row.firstname, row.otherNames, row.surname]
        .filter(Boolean)
        .join(" ");

      const student: ExtendedStudent = {
        id: BigInt(Date.now() + i),
        name: fullName || row.surname,
        matricNumber: matric,
        departmentId: deptId,
        level: BigInt(100),
        status: "accepted",
        userPrincipal: `student-jamb-${row.regNo}`,
        gender: row.sex.toLowerCase().startsWith("f") ? "Female" : "Male",
        state: row.state,
        lga: row.lga,
        jambRegNo: row.regNo,
        regNo: row.regNo,
        admissionYear: String(year),
        programmeType: "Undergraduate",
      };
      addStudent(student);
      imported++;
    }
    setImporting(false);
    setImportDone({ imported, skipped });
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "JAMB Import",
      `Imported ${imported} students from JAMB list`,
    );
    toast.success(`Import complete: ${imported} imported, ${skipped} skipped.`);
    // Switch to imported tab automatically
    setTimeout(() => setActiveTab("imported"), 800);
  };

  const handleGenerateSingle = (student: ExtendedStudent) => {
    if (!jambRegistrationOpen) {
      toast.error("Enable JAMB Registration to generate matric numbers.");
      return;
    }
    const dept = departments.find(
      (d) => String(d.id) === String(student.departmentId),
    );
    const deptName = dept?.name ?? "";
    const newMatric = generateMatricNumber({
      deptName,
      departmentId: student.departmentId,
      students,
    });
    updateStudent(student.id, { matricNumber: newMatric });
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "Generate Matric",
      `Generated matric ${newMatric} for ${student.name}`,
    );
    toast.success(`Matric number assigned: ${newMatric}`);
  };

  const handleGenerateAll = () => {
    if (!jambRegistrationOpen) {
      toast.error("Enable JAMB Registration to generate matric numbers.");
      return;
    }
    const pending = jambStudents.filter((s) => !s.matricNumber?.trim());
    if (pending.length === 0) {
      toast.info("All imported students already have matric numbers.");
      return;
    }
    const updatedStudents = [...students];
    let count = 0;
    for (const student of pending) {
      const dept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      const deptName = dept?.name ?? "";
      const newMatric = generateMatricNumber({
        deptName,
        departmentId: student.departmentId,
        students: updatedStudents,
      });
      updateStudent(student.id, { matricNumber: newMatric });
      const idx = updatedStudents.findIndex(
        (s) => String(s.id) === String(student.id),
      );
      if (idx !== -1) {
        updatedStudents[idx] = {
          ...updatedStudents[idx],
          matricNumber: newMatric,
        };
      }
      count++;
    }
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "Generate All Matrics",
      `Generated ${count} matric numbers for JAMB imported students`,
    );
    toast.success(`Matric numbers generated for ${count} students`);
  };

  const isAdminOrRegistrar =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "Registrar";

  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const selectedCount = parsedRows.filter(
    (r) => r.selected && !r.isDuplicate,
  ).length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      accepted: "bg-blue-100 text-blue-700",
      active: "bg-green-100 text-green-700",
      graduated: "bg-purple-100 text-purple-700",
      withdrawn: "bg-red-100 text-red-700",
      deferred: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            JAMB Admission Import
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Import JAMB candidates and view all imported students
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          CSV Template
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {jambStudents.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total JAMB Imported
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {statusCounts.accepted ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Accepted</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {statusCounts.active ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">
            {uniqueDepts.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Departments</p>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">Import New</TabsTrigger>
          <TabsTrigger value="imported">
            All Imported Students
            {jambStudents.length > 0 && (
              <Badge className="ml-2 h-5" variant="secondary">
                {jambStudents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== IMPORT TAB ===== */}
        <TabsContent value="import" className="space-y-6 mt-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Tabs defaultValue="paste">
              <TabsList>
                <TabsTrigger value="paste">Paste CSV</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="pt-3">
                <Label className="text-sm font-medium mb-2 block">
                  Paste CSV content here
                </Label>
                <Textarea
                  data-ocid="jamb_import.textarea"
                  className="font-mono text-xs min-h-[160px]"
                  placeholder={
                    "Reg No,Surname,Firstname,Other Names,Course,State,LGA,Sex\n19XXXXXXXXXX,IBRAHIM,AHMED,USMAN,Biology Education,Niger,Kontagora,Male"
                  }
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="upload" className="pt-3">
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  data-ocid="jamb_import.dropzone"
                >
                  <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag &amp; drop a CSV file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepts .csv files
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </button>
                {csvText && (
                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> File loaded (
                    {csvText.split("\n").length} lines)
                  </p>
                )}
              </TabsContent>
            </Tabs>
            <Button
              onClick={handleParse}
              data-ocid="jamb_import.primary_button"
              disabled={!csvText.trim()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Parse &amp; Preview
            </Button>
          </div>

          {parsedRows.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {parsedRows.length} candidates parsed
                  </span>
                  {duplicateCount > 0 && (
                    <Badge variant="destructive">
                      {duplicateCount} duplicates
                    </Badge>
                  )}
                  <Badge variant="secondary">{selectedCount} selected</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="jamb_import.secondary_button"
                    onClick={() => handleImport(true)}
                    disabled={importing || selectedCount === 0}
                  >
                    Import Selected ({selectedCount})
                  </Button>
                  <Button
                    size="sm"
                    data-ocid="jamb_import.submit_button"
                    onClick={() => handleImport(false)}
                    disabled={importing}
                  >
                    Import All Non-Duplicates
                  </Button>
                </div>
              </div>

              {importing && (
                <div
                  className="px-4 py-3 border-b border-border"
                  data-ocid="jamb_import.loading_state"
                >
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Importing... {importProgress}%
                  </p>
                </div>
              )}

              {importDone && (
                <div
                  className="px-4 py-3 border-b border-border bg-success/10 flex items-center gap-2"
                  data-ocid="jamb_import.success_state"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {importDone.imported} students imported,{" "}
                    {importDone.skipped} skipped
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setActiveTab("imported")}
                  >
                    View Imported Students →
                  </Button>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table data-ocid="jamb_import.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={parsedRows.every(
                            (r) => r.isDuplicate || r.selected,
                          )}
                          onCheckedChange={(v) =>
                            setParsedRows((prev) =>
                              prev.map((r) =>
                                r.isDuplicate ? r : { ...r, selected: !!v },
                              ),
                            )
                          }
                        />
                      </TableHead>
                      <TableHead>S/N</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Course / Department</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>LGA</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow
                        key={`${row.regNo}-${idx}`}
                        data-ocid={`jamb_import.item.${idx + 1}`}
                        className={row.isDuplicate ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={row.selected}
                            disabled={row.isDuplicate}
                            onCheckedChange={() => toggleSelect(idx)}
                            data-ocid={`jamb_import.checkbox.${idx + 1}`}
                          />
                        </TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.regNo}
                        </TableCell>
                        <TableCell>
                          {[row.firstname, row.otherNames, row.surname]
                            .filter(Boolean)
                            .join(" ")}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{row.course}</div>
                            {row.mappedDeptId ? (
                              <div className="text-success text-xs">
                                → {row.mappedDeptName}
                              </div>
                            ) : (
                              <div className="text-destructive text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> No match
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{row.state}</TableCell>
                        <TableCell className="text-xs">{row.lga}</TableCell>
                        <TableCell className="text-xs">{row.sex}</TableCell>
                        <TableCell>
                          {row.isDuplicate ? (
                            <Badge variant="destructive">Duplicate</Badge>
                          ) : (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {parsedRows.length === 0 && (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="jamb_import.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Paste or upload a JAMB candidate list, then click "Parse &amp;
                Preview"
              </p>
            </div>
          )}
        </TabsContent>

        {/* ===== IMPORTED STUDENTS TAB ===== */}
        <TabsContent value="imported" className="space-y-4 mt-4">
          {/* Registration toggle row */}
          {isAdminOrRegistrar && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <span className="text-sm font-medium">JAMB Registration:</span>
              {jambRegistrationOpen ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  OPEN
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  CLOSED
                </Badge>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={jambRegistrationOpen}
                aria-label="Toggle JAMB Registration"
                onClick={() => setJambRegistrationOpen(!jambRegistrationOpen)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${jambRegistrationOpen ? "bg-primary" : "bg-muted-foreground/40"}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${jambRegistrationOpen ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                disabled={!jambRegistrationOpen}
                title={
                  jambRegistrationOpen
                    ? "Generate matric numbers for all students without one"
                    : "Enable JAMB Registration to generate matric numbers"
                }
                onClick={handleGenerateAll}
                data-ocid="jamb_import.generate_all_button"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate All Matric Numbers
              </Button>
            </div>
          )}

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, JAMB reg, matric, state..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              {searchQ && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQ("")}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepts.map((d) => (
                  <SelectItem key={String(d.id)} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={printTable}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredStudents.length}
            </span>{" "}
            of {jambStudents.length} JAMB imported students
          </div>

          {jambStudents.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">
                No students imported from JAMB yet
              </p>
              <p className="text-sm mt-1">
                Switch to the "Import New" tab to import your first batch.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setActiveTab("import")}
              >
                Go to Import
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                No students match your search or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">S/N</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("jambRegNo")}
                        >
                          JAMB Reg No <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("name")}
                        >
                          Full Name <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("matricNumber")}
                        >
                          Matric No <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("department")}
                        >
                          Department <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("level")}
                        >
                          Level <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("state")}
                        >
                          State <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead>Entry Mode</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("status")}
                        >
                          Status <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, idx) => (
                      <TableRow key={String(student.id)}>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {student.jambRegNo ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {student.matricNumber?.trim() ? (
                            student.matricNumber
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{getDeptName(student.departmentId)}</div>
                          <div className="text-xs text-muted-foreground">
                            {getFacultyName(student.departmentId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {String(student.level ?? 100)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.state ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.gender ?? "—"}
                        </TableCell>
                        <TableCell>
                          {student.entryMode ? (
                            <Badge variant="outline" className="text-xs">
                              {student.entryMode}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              UTME
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {statusBadge(student.status ?? "accepted")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!student.matricNumber?.trim() && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-yellow-600 hover:text-yellow-700"
                                title={
                                  jambRegistrationOpen
                                    ? "Generate matric number"
                                    : "Enable JAMB Registration to generate matric numbers"
                                }
                                disabled={!jambRegistrationOpen}
                                onClick={() => handleGenerateSingle(student)}
                                data-ocid={`jamb_import.generate.${student.id}`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Edit"
                              onClick={() => openEdit(student)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Delete"
                              onClick={() => setConfirmDeleteId(student.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Edit Student Record</h3>
              <button type="button" onClick={() => setEditingStudent(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={editForm.name ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">JAMB Reg No</Label>
                  <Input
                    value={editForm.jambRegNo ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, jambRegNo: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Matric Number</Label>
                  <Input
                    value={editForm.matricNumber ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        matricNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Level</Label>
                  <Select
                    value={String(editForm.level ?? 100)}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, level: BigInt(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[100, 200, 300, 400, 500, 600].map((l) => (
                        <SelectItem key={l} value={String(l)}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sex</Label>
                  <Select
                    value={editForm.gender ?? "Male"}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, gender: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Entry Mode</Label>
                  <Select
                    value={editForm.entryMode ?? "UTME"}
                    onValueChange={(v) =>
                      setEditForm((f) => ({
                        ...f,
                        entryMode: v as "UTME" | "DE",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTME">UTME</SelectItem>
                      <SelectItem value="DE">Direct Entry (DE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Input
                    value={editForm.state ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, state: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">LGA</Label>
                  <Input
                    value={editForm.lga ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, lga: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={editForm.status ?? "accepted"}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, status: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Department</Label>
                  <Select
                    value={String(editForm.departmentId ?? "")}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, departmentId: BigInt(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-destructive mb-2">
              Delete Student?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently remove the student record. This action
              cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
