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
import { GraduationCap, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { getDegreeClassification, useApp } from "../../context/AppContext";
import type { ExtendedStudent } from "../../context/AppContext";

const CLASSIFICATION_COLORS: Record<string, string> = {
  "First Class":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Second Class Upper":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Second Class Lower":
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Third Class": "bg-muted text-muted-foreground",
  Pass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Fail: "bg-destructive/10 text-destructive",
};

function computeCGPA(
  studentId: bigint,
  results: ReturnType<typeof useApp>["results"],
  courses: ReturnType<typeof useApp>["courses"],
): number {
  const published = results.filter(
    (r) =>
      String(r.studentId) === String(studentId) && r.status === "published",
  );
  let tcp = 0;
  let tco = 0;
  for (const r of published) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    const units = course ? Number(course.creditUnits) : 0;
    tco += units;
    tcp += units * (r.gradePoint ?? 0);
  }
  return tco > 0 ? Number((tcp / tco).toFixed(2)) : 0;
}

export default function ConvocationBookletTab() {
  const {
    students,
    results,
    courses,
    departments,
    faculties,
    academicCalendars,
    institutionSettings,
  } = useApp();

  const sessions = useMemo(() => {
    const set = new Set(academicCalendars.map((c) => c.session));
    return Array.from(set).sort().reverse();
  }, [academicCalendars]);

  const [selectedSession, setSelectedSession] = useState(
    sessions[0] ?? new Date().getFullYear().toString(),
  );
  const [filterFaculty, setFilterFaculty] = useState("all");

  // Only include students at final level (400+) with sufficient CGPA
  const graduatingStudents = useMemo(() => {
    return students
      .filter((s) => {
        const lvl = Number(s.level);
        return lvl >= 400;
      })
      .map((s) => {
        const cgpa = computeCGPA(s.id, results, courses);
        const classification = getDegreeClassification(cgpa);
        const dept = departments.find(
          (d) => String(d.id) === String(s.departmentId),
        );
        const faculty = dept
          ? faculties.find((f) => String(f.id) === String(dept.facultyId))
          : undefined;
        return { ...s, cgpa, classification, dept, faculty };
      })
      .filter(
        (s) =>
          s.cgpa >= 1.0 &&
          (filterFaculty === "all" || String(s.faculty?.id) === filterFaculty),
      );
  }, [students, results, courses, departments, faculties, filterFaculty]);

  // Group by faculty > department
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        faculty: string;
        depts: Map<string, typeof graduatingStudents>;
      }
    >();
    for (const s of graduatingStudents) {
      const facName = s.faculty?.name ?? "General";
      const deptName = s.dept?.name ?? "Unknown Department";
      if (!map.has(facName))
        map.set(facName, { faculty: facName, depts: new Map() });
      const facGroup = map.get(facName)!;
      if (!facGroup.depts.has(deptName)) facGroup.depts.set(deptName, []);
      facGroup.depts.get(deptName)!.push(s);
    }
    return map;
  }, [graduatingStudents]);

  function handlePrint() {
    window.print();
  }

  let globalSN = 0;

  return (
    <div className="space-y-4 p-4">
      {/* Controls */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Convocation Booklet</h2>
          <Badge variant="secondary">
            {graduatingStudents.length} graduates
          </Badge>
        </div>
        <Button size="sm" onClick={handlePrint} data-ocid="convocation.print">
          <Printer className="w-4 h-4 mr-1" /> Print Booklet
        </Button>
      </div>

      <div className="flex gap-3 no-print">
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger
            className="w-48"
            data-ocid="convocation.session_select"
          >
            <SelectValue placeholder="Select Session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
          <SelectTrigger
            className="w-48"
            data-ocid="convocation.faculty_filter"
          >
            <SelectValue placeholder="All Faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Faculties</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={String(f.id)} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Print Header */}
      <div className="print-only hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">{institutionSettings.name}</h1>
        <h2 className="text-lg font-semibold mt-1">CONVOCATION BOOKLET</h2>
        <p className="text-sm">{selectedSession} Academic Session</p>
      </div>

      {grouped.size === 0 && (
        <div
          className="text-center text-muted-foreground py-20"
          data-ocid="convocation.empty_state"
        >
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No graduating students found for the selected criteria.</p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([facName, { depts }]) => (
        <div key={facName} className="page-break-after space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <h3 className="font-bold text-primary text-base">{facName}</h3>
          </div>
          {Array.from(depts.entries()).map(([deptName, stds]) => (
            <div key={deptName} className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground pl-2">
                {deptName}
              </h4>
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10">S/N</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Matric No</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>CGPA</TableHead>
                      <TableHead>Classification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stds.map((s, idx) => {
                      globalSN++;
                      return (
                        <TableRow
                          key={String(s.id)}
                          data-ocid={`convocation.student_row.${idx + 1}`}
                        >
                          <TableCell className="text-muted-foreground text-xs">
                            {globalSN}
                          </TableCell>
                          <TableCell className="font-medium">
                            {s.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {(s as ExtendedStudent & { matricNumber?: string })
                              .matricNumber ?? "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.dept?.name}
                          </TableCell>
                          <TableCell className="font-bold">
                            {s.cgpa.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${CLASSIFICATION_COLORS[s.classification] ?? ""}`}
                            >
                              {s.classification}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
