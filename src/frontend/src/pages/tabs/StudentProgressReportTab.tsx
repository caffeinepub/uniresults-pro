import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  GraduationCap,
  Printer,
  Search,
  TrendingUp,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calcGradePoint,
  getAcademicStanding,
  getDegreeClassification,
  useApp,
} from "../../context/AppContext";
import type { ExtendedStudent } from "../../context/AppContext";

type StudentWithMatric = ExtendedStudent & {
  matricNumber?: string;
};

function buildProgressData(
  student: ExtendedStudent,
  results: ReturnType<typeof useApp>["results"],
  courses: ReturnType<typeof useApp>["courses"],
) {
  const myResults = results.filter(
    (r) => String(r.studentId) === String(student.id),
  );

  // Group results by level
  const levelMap = new Map<
    string,
    {
      level: string;
      credits: number;
      passedCredits: number;
      tco: number;
      tcp: number;
      tgp: number;
      cgpa: number;
      rows: Array<{
        code: string;
        title: string;
        credit: number;
        ca: number;
        exam: number;
        total: number;
        grade: string;
        gp: number;
        remarks: string;
        isCarryover: boolean;
      }>;
    }
  >();

  for (const r of myResults) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    if (!course) continue;
    const level = String((course as any).level ?? "100");
    if (!levelMap.has(level)) {
      levelMap.set(level, {
        level,
        credits: 0,
        passedCredits: 0,
        tco: 0,
        tcp: 0,
        tgp: 0,
        cgpa: 0,
        rows: [],
      });
    }
    const entry = levelMap.get(level)!;
    const units = Number(course.creditUnits);
    const total = Number(r.caScore ?? 0) + Number(r.examScore ?? 0);
    const { grade, gradePoint, remarks } = calcGradePoint(total);
    const isCarryover = r.grade === "F" && r.status === "published";

    entry.tco += units;
    entry.tcp += units;
    entry.tgp += units * gradePoint;
    if (grade !== "F") entry.passedCredits += units;
    entry.credits += units;
    entry.rows.push({
      code: course.code,
      title: course.name,
      credit: units,
      ca: Number(r.caScore ?? 0),
      exam: Number(r.examScore ?? 0),
      total,
      grade,
      gp: gradePoint,
      remarks,
      isCarryover,
    });
  }

  for (const [, v] of levelMap) {
    v.cgpa = v.tco > 0 ? Number((v.tgp / v.tco).toFixed(2)) : 0;
  }

  const allLevels = Array.from(levelMap.values()).sort(
    (a, b) => Number(a.level) - Number(b.level),
  );

  const totalTCO = allLevels.reduce((s, l) => s + l.tco, 0);
  const _totalTCP = allLevels.reduce((s, l) => s + l.tcp, 0);
  const totalTGP = allLevels.reduce((s, l) => s + l.tgp, 0);
  const cumulativeCGPA =
    totalTCO > 0 ? Number((totalTGP / totalTCO).toFixed(2)) : 0;
  const totalPassedCredits = allLevels.reduce((s, l) => s + l.passedCredits, 0);

  const requiredCredits = student.entryMode === "DE" ? 90 : 120;
  const graduationEligible = totalPassedCredits >= requiredCredits;

  return {
    allLevels,
    cumulativeCGPA,
    totalPassedCredits,
    requiredCredits,
    graduationEligible,
  };
}

export default function StudentProgressReportTab() {
  const {
    students,
    results,
    courses,
    courseRegistrations: _courseRegistrations,
    departments,
    faculties,
    institutionSettings,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return (students as StudentWithMatric[])
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.matricNumber ?? "").toLowerCase().includes(q) ||
          (s.jambRegNo ?? "").toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [search, students]);

  const selectedStudent = useMemo(
    () =>
      selectedStudentId
        ? ((students as StudentWithMatric[]).find(
            (s) => String(s.id) === selectedStudentId,
          ) ?? null)
        : null,
    [selectedStudentId, students],
  );

  const progressData = useMemo(
    () =>
      selectedStudent
        ? buildProgressData(selectedStudent, results, courses)
        : null,
    [selectedStudent, results, courses],
  );

  const dept = departments.find(
    (d) => String(d.id) === String(selectedStudent?.departmentId),
  );
  const faculty = faculties.find(
    (f) => String(f.id) === String(dept?.facultyId),
  );

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Student Progress Report</h2>
        </div>
        {selectedStudent && (
          <Button
            size="sm"
            onClick={handlePrint}
            data-ocid="student_progress.print"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md no-print">
        <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search by name or matric number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedStudentId(null);
          }}
          data-ocid="student_progress.search"
        />
        {searchResults.length > 0 && !selectedStudentId && (
          <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-xl mt-1 shadow-lg overflow-hidden">
            {searchResults.map((s) => (
              <button
                key={String(s.id)}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm border-b border-border last:border-0"
                onClick={() => {
                  setSelectedStudentId(String(s.id));
                  setSearch(s.name);
                }}
                data-ocid="student_progress.student_select"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {s.matricNumber ?? s.jambRegNo}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedStudent && (
        <div className="text-center py-20 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Search and select a student to view their progress report.</p>
        </div>
      )}

      {selectedStudent && progressData && (
        <div className="space-y-6">
          {/* Print header */}
          <div className="print:block hidden">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">{institutionSettings.name}</h1>
              <h2 className="text-base font-semibold">
                STUDENT PROGRESS REPORT
              </h2>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {selectedStudent.photoUrl ? (
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedStudent.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-lg font-bold">{selectedStudent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {dept?.name} &bull; {faculty?.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {(
                [
                  [
                    "Matric No",
                    (selectedStudent as StudentWithMatric).matricNumber ?? "-",
                  ],
                  [
                    "Level",
                    selectedStudent.level ? String(selectedStudent.level) : "-",
                  ],
                  ["Entry Mode", selectedStudent.entryMode ?? "UTME"],
                  ["Status", (selectedStudent.status as string) ?? "Active"],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Graduation Progress */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Graduation Progress</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    Credits Passed: {progressData.totalPassedCredits} /{" "}
                    {progressData.requiredCredits}
                  </span>
                  <span className="font-semibold">
                    {Math.round(
                      (progressData.totalPassedCredits /
                        progressData.requiredCredits) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (progressData.totalPassedCredits /
                      progressData.requiredCredits) *
                    100
                  }
                  className="h-3"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Cumulative CGPA:{" "}
                  </span>
                  <span className="font-bold text-primary">
                    {progressData.cumulativeCGPA.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Classification:{" "}
                  </span>
                  <span className="font-medium">
                    {getDegreeClassification(progressData.cumulativeCGPA)}
                  </span>
                </div>
                <Badge
                  className={
                    getAcademicStanding(progressData.cumulativeCGPA).badgeClass
                  }
                >
                  {getAcademicStanding(progressData.cumulativeCGPA).label}
                </Badge>
              </div>
              {progressData.graduationEligible && (
                <div className="bg-success/10 text-success border border-success/20 rounded-lg p-2 text-sm font-medium">
                  ✓ Meets minimum credit requirement for graduation
                </div>
              )}
            </div>
          </div>

          {/* Per-Level Results */}
          {progressData.allLevels.map((lvl) => (
            <div key={lvl.level} className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Level {lvl.level}</h3>
                <Badge variant="outline" className="text-xs">
                  CGPA: {lvl.cgpa.toFixed(2)}
                </Badge>
                <Badge
                  className={`${getAcademicStanding(lvl.cgpa).badgeClass} text-xs`}
                >
                  {getAcademicStanding(lvl.cgpa).label}
                </Badge>
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-center">Units</TableHead>
                      <TableHead className="text-center">CA</TableHead>
                      <TableHead className="text-center">Exam</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">GP</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lvl.rows.map((row) => (
                      <TableRow
                        key={row.code}
                        className={row.isCarryover ? "bg-destructive/5" : ""}
                      >
                        <TableCell className="font-mono text-xs">
                          {row.code}
                          {row.isCarryover && (
                            <Badge className="ml-1 text-[10px] bg-destructive/20 text-destructive border-0">
                              C/O
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{row.title}</TableCell>
                        <TableCell className="text-center">
                          {row.credit}
                        </TableCell>
                        <TableCell className="text-center">{row.ca}</TableCell>
                        <TableCell className="text-center">
                          {row.exam}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {row.total}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`text-xs ${
                              row.grade === "F"
                                ? "bg-destructive/20 text-destructive border-0"
                                : row.grade === "A"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0"
                                  : "bg-primary/10 text-primary border-0"
                            }`}
                          >
                            {row.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.gp.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-sm">{row.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-xs text-muted-foreground text-right pr-2">
                TCO = {lvl.tco} | TCP = {lvl.tcp} | TGP = {lvl.tgp.toFixed(1)} |
                CGPA = {lvl.cgpa.toFixed(2)}
              </div>
            </div>
          ))}

          {progressData.allLevels.length === 0 && (
            <div
              className="text-center text-muted-foreground py-10"
              data-ocid="student_progress.empty_state"
            >
              No published results found for this student.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
