import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertOctagon, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";

interface CarryoverRow {
  studentId: string;
  studentName: string;
  matricNo: string;
  deptName: string;
  level: string | number;
  courseCode: string;
  courseTitle: string;
  timesFailed: number;
  isSpilloverRisk: boolean;
}

export default function CarryoverReportTab() {
  const { students, results, courses, departments, currentUser } = useApp();

  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const hodDeptId = (currentUser as any)?.departmentId;

  const rows = useMemo((): CarryoverRow[] => {
    // Group failures by student + course
    const failMap: Record<string, { count: number; info: CarryoverRow }> = {};
    for (const r of results) {
      if (r.grade !== "F" && r.gradePoint !== 0) continue;
      const student = students.find(
        (s) => String(s.id) === String(r.studentId),
      );
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const dept = departments.find(
        (d) => String(d.id) === String(student?.departmentId),
      );
      if (!student || !course) continue;
      if (currentUser?.role === "HOD" && hodDeptId) {
        if (String(dept?.id) !== String(hodDeptId)) continue;
      }
      if (filterDept !== "all" && String(dept?.id) !== filterDept) continue;
      if (filterLevel !== "all" && String(student.level) !== filterLevel)
        continue;

      const key = `${String(r.studentId)}__${String(r.courseId)}`;
      if (failMap[key]) {
        failMap[key].count++;
        failMap[key].info.timesFailed++;
        failMap[key].info.isSpilloverRisk = failMap[key].count >= 3;
      } else {
        failMap[key] = {
          count: 1,
          info: {
            studentId: String(student.id),
            studentName: student.name,
            matricNo:
              (student as any).matricNo || (student as any).regNo || "—",
            deptName: dept?.name ?? "—",
            level: String(student.level ?? "—"),
            courseCode: course.code,
            courseTitle: course.name,
            timesFailed: 1,
            isSpilloverRisk: false,
          },
        };
      }
    }
    return Object.values(failMap)
      .map((v) => v.info)
      .sort((a, b) => b.timesFailed - a.timesFailed);
  }, [
    results,
    students,
    courses,
    departments,
    filterDept,
    filterLevel,
    currentUser,
    hodDeptId,
  ]);

  const spilloverCount = rows.filter((r) => r.isSpilloverRisk).length;
  const uniqueStudents = new Set(rows.map((r) => r.studentId)).size;

  function exportCSV() {
    const headers = [
      "Matric No",
      "Name",
      "Department",
      "Level",
      "Course Code",
      "Course Title",
      "Times Failed",
      "Risk",
    ];
    const lines = rows.map((r) =>
      [
        r.matricNo,
        r.studentName,
        r.deptName,
        r.level,
        r.courseCode,
        r.courseTitle,
        r.timesFailed,
        r.isSpilloverRisk ? "Spillover Risk" : "",
      ].join(","),
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carryover_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Carryover Tracking Report</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="carryover.export.button"
            onClick={exportCSV}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-ocid="carryover.print.button"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{uniqueStudents}</div>
            <div className="text-xs text-muted-foreground">
              Students with Carryovers
            </div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{rows.length}</div>
            <div className="text-xs text-muted-foreground">
              Total Carryover Courses
            </div>
          </CardContent>
        </Card>
        <Card className="text-center border-orange-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-orange-600">
              {spilloverCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Spillover Risk (3+ failures)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {currentUser?.role !== "HOD" && (
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48" data-ocid="carryover.dept.select">
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
        )}
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-32" data-ocid="carryover.level.select">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {["100", "200", "300", "400", "500", "600"].map((l) => (
              <SelectItem key={l} value={l}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="carryover.empty_state"
            >
              No carryover records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matric No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Times Failed</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={`${row.studentId}_${row.courseCode}`}
                      data-ocid={`carryover.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {row.matricNo}
                      </TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell className="text-xs">{row.deptName}</TableCell>
                      <TableCell>{row.level}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {row.courseCode}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.courseTitle}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.timesFailed >= 2 ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {row.timesFailed}×
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.isSpilloverRisk ? (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            <AlertOctagon className="w-3 h-3 mr-1" />
                            Spillover Risk
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
