import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Award, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getDegreeClassification,
  getStudentDepartment,
  useApp,
} from "../../context/AppContext";

export default function DeansListTab() {
  const { students, results, courses, departments, institutionSettings } =
    useApp();

  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [threshold, setThreshold] = useState("4.50");

  const thresholdNum = Number.parseFloat(threshold) || 4.5;

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s);
  }, [results]);

  const deansList = useMemo(() => {
    return students
      .map((student) => {
        const dept = getStudentDepartment(student, departments);
        const sr = results.filter(
          (r) =>
            String(r.studentId) === String(student.id) &&
            ["approved", "published"].includes(r.status) &&
            (filterSession === "all" || (r as any).session === filterSession),
        );
        if (sr.length === 0) return null;
        let totalGP = 0;
        let totalCU = 0;
        for (const r of sr) {
          const course = courses.find(
            (c) => String(c.id) === String(r.courseId),
          );
          const cu = course ? Number(course.creditUnits) : 1;
          totalGP += (r.gradePoint ?? 0) * cu;
          totalCU += cu;
        }
        const cgpa =
          totalCU > 0 ? Math.round((totalGP / totalCU) * 100) / 100 : 0;
        if (cgpa < thresholdNum) return null;
        if (filterDept !== "all" && String(dept?.id) !== filterDept)
          return null;
        if (filterLevel !== "all" && String(student.level) !== filterLevel)
          return null;
        const classification = getDegreeClassification(cgpa);
        return { student, dept, cgpa, classification };
      })
      .filter(Boolean) as Array<{
      student: (typeof students)[0];
      dept: ReturnType<typeof getStudentDepartment>;
      cgpa: number;
      classification: string;
    }>;
  }, [
    students,
    results,
    courses,
    departments,
    filterDept,
    filterLevel,
    filterSession,
    thresholdNum,
  ]);

  const session = "2024/2025";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Dean's List / VC's List</h2>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {deansList.length} Students
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-ocid="deans.print.button"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Honor Roll
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="deans-threshold"
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            CGPA Threshold ≥
          </label>
          <Input
            id="deans-threshold"
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-20 h-8 text-xs"
            data-ocid="deans.threshold.input"
          />
        </div>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-36" data-ocid="deans.session.select">
            <SelectValue placeholder="Session" />
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
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48" data-ocid="deans.dept.select">
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
          <SelectTrigger className="w-32" data-ocid="deans.level.select">
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

      <Card className="print-card">
        <CardHeader className="print-header">
          <CardTitle className="text-center text-base">
            {institutionSettings.name ?? "Institution"} — DEAN'S LIST
          </CardTitle>
          <p className="text-center text-xs text-muted-foreground">
            Session: {filterSession === "all" ? session : filterSession} | CGPA
            ≥ {thresholdNum.toFixed(2)}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {deansList.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="deans.empty_state"
            >
              No students meet the CGPA threshold for this filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deansList
                  .sort((a, b) => b.cgpa - a.cgpa)
                  .map(({ student, dept, cgpa, classification }, idx) => (
                    <TableRow
                      key={String(student.id)}
                      data-ocid={`deans.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {(student as any).matricNo ||
                          (student as any).regNo ||
                          "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {dept?.name ?? "—"}
                      </TableCell>
                      <TableCell>{student.level}</TableCell>
                      <TableCell>
                        <span className="font-bold text-yellow-700">
                          {cgpa.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                          {classification}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
