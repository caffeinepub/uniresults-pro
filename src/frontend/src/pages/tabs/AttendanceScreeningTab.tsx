import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Download, Printer, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

const THRESHOLD = 75;

export default function AttendanceScreeningTab() {
  const {
    courses,
    students,
    attendanceSessions,
    departments,
    academicCalendars,
    courseRegistrations,
  } = useApp();
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSession, setFilterSession] = useState("all");

  const sessions = useMemo(
    () =>
      [...new Set(academicCalendars.map((c) => c.session))].sort().reverse(),
    [academicCalendars],
  );
  const levels = ["100", "200", "300", "400", "500", "600"];

  const records = useMemo(() => {
    const out: {
      student: (typeof students)[0];
      course: (typeof courses)[0];
      dept: string;
      totalClasses: number;
      attended: number;
      pct: number;
    }[] = [];
    for (const reg of courseRegistrations) {
      const student = students.find(
        (s) => String(s.id) === String(reg.studentId),
      );
      const course = courses.find((c) => String(c.id) === String(reg.courseId));
      if (!student || !course) continue;
      if (filterDept !== "all" && String(student.departmentId) !== filterDept)
        continue;
      if (filterLevel !== "all" && String(student.level) !== filterLevel)
        continue;
      if (filterCourse !== "all" && String(course.id) !== filterCourse)
        continue;
      if (filterSession !== "all" && !reg.semester.includes(filterSession))
        continue;
      const courseSessions = attendanceSessions.filter(
        (as_) => String(as_.courseId) === String(course.id),
      );
      const totalClasses = courseSessions.length;
      const attended = courseSessions.filter((as_) =>
        as_.records.some(
          (r) => String(r.studentId) === String(student.id) && r.present,
        ),
      ).length;
      const pct =
        totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;
      const dept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      out.push({
        student,
        course,
        dept: dept?.name ?? "Unknown",
        totalClasses,
        attended,
        pct,
      });
    }
    return out;
  }, [
    courseRegistrations,
    students,
    courses,
    attendanceSessions,
    departments,
    filterCourse,
    filterDept,
    filterLevel,
    filterSession,
  ]);

  const ineligible = records.filter(
    (r) => r.totalClasses > 0 && r.pct < THRESHOLD,
  );
  const eligible = records.filter(
    (r) => r.totalClasses === 0 || r.pct >= THRESHOLD,
  );

  function handleExportCSV() {
    const rows = records.map((r, i) =>
      [
        i + 1,
        r.student.matricNumber,
        r.student.name,
        r.course.code,
        r.totalClasses,
        r.attended,
        r.totalClasses > 0 ? `${r.pct}%` : "N/A",
        r.totalClasses > 0 && r.pct < THRESHOLD ? "Ineligible" : "Eligible",
      ].join(","),
    );
    const csv = `S/N,Matric No,Name,Course,Total Classes,Attended,Attendance %,Status\n${rows.join("\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "attendance_screening.csv";
    a.click();
    toast.success("Exported");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Attendance
            Screening
          </h1>
          <p className="text-sm text-muted-foreground">
            Students below {THRESHOLD}% attendance are ineligible for
            examinations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            data-ocid="attendance_screening.export_button"
          >
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="attendance_screening.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: records.length, cls: "" },
          {
            label: "Eligible (≥75%)",
            val: eligible.length,
            cls: "text-green-600",
          },
          {
            label: "Ineligible (<75%)",
            val: ineligible.length,
            cls: "text-destructive",
          },
          {
            label: "No Records",
            val: records.filter((r) => r.totalClasses === 0).length,
            cls: "text-muted-foreground",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger
            className="w-44 text-xs"
            data-ocid="attendance_screening.dept.select"
          >
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
          <SelectTrigger
            className="w-32 text-xs"
            data-ocid="attendance_screening.level.select"
          >
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger
            className="w-36 text-xs"
            data-ocid="attendance_screening.session.select"
          >
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
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger
            className="w-44 text-xs"
            data-ocid="attendance_screening.course.select"
          >
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={String(c.id)} value={String(c.id)}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Matric No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Attended</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-10"
                    data-ocid="attendance_screening.empty_state"
                  >
                    No attendance records found. Mark attendance sessions first.
                  </TableCell>
                </TableRow>
              )}
              {records.map((r, i) => {
                const isIneligible = r.totalClasses > 0 && r.pct < THRESHOLD;
                return (
                  <TableRow
                    key={`${r.student.id}-${r.course.id}`}
                    className={isIneligible ? "bg-destructive/5" : ""}
                    data-ocid={`attendance_screening.row.${i + 1}`}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.student.matricNumber}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {r.student.name}
                    </TableCell>
                    <TableCell className="text-xs">{r.dept}</TableCell>
                    <TableCell className="text-xs">{r.course.code}</TableCell>
                    <TableCell className="text-center">
                      {r.totalClasses}
                    </TableCell>
                    <TableCell className="text-center">{r.attended}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-semibold ${r.totalClasses === 0 ? "text-muted-foreground" : isIneligible ? "text-destructive" : "text-green-600"}`}
                      >
                        {r.totalClasses > 0 ? `${r.pct}%` : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.totalClasses === 0 ? (
                        <Badge variant="outline" className="text-xs">
                          No Data
                        </Badge>
                      ) : isIneligible ? (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          Ineligible
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Eligible
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
