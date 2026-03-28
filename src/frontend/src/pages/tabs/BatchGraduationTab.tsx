import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useInstitutionConfig } from "@/hooks/useInstitutionConfig";
import { CheckCircle, Download, GraduationCap, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getDegreeClassification,
  getStudentDepartment,
  useApp,
} from "../../context/AppContext";
import GraduationCertificateModal from "./GraduationCertificateModal";

// FINAL_LEVELS is now derived from config

export default function BatchGraduationTab() {
  const {
    students,
    results,
    courses,
    departments,
    academicCalendars,
    graduationRequirements,
    updateStudent,
    logAudit,
    currentUser,
    graduationApplications,
  } = useApp();
  const _instConfig = useInstitutionConfig();
  // Final levels: numeric levels >= 400 for university, or last 2 levels for other types
  const FINAL_LEVELS = _instConfig.levels
    .map((l) => Number(l))
    .filter((n) => !Number.isNaN(n) && n >= 400);
  // If no numeric levels (e.g. polytechnic has ND1/ND2/HND1/HND2), use last 2 string levels
  const FINAL_LEVEL_STRINGS =
    FINAL_LEVELS.length > 0
      ? FINAL_LEVELS.map(String)
      : _instConfig.levels.slice(-2);

  const [filterSession, setFilterSession] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [certStudent, setCertStudent] = useState<any | null>(null);
  const [certOpen, setCertOpen] = useState(false);

  const sessions = useMemo(
    () =>
      [...new Set(academicCalendars.map((c) => c.session))].sort().reverse(),
    [academicCalendars],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: FINAL_LEVELS/FINAL_LEVEL_STRINGS are stable
  const finalLevelStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status === "Graduated") return false;
      const lvl = Number(s.level);
      if (
        FINAL_LEVELS.length > 0 &&
        !FINAL_LEVELS.includes(lvl) &&
        !FINAL_LEVEL_STRINGS.includes(String(s.level))
      )
        return false;
      if (
        FINAL_LEVELS.length === 0 &&
        !FINAL_LEVEL_STRINGS.includes(String(s.level))
      )
        return false;
      if (filterLevel !== "all" && String(lvl) !== filterLevel) return false;
      if (filterDept !== "all" && String(s.departmentId) !== filterDept)
        return false;
      return true;
    });
  }, [students, filterLevel, filterDept]);

  const processed = useMemo(() => {
    function getRequirements(deptId: string, studentEntryMode?: string) {
      const deptReq = graduationRequirements.find(
        (r) => r.departmentId === deptId,
      );
      const defaultReq = graduationRequirements.find(
        (r) => r.departmentId === "all",
      );
      const base = deptReq ||
        defaultReq || {
          minCreditUnits: 120,
          maxCreditUnits: 180,
          minCGPA: 1.0,
        };
      // Adjust for entry mode
      if (studentEntryMode === "DE") {
        return { ...base, minCreditUnits: Math.min(base.minCreditUnits, 90) };
      }
      return base;
    }

    function calcStudentCGPA(studentId: string) {
      const sr = results.filter(
        (r) =>
          String(r.studentId) === studentId &&
          ["approved", "published"].includes(r.status),
      );
      let totalGP = 0;
      let totalCU = 0;
      for (const r of sr) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        const cu = course ? Number(course.creditUnits) : 1;
        totalGP += (r.gradePoint ?? 0) * cu;
        totalCU += cu;
      }
      return totalCU > 0 ? Math.round((totalGP / totalCU) * 100) / 100 : 0;
    }

    function calcTotalCredits(studentId: string) {
      const sr = results.filter(
        (r) =>
          String(r.studentId) === studentId &&
          ["approved", "published"].includes(r.status) &&
          r.grade !== "F",
      );
      let total = 0;
      for (const r of sr) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        total += course ? Number(course.creditUnits) : 0;
      }
      return total;
    }

    function getFailedCourses(studentId: string) {
      return results.filter(
        (r) =>
          String(r.studentId) === studentId &&
          ["approved", "published"].includes(r.status) &&
          r.grade === "F",
      );
    }

    function hasClearance(studentId: string) {
      const app = graduationApplications.find(
        (a) => String(a.studentId) === studentId,
      );
      return app?.status === "approved";
    }

    return finalLevelStudents.map((s) => {
      const sid = String(s.id);
      const dept = getStudentDepartment(s, departments);
      const deptId = dept ? String(dept.id) : "all";
      const req = getRequirements(deptId, (s as any).entryMode ?? "UTME");
      const cgpa = calcStudentCGPA(sid);
      const totalCredits = calcTotalCredits(sid);
      const failedCourses = getFailedCourses(sid);
      const clearance = hasClearance(sid);
      const reasons: string[] = [];
      if (totalCredits < req.minCreditUnits)
        reasons.push(
          `Insufficient credits (${totalCredits}/${req.minCreditUnits})`,
        );
      if (cgpa < req.minCGPA)
        reasons.push(`CGPA too low (${cgpa.toFixed(2)} < ${req.minCGPA})`);
      if (failedCourses.length > 0)
        reasons.push(`Has ${failedCourses.length} outstanding F course(s)`);
      const eligible = reasons.length === 0;
      return {
        student: s,
        cgpa,
        totalCredits,
        failedCourses,
        eligible,
        reasons,
        clearance,
        dept,
      };
    });
  }, [
    finalLevelStudents,
    results,
    courses,
    departments,
    graduationRequirements,
    graduationApplications,
  ]);

  const eligible = processed.filter((p) => p.eligible);
  const ineligible = processed.filter((p) => !p.eligible);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((e) => String(e.student.id))));
    }
  }

  function handleGraduate() {
    if (selected.size === 0) {
      toast.error("Select at least one student");
      return;
    }
    for (const id of selected) {
      updateStudent(BigInt(id), { status: "Graduated" });
    }
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Batch Graduation",
      `Graduated ${selected.size} student(s)`,
    );
    toast.success(`${selected.size} student(s) graduated successfully`);
    setSelected(new Set());
  }

  function exportCSV() {
    const rows = [
      [
        "S/No",
        "Matric No",
        "Name",
        "Department",
        "Level",
        "CGPA",
        "Degree Class",
        "Eligible",
      ],
      ...processed.map((p, i) => [
        i + 1,
        p.student.matricNumber,
        p.student.name,
        p.dept?.name ?? "",
        p.student.level,
        p.cgpa.toFixed(2),
        getDegreeClassification(p.cgpa),
        p.eligible ? "Yes" : `No: ${p.reasons.join("; ")}`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graduation-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Batch Graduation Processing</h2>
          <p className="text-sm text-muted-foreground">
            Review and graduate eligible final-year students (Level 400–600)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-ocid="batch_grad.export_button"
          onClick={exportCSV}
        >
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48" data-ocid="batch_grad.dept.select">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-32" data-ocid="batch_grad.level.select">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {_instConfig.levelLabel}s</SelectItem>
            {(FINAL_LEVELS.length > 0
              ? FINAL_LEVELS.map(String)
              : FINAL_LEVEL_STRINGS
            ).map((l) => (
              <SelectItem key={l} value={l}>
                {_instConfig.levelLabel} {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-40" data-ocid="batch_grad.session.select">
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Eligible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-success">
            <CheckCircle className="inline w-4 h-4 mr-1" />
            Eligible Students ({eligible.length})
          </h3>
          {selected.size > 0 && (
            <Button
              size="sm"
              data-ocid="batch_grad.graduate_button"
              onClick={handleGraduate}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Graduate Selected ({selected.size})
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selected.size === eligible.length && eligible.length > 0
                    }
                    onCheckedChange={toggleAll}
                    data-ocid="batch_grad.select_all.checkbox"
                  />
                </TableHead>
                <TableHead>S/No</TableHead>
                <TableHead>Matric No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Total Credits</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>Degree Class</TableHead>
                <TableHead>Clearance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="batch_grad.eligible.empty_state"
                  >
                    No eligible students found with current filters.
                  </TableCell>
                </TableRow>
              ) : (
                eligible.map((p, i) => (
                  <TableRow
                    key={String(p.student.id)}
                    data-ocid={`batch_grad.eligible.item.${i + 1}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(String(p.student.id))}
                        onCheckedChange={() =>
                          toggleSelect(String(p.student.id))
                        }
                        data-ocid={`batch_grad.checkbox.${i + 1}`}
                      />
                    </TableCell>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.student.matricNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.student.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.dept?.name ?? "—"}
                    </TableCell>
                    <TableCell>{p.student.level}</TableCell>
                    <TableCell>{p.totalCredits}</TableCell>
                    <TableCell className="font-semibold">
                      {p.cgpa.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getDegreeClassification(p.cgpa)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.clearance ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {p.clearance ? "Cleared" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`batch_grad.cert.button.${i + 1}`}
                        onClick={() => {
                          setCertStudent(p.student);
                          setCertOpen(true);
                        }}
                        className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                      >
                        🎓 Certificate
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {certStudent && (
        <GraduationCertificateModal
          student={certStudent}
          open={certOpen}
          onClose={() => {
            setCertOpen(false);
            setCertStudent(null);
          }}
        />
      )}

      {/* Ineligible */}
      {ineligible.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-destructive">
            <XCircle className="inline w-4 h-4 mr-1" />
            Ineligible Students ({ineligible.length})
          </h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/No</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Reason(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ineligible.map((p, i) => (
                  <TableRow
                    key={String(p.student.id)}
                    data-ocid={`batch_grad.ineligible.item.${i + 1}`}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.student.matricNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.student.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.dept?.name ?? "—"}
                    </TableCell>
                    <TableCell>{p.student.level}</TableCell>
                    <TableCell>{p.cgpa.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-destructive">
                      {p.reasons.join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
