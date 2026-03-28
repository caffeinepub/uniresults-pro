import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, LayoutGrid, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";

export default function GradeSheetTab() {
  const { departments, students, results, courses, institutionSettings } =
    useApp();

  const [filterDept, setFilterDept] = useState("");
  const [filterLevel, setFilterLevel] = useState("100");
  const [filterSession, setFilterSession] = useState("2024/2025");
  const [filterSemester, setFilterSemester] = useState("First");

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s);
  }, [results]);

  const { pivotStudents, pivotCourses } = useMemo(() => {
    if (!filterDept) return { pivotStudents: [], pivotCourses: [] };

    const deptStudents = students.filter(
      (s) =>
        String(s.departmentId) === filterDept &&
        String(s.level) === filterLevel,
    );

    const deptCourses = courses.filter(
      (c) =>
        (String((c as any).departmentId) === filterDept &&
          (c.code.match(/\d+/)
            ? `${c.code.match(/\d+/)?.[0]?.charAt(0)}00`
            : "") === filterLevel) ||
        !c.code.match(/\d+/),
    );

    return { pivotStudents: deptStudents, pivotCourses: deptCourses };
  }, [students, courses, filterDept, filterLevel]);

  function getGrade(studentId: bigint, courseId: bigint): string {
    const r = results.find(
      (r) =>
        String(r.studentId) === String(studentId) &&
        String(r.courseId) === String(courseId) &&
        ["approved", "published"].includes(r.status),
    );
    return r ? r.grade : "—";
  }

  function getGPA(studentId: bigint): string {
    const sr = results.filter(
      (r) =>
        String(r.studentId) === String(studentId) &&
        ["approved", "published"].includes(r.status),
    );
    if (sr.length === 0) return "—";
    let totalGP = 0;
    let totalCU = 0;
    for (const r of sr) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const cu = course ? Number(course.creditUnits) : 1;
      totalGP += (r.gradePoint ?? 0) * cu;
      totalCU += cu;
    }
    return (totalGP / totalCU).toFixed(2);
  }

  function getTotalCredits(studentId: bigint): number {
    return results
      .filter(
        (r) =>
          String(r.studentId) === String(studentId) &&
          ["approved", "published"].includes(r.status) &&
          r.grade !== "F",
      )
      .reduce((sum, r) => {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        return sum + Number(course?.creditUnits ?? 1);
      }, 0);
  }

  function exportCSV() {
    const dept = departments.find((d) => String(d.id) === filterDept);
    const headers = [
      "S/N",
      "Matric No",
      "Name",
      ...pivotCourses.map((c) => c.code),
      "GPA",
      "Total Credits",
    ];
    const lines = pivotStudents.map((s, i) => [
      i + 1,
      (s as any).matricNo || (s as any).regNo || "—",
      s.name,
      ...pivotCourses.map((c) => getGrade(s.id, c.id)),
      getGPA(s.id),
      getTotalCredits(s.id),
    ]);
    const blob = new Blob(
      [[headers.join(","), ...lines.map((l) => l.join(","))].join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grade_sheet_${dept?.name ?? "dept"}_${filterLevel}L_${filterSession}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedDept = departments.find((d) => String(d.id) === filterDept);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Grade Sheet Summary</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="gradesheet.export.button"
            onClick={exportCSV}
            disabled={!filterDept}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-ocid="gradesheet.print.button"
            onClick={() => window.print()}
            disabled={!filterDept}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-52" data-ocid="gradesheet.dept.select">
            <SelectValue placeholder="Select Department..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-32" data-ocid="gradesheet.level.select">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {["100", "200", "300", "400", "500", "600"].map((l) => (
              <SelectItem key={l} value={l}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-36" data-ocid="gradesheet.session.select">
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
          <SelectTrigger
            className="w-36"
            data-ocid="gradesheet.semester.select"
          >
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="First">First Semester</SelectItem>
            <SelectItem value="Second">Second Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filterDept ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="gradesheet.empty_state"
        >
          Select a department to view the grade sheet.
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-center text-sm uppercase">
              {institutionSettings.name ?? "Institution"} — GRADE SHEET
            </CardTitle>
            <p className="text-center text-xs text-muted-foreground">
              Department: {selectedDept?.name} | Level {filterLevel} | Session:
              {filterSession} | {filterSemester} Semester
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {pivotStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No students found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-2 py-1.5 text-left">
                        S/N
                      </th>
                      <th className="border border-border px-2 py-1.5 text-left">
                        Matric No
                      </th>
                      <th className="border border-border px-2 py-1.5 text-left min-w-32">
                        Name
                      </th>
                      {pivotCourses.map((c) => (
                        <th
                          key={String(c.id)}
                          className="border border-border px-1 py-1.5 text-center min-w-12"
                          title={c.name}
                        >
                          {c.code}
                        </th>
                      ))}
                      <th className="border border-border px-2 py-1.5 text-center">
                        GPA
                      </th>
                      <th className="border border-border px-2 py-1.5 text-center">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivotStudents.map((s, idx) => (
                      <tr
                        key={String(s.id)}
                        className="hover:bg-muted/30"
                        data-ocid={`gradesheet.item.${idx + 1}`}
                      >
                        <td className="border border-border px-2 py-1">
                          {idx + 1}
                        </td>
                        <td className="border border-border px-2 py-1 font-mono">
                          {(s as any).matricNo || (s as any).regNo || "—"}
                        </td>
                        <td className="border border-border px-2 py-1">
                          {s.name}
                        </td>
                        {pivotCourses.map((c) => {
                          const grade = getGrade(s.id, c.id);
                          return (
                            <td
                              key={String(c.id)}
                              className={`border border-border px-1 py-1 text-center font-semibold ${
                                grade === "F"
                                  ? "bg-red-50 text-red-700"
                                  : grade === "A"
                                    ? "bg-green-50 text-green-700"
                                    : ""
                              }`}
                            >
                              {grade}
                            </td>
                          );
                        })}
                        <td className="border border-border px-2 py-1 text-center font-bold">
                          {getGPA(s.id)}
                        </td>
                        <td className="border border-border px-2 py-1 text-center">
                          {getTotalCredits(s.id)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
