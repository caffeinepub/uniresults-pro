import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BookOpen,
  CheckCircle,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

// ── Types ──────────────────────────────────────────────────────────────────
export interface PGResult {
  id: string;
  pgStudentId: string;
  studentName: string;
  programme: string;
  departmentId: string;
  semester: string;
  session: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  total: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
  isThesis: boolean;
}

export interface PGThesisProgress {
  id: string;
  pgStudentId: string;
  studentName: string;
  programme: string;
  departmentId: string;
  supervisorName: string;
  thesisTitle: string;
  stage:
    | "Proposal"
    | "Fieldwork"
    | "Writing"
    | "Defense"
    | "Final Submission"
    | "Examiner Review"
    | "Approved";
  stageNotes: string;
  updatedAt: string;
  session: string;
}

// ── Storage ────────────────────────────────────────────────────────────────
const RESULTS_KEY = "unipro_pg_results";
const THESIS_KEY = "unipro_pg_thesis";

function loadPGResults(): PGResult[] {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function savePGResults(d: PGResult[]) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(d));
}

function loadThesis(): PGThesisProgress[] {
  try {
    return JSON.parse(localStorage.getItem(THESIS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveThesis(d: PGThesisProgress[]) {
  localStorage.setItem(THESIS_KEY, JSON.stringify(d));
}

// ── Grading helpers ────────────────────────────────────────────────────────
function calcPGGrade(total: number): {
  grade: string;
  gp: number;
  passed: boolean;
} {
  if (total >= 75) return { grade: "A", gp: 5.0, passed: true };
  if (total >= 65) return { grade: "B", gp: 4.0, passed: true };
  if (total >= 55) return { grade: "C", gp: 3.0, passed: true };
  if (total >= 45) return { grade: "D", gp: 2.0, passed: false };
  return { grade: "F", gp: 0.0, passed: false };
}

function calcCGPA(results: PGResult[]): number {
  if (results.length === 0) return 0;
  const totalGP = results.reduce((s, r) => s + r.gradePoint * r.creditUnits, 0);
  const totalCU = results.reduce((s, r) => s + r.creditUnits, 0);
  return totalCU > 0 ? Math.round((totalGP / totalCU) * 100) / 100 : 0;
}

function pgClassification(cgpa: number): string {
  if (cgpa >= 4.5) return "Distinction";
  if (cgpa >= 3.5) return "Merit";
  if (cgpa >= 2.5) return "Pass";
  return "Fail";
}

const THESIS_STAGES: PGThesisProgress["stage"][] = [
  "Proposal",
  "Fieldwork",
  "Writing",
  "Defense",
  "Final Submission",
  "Examiner Review",
  "Approved",
];

const STAGE_PROGRESS: Record<PGThesisProgress["stage"], number> = {
  Proposal: 14,
  Fieldwork: 28,
  Writing: 42,
  Defense: 57,
  "Final Submission": 71,
  "Examiner Review": 85,
  Approved: 100,
};

// ── Component ──────────────────────────────────────────────────────────────
export default function PGResultsTab() {
  const { departments, currentUser, logAudit } = useApp();
  const [results, setResultsState] = useState<PGResult[]>(loadPGResults);
  const [thesis, setThesisState] = useState<PGThesisProgress[]>(loadThesis);

  // Score entry form
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entry, setEntry] = useState({
    pgStudentId: "",
    studentName: "",
    programme: "MSc",
    departmentId: "",
    semester: "First",
    session: "2024/2025",
    courseCode: "",
    courseTitle: "",
    creditUnits: "2",
    caScore: "",
    examScore: "",
    isThesis: false,
  });

  // Thesis form
  const [showThesisForm, setShowThesisForm] = useState(false);
  const [thesisEdit, setThesisEdit] = useState<PGThesisProgress | null>(null);
  const [thesisForm, setThesisForm] = useState({
    pgStudentId: "",
    studentName: "",
    programme: "PhD",
    departmentId: "",
    supervisorName: "",
    thesisTitle: "",
    stage: "Proposal" as PGThesisProgress["stage"],
    stageNotes: "",
    session: "2024/2025",
  });

  const [filterDept, setFilterDept] = useState("");
  const [filterSession, setFilterSession] = useState("");

  function persistResults(d: PGResult[]) {
    setResultsState(d);
    savePGResults(d);
  }
  function persistThesis(d: PGThesisProgress[]) {
    setThesisState(d);
    saveThesis(d);
  }

  function handleSubmitEntry() {
    const ca = Number(entry.caScore);
    const exam = Number(entry.examScore);
    const total = ca + exam;
    const { grade, gp, passed } = calcPGGrade(total);
    const newResult: PGResult = {
      id: Date.now().toString(),
      pgStudentId: entry.pgStudentId,
      studentName: entry.studentName,
      programme: entry.programme,
      departmentId: entry.departmentId,
      semester: entry.semester,
      session: entry.session,
      courseCode: entry.courseCode.toUpperCase(),
      courseTitle: entry.courseTitle,
      creditUnits: Number(entry.creditUnits),
      caScore: ca,
      examScore: exam,
      total,
      grade,
      gradePoint: gp,
      isPassed: passed,
      isThesis: entry.isThesis,
    };
    persistResults([...results, newResult]);
    setShowEntryForm(false);
    setEntry({
      pgStudentId: "",
      studentName: "",
      programme: "MSc",
      departmentId: "",
      semester: "First",
      session: "2024/2025",
      courseCode: "",
      courseTitle: "",
      creditUnits: "2",
      caScore: "",
      examScore: "",
      isThesis: false,
    });
    toast.success("PG result recorded");
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "PG Result Entry",
      `${entry.courseCode} — ${entry.studentName}`,
    );
  }

  function handleSaveThesis() {
    if (thesisEdit) {
      persistThesis(
        thesis.map((t) =>
          t.id === thesisEdit.id
            ? { ...t, ...thesisForm, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
      toast.success("Thesis progress updated");
    } else {
      const newT: PGThesisProgress = {
        id: Date.now().toString(),
        ...thesisForm,
        updatedAt: new Date().toISOString(),
      };
      persistThesis([...thesis, newT]);
      toast.success("Thesis record added");
    }
    setShowThesisForm(false);
    setThesisEdit(null);
  }

  const filteredResults = useMemo(
    () =>
      results.filter(
        (r) =>
          (!filterDept || r.departmentId === filterDept) &&
          (!filterSession || r.session === filterSession),
      ),
    [results, filterDept, filterSession],
  );

  // Group results by student for CGPA display
  const studentSummaries = useMemo(() => {
    const map = new Map<
      string,
      { name: string; programme: string; deptId: string; results: PGResult[] }
    >();
    for (const r of filteredResults) {
      if (!map.has(r.pgStudentId))
        map.set(r.pgStudentId, {
          name: r.studentName,
          programme: r.programme,
          deptId: r.departmentId,
          results: [],
        });
      map.get(r.pgStudentId)!.results.push(r);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      ...v,
      cgpa: calcCGPA(v.results),
    }));
  }, [filteredResults]);

  const filteredThesis = useMemo(
    () =>
      thesis.filter(
        (t) =>
          (!filterDept || t.departmentId === filterDept) &&
          (!filterSession || t.session === filterSession),
      ),
    [thesis, filterDept, filterSession],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">PG Results Processing</h2>
        <Badge variant="outline" className="ml-auto">
          5-Point CGPA Scale
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sessions</SelectItem>
            <SelectItem value="2024/2025">2024/2025</SelectItem>
            <SelectItem value="2023/2024">2023/2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="coursework">
        <TabsList>
          <TabsTrigger value="coursework">Coursework Results</TabsTrigger>
          <TabsTrigger value="thesis">Thesis Progress</TabsTrigger>
          <TabsTrigger value="summary">Student Summaries</TabsTrigger>
        </TabsList>

        {/* ── Coursework Results ── */}
        <TabsContent value="coursework" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              PG pass mark: <strong>55%</strong> (Distinction ≥ 75)
            </p>
            <Button
              size="sm"
              onClick={() => setShowEntryForm(true)}
              data-ocid="pg_results.add_result_btn"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Result
            </Button>
          </div>

          {showEntryForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Enter PG Course Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Student ID / Matric No</Label>
                    <Input
                      className="h-8 text-sm"
                      value={entry.pgStudentId}
                      onChange={(e) =>
                        setEntry({ ...entry, pgStudentId: e.target.value })
                      }
                      placeholder="PG/2025/001"
                      data-ocid="pg_results.student_id_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Student Name</Label>
                    <Input
                      className="h-8 text-sm"
                      value={entry.studentName}
                      onChange={(e) =>
                        setEntry({ ...entry, studentName: e.target.value })
                      }
                      placeholder="Full name"
                      data-ocid="pg_results.student_name_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Programme</Label>
                    <Select
                      value={entry.programme}
                      onValueChange={(v) =>
                        setEntry({ ...entry, programme: v })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["MSc", "PGDE", "PhD", "MBA", "PGD"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Select
                      value={entry.departmentId}
                      onValueChange={(v) =>
                        setEntry({ ...entry, departmentId: v })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
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
                  <div>
                    <Label className="text-xs">Course Code</Label>
                    <Input
                      className="h-8 text-sm"
                      value={entry.courseCode}
                      onChange={(e) =>
                        setEntry({ ...entry, courseCode: e.target.value })
                      }
                      placeholder="CSC 701"
                      data-ocid="pg_results.course_code_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Course Title</Label>
                    <Input
                      className="h-8 text-sm"
                      value={entry.courseTitle}
                      onChange={(e) =>
                        setEntry({ ...entry, courseTitle: e.target.value })
                      }
                      placeholder="Advanced Algorithms"
                      data-ocid="pg_results.course_title_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Credit Units</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      min="1"
                      max="6"
                      value={entry.creditUnits}
                      onChange={(e) =>
                        setEntry({ ...entry, creditUnits: e.target.value })
                      }
                      data-ocid="pg_results.credit_units_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Session</Label>
                    <Select
                      value={entry.session}
                      onValueChange={(v) => setEntry({ ...entry, session: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">CA Score (30)</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      min="0"
                      max="30"
                      value={entry.caScore}
                      onChange={(e) =>
                        setEntry({ ...entry, caScore: e.target.value })
                      }
                      data-ocid="pg_results.ca_score_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Exam Score (70)</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      min="0"
                      max="70"
                      value={entry.examScore}
                      onChange={(e) =>
                        setEntry({ ...entry, examScore: e.target.value })
                      }
                      data-ocid="pg_results.exam_score_input"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    id="isThesis"
                    checked={entry.isThesis}
                    onChange={(e) =>
                      setEntry({ ...entry, isThesis: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label htmlFor="isThesis" className="text-muted-foreground">
                    This is a thesis/dissertation unit
                  </label>
                </div>
                {entry.caScore && entry.examScore && (
                  <div className="bg-muted/40 rounded p-2 text-xs text-muted-foreground">
                    Total:{" "}
                    <strong className="text-foreground">
                      {Number(entry.caScore) + Number(entry.examScore)}
                    </strong>{" "}
                    — Grade:{" "}
                    <strong className="text-foreground">
                      {
                        calcPGGrade(
                          Number(entry.caScore) + Number(entry.examScore),
                        ).grade
                      }
                    </strong>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitEntry}
                    data-ocid="pg_results.submit_result_btn"
                  >
                    Save Result
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEntryForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table data-ocid="pg_results.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>CU</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>GP</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-muted-foreground py-8"
                          data-ocid="pg_results.empty_state"
                        >
                          No PG results recorded yet. Click "Add Result" to get
                          started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {r.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {r.pgStudentId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.programme}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-xs font-mono">
                                {r.courseCode}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {r.courseTitle}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {r.creditUnits}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.caScore}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.examScore}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {r.total}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.grade === "A"
                                  ? "default"
                                  : r.grade === "F"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {r.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {r.gradePoint.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={r.isPassed ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {r.isPassed ? "Pass" : "Fail"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Thesis Progress ── */}
        <TabsContent value="thesis" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Track thesis progression from Proposal to Approval
            </p>
            <Button
              size="sm"
              onClick={() => {
                setThesisEdit(null);
                setThesisForm({
                  pgStudentId: "",
                  studentName: "",
                  programme: "PhD",
                  departmentId: "",
                  supervisorName: "",
                  thesisTitle: "",
                  stage: "Proposal",
                  stageNotes: "",
                  session: "2024/2025",
                });
                setShowThesisForm(true);
              }}
              data-ocid="pg_results.add_thesis_btn"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Thesis Record
            </Button>
          </div>

          {showThesisForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {thesisEdit ? "Update Thesis Progress" : "New Thesis Record"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Student Matric No</Label>
                    <Input
                      className="h-8 text-sm"
                      value={thesisForm.pgStudentId}
                      onChange={(e) =>
                        setThesisForm({
                          ...thesisForm,
                          pgStudentId: e.target.value,
                        })
                      }
                      placeholder="PG/2025/001"
                      data-ocid="pg_results.thesis_student_id_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Student Name</Label>
                    <Input
                      className="h-8 text-sm"
                      value={thesisForm.studentName}
                      onChange={(e) =>
                        setThesisForm({
                          ...thesisForm,
                          studentName: e.target.value,
                        })
                      }
                      data-ocid="pg_results.thesis_student_name_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Programme</Label>
                    <Select
                      value={thesisForm.programme}
                      onValueChange={(v) =>
                        setThesisForm({ ...thesisForm, programme: v })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["MSc", "PGDE", "PhD", "MBA", "PGD"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Select
                      value={thesisForm.departmentId}
                      onValueChange={(v) =>
                        setThesisForm({ ...thesisForm, departmentId: v })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
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
                  <div>
                    <Label className="text-xs">Supervisor Name</Label>
                    <Input
                      className="h-8 text-sm"
                      value={thesisForm.supervisorName}
                      onChange={(e) =>
                        setThesisForm({
                          ...thesisForm,
                          supervisorName: e.target.value,
                        })
                      }
                      placeholder="Prof. A. Bello"
                      data-ocid="pg_results.thesis_supervisor_input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current Stage</Label>
                    <Select
                      value={thesisForm.stage}
                      onValueChange={(v) =>
                        setThesisForm({
                          ...thesisForm,
                          stage: v as PGThesisProgress["stage"],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THESIS_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Thesis Title</Label>
                  <Input
                    className="h-8 text-sm"
                    value={thesisForm.thesisTitle}
                    onChange={(e) =>
                      setThesisForm({
                        ...thesisForm,
                        thesisTitle: e.target.value,
                      })
                    }
                    placeholder="Impact of Technology on Education..."
                    data-ocid="pg_results.thesis_title_input"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stage Notes</Label>
                  <Textarea
                    rows={2}
                    value={thesisForm.stageNotes}
                    onChange={(e) =>
                      setThesisForm({
                        ...thesisForm,
                        stageNotes: e.target.value,
                      })
                    }
                    placeholder="Supervisor comments, milestones achieved..."
                    data-ocid="pg_results.thesis_notes_textarea"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveThesis}
                    data-ocid="pg_results.save_thesis_btn"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowThesisForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {filteredThesis.length === 0 ? (
              <Card>
                <CardContent
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="pg_results.thesis_empty_state"
                >
                  No thesis records yet. Add thesis progress tracking above.
                </CardContent>
              </Card>
            ) : (
              filteredThesis.map((t) => (
                <Card key={t.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{t.studentName}</p>
                          <Badge variant="outline" className="text-xs">
                            {t.programme}
                          </Badge>
                          <Badge
                            variant={
                              t.stage === "Approved" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {t.stage}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {t.thesisTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supervisor: {t.supervisorName} &nbsp;|&nbsp; Matric:{" "}
                          {t.pgStudentId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          setThesisEdit(t);
                          setThesisForm({
                            pgStudentId: t.pgStudentId,
                            studentName: t.studentName,
                            programme: t.programme,
                            departmentId: t.departmentId,
                            supervisorName: t.supervisorName,
                            thesisTitle: t.thesisTitle,
                            stage: t.stage,
                            stageNotes: t.stageNotes,
                            session: t.session,
                          });
                          setShowThesisForm(true);
                        }}
                        data-ocid="pg_results.edit_thesis_btn"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                    <Progress
                      value={STAGE_PROGRESS[t.stage]}
                      className="h-2 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Proposal</span>
                      <span>{STAGE_PROGRESS[t.stage]}% complete</span>
                      <span>Approved</span>
                    </div>
                    {t.stageNotes && (
                      <p className="text-xs italic text-muted-foreground mt-1">
                        "{t.stageNotes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Student Summaries ── */}
        <TabsContent value="summary" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            PG student CGPA on 5-point scale (Distinction ≥ 4.50, Merit ≥ 3.50,
            Pass ≥ 2.50)
          </p>
          <div className="space-y-3">
            {studentSummaries.length === 0 ? (
              <Card>
                <CardContent
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="pg_results.summary_empty"
                >
                  No PG student records yet.
                </CardContent>
              </Card>
            ) : (
              studentSummaries.map((s) => {
                const classification = pgClassification(s.cgpa);
                const dept =
                  departments.find((d) => String(d.id) === s.deptId)?.name ??
                  s.deptId;
                return (
                  <Card key={s.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {s.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.programme} — {dept}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {s.cgpa.toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              classification === "Distinction"
                                ? "default"
                                : classification === "Fail"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {classification}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="bg-muted/30 rounded p-2">
                          <p className="font-semibold text-foreground">
                            {s.results.length}
                          </p>
                          <p>Courses</p>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <p className="font-semibold text-foreground">
                            {s.results.reduce((a, r) => a + r.creditUnits, 0)}
                          </p>
                          <p>Credit Units</p>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <p className="font-semibold text-green-600">
                            {s.results.filter((r) => r.isPassed).length}
                          </p>
                          <p>Passed</p>
                        </div>
                      </div>
                      <div className="mt-2 border rounded overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="p-1.5 text-left">Course</th>
                              <th className="p-1.5 text-center">CU</th>
                              <th className="p-1.5 text-center">Total</th>
                              <th className="p-1.5 text-center">Grade</th>
                              <th className="p-1.5 text-center">GP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.results.map((r) => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="p-1.5">
                                  {r.courseCode} — {r.courseTitle}
                                </td>
                                <td className="p-1.5 text-center">
                                  {r.creditUnits}
                                </td>
                                <td className="p-1.5 text-center">{r.total}</td>
                                <td className="p-1.5 text-center">
                                  <span
                                    className={
                                      r.grade === "F"
                                        ? "text-destructive font-bold"
                                        : "font-medium"
                                    }
                                  >
                                    {r.grade}
                                  </span>
                                </td>
                                <td className="p-1.5 text-center">
                                  {r.gradePoint.toFixed(1)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-muted/40 font-semibold">
                              <td className="p-1.5">CGPA</td>
                              <td className="p-1.5 text-center">
                                {s.results.reduce(
                                  (a, r) => a + r.creditUnits,
                                  0,
                                )}
                              </td>
                              <td className="p-1.5 text-center">—</td>
                              <td className="p-1.5 text-center">
                                {classification}
                              </td>
                              <td className="p-1.5 text-center font-bold text-primary">
                                {s.cgpa.toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { loadPGResults };
