import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { getStudentDepartment, useApp } from "../../context/AppContext";

export default function StudentResultSlipTab() {
  const {
    currentUser,
    students,
    results,
    courses,
    departments,
    institutionSettings,
  } = useApp();

  const student = students.find(
    (s) =>
      (s as any).matricNo === (currentUser as any)?.matricNo ||
      String(s.id) === String((currentUser as any)?.studentId),
  );

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results.filter(
      (r) => String(r.studentId) === String(student?.id),
    )) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s);
  }, [results, student]);

  const [filterSession, setFilterSession] = useState(
    sessions[0] ?? "2024/2025",
  );
  const [filterSemester, setFilterSemester] = useState("First");

  const slipResults = useMemo(() => {
    if (!student) return [];
    return results
      .filter(
        (r) =>
          String(r.studentId) === String(student.id) &&
          ["approved", "published"].includes(r.status) &&
          ((r as any).session === filterSession || filterSession === "all") &&
          ((r as any).semester === filterSession ||
            (r as any).semester === filterSemester ||
            !filterSemester),
      )
      .map((r) => ({
        r,
        course: courses.find((c) => String(c.id) === String(r.courseId)),
      }))
      .filter(({ course }) => course != null);
  }, [results, student, courses, filterSession, filterSemester]);

  const gpa = useMemo(() => {
    let totalGP = 0;
    let totalCU = 0;
    for (const { r, course } of slipResults) {
      const cu = course ? Number(course.creditUnits) : 1;
      totalGP += (r.gradePoint ?? 0) * cu;
      totalCU += cu;
    }
    return totalCU > 0 ? (totalGP / totalCU).toFixed(2) : "—";
  }, [slipResults]);

  const totalCredits = slipResults.reduce((sum, { course }) => {
    return sum + Number(course?.creditUnits ?? 1);
  }, 0);

  const dept = student ? getStudentDepartment(student, departments) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 no-print">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Result Slip</h2>
      </div>

      <div className="flex flex-wrap gap-3 no-print">
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-40" data-ocid="slip.session.select">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            {[...sessions, "2024/2025"]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="w-36" data-ocid="slip.semester.select">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="First">First Semester</SelectItem>
            <SelectItem value="Second">Second Semester</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          data-ocid="slip.print.button"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Slip
        </Button>
      </div>

      {/* Printable Slip */}
      <Card className="max-w-2xl mx-auto border-2">
        <CardHeader className="text-center border-b pb-4">
          <h3 className="font-bold text-base uppercase">
            {institutionSettings.name ?? "Institution"}
          </h3>
          <p className="text-xs text-muted-foreground">SEMESTER RESULT SLIP</p>
          <p className="text-xs">
            Session: {filterSession} | Semester: {filterSemester}
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-semibold">{student?.name ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Matric No: </span>
              <span className="font-semibold font-mono">
                {(student as any)?.matricNo || (student as any)?.regNo || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Department: </span>
              <span className="font-semibold">{dept?.name ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Level: </span>
              <span className="font-semibold">{student?.level}</span>
            </div>
          </div>

          {slipResults.length === 0 ? (
            <div
              className="text-center py-6 text-muted-foreground text-sm"
              data-ocid="slip.empty_state"
            >
              No published results for this semester/session.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Course Title</TableHead>
                  <TableHead className="text-xs">CU</TableHead>
                  <TableHead className="text-xs">CA</TableHead>
                  <TableHead className="text-xs">Exam</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slipResults.map(({ r, course }, idx) => (
                  <TableRow
                    key={String(r.id)}
                    data-ocid={`slip.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {course?.code}
                    </TableCell>
                    <TableCell className="text-xs">{course?.name}</TableCell>
                    <TableCell className="text-xs">
                      {course?.creditUnits}
                    </TableCell>
                    <TableCell className="text-xs">{r.caScore}</TableCell>
                    <TableCell className="text-xs">{r.examScore}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      {r.totalScore}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-bold ${
                          r.grade === "A"
                            ? "text-green-600"
                            : r.grade === "F"
                              ? "text-red-600"
                              : "text-foreground"
                        }`}
                      >
                        {r.grade}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-between items-center border-t pt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Total Credits: </span>
              <span className="font-semibold">{totalCredits}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Semester GPA: </span>
              <span className="font-bold text-primary">{gpa}</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground italic border-t pt-2">
            This is not an official transcript. For official purposes, request a
            transcript from the Registrar's office.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
