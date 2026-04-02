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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, GraduationCap, Printer, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import PassFailListReport from "../../components/PassFailListReport";
import {
  getDegreeClassification,
  getStudentDepartment,
  useApp,
} from "../../context/AppContext";

export default function PassFailGraduatingTab() {
  const { students, results, courses, departments, graduationRequirements } =
    useApp();

  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSession, setFilterSession] = useState("2024/2025");
  const [filterSemester, setFilterSemester] = useState("all");

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s);
  }, [results]);

  // Graduating list
  const graduatingList = useMemo(() => {
    return students
      .map((student) => {
        const dept = getStudentDepartment(student, departments);
        if (filterDept !== "all" && String(dept?.id) !== filterDept)
          return null;
        if (filterLevel !== "all" && String(student.level) !== filterLevel)
          return null;
        const allResults = results.filter(
          (r) =>
            String(r.studentId) === String(student.id) &&
            ["approved", "published"].includes(r.status),
        );
        if (allResults.length === 0) return null;
        const minCreds =
          student.entryMode === "DE"
            ? (graduationRequirements[0]?.minCreditUnits ?? 90)
            : (graduationRequirements[0]?.minCreditUnits ?? 120);
        let totalGP = 0;
        let totalCU = 0;
        let creditsPassed = 0;
        for (const r of allResults) {
          const course = courses.find(
            (c) => String(c.id) === String(r.courseId),
          );
          const cu = course ? Number(course.creditUnits) : 1;
          totalGP += (r.gradePoint ?? 0) * cu;
          totalCU += cu;
          if (r.grade !== "F") creditsPassed += cu;
        }
        const cgpa = totalCU > 0 ? totalGP / totalCU : 0;
        if (creditsPassed < minCreds) return null;
        const classification = getDegreeClassification(cgpa);
        return {
          student,
          dept,
          cgpa: cgpa.toFixed(2),
          classification,
          creditsPassed,
        };
      })
      .filter(Boolean) as Array<{
      student: (typeof students)[0];
      dept: ReturnType<typeof getStudentDepartment>;
      cgpa: string;
      classification: string;
      creditsPassed: number;
    }>;
  }, [
    students,
    results,
    courses,
    departments,
    graduationRequirements,
    filterDept,
    filterLevel,
  ]);

  const graduatingFilterBar = (
    <div className="flex flex-wrap gap-3 mb-4 no-print">
      <Select value={filterSession} onValueChange={setFilterSession}>
        <SelectTrigger className="w-36" data-ocid="pfg.session.select">
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
      <Select value={filterSemester} onValueChange={setFilterSemester}>
        <SelectTrigger className="w-36" data-ocid="pfg.semester.select">
          <SelectValue placeholder="Semester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Semesters</SelectItem>
          <SelectItem value="First">First Semester</SelectItem>
          <SelectItem value="Second">Second Semester</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterDept} onValueChange={setFilterDept}>
        <SelectTrigger className="w-48" data-ocid="pfg.dept.select">
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
        <SelectTrigger className="w-32" data-ocid="pfg.level.select">
          <SelectValue placeholder="Level" />
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
      <Button
        variant="outline"
        size="sm"
        data-ocid="pfg.print.button"
        onClick={() => window.print()}
      >
        <Printer className="w-3.5 h-3.5 mr-1.5" />
        Print
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pass">
        <TabsList className="no-print flex-wrap h-auto gap-1">
          <TabsTrigger value="pass" data-ocid="pfg.pass.tab">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            Pass List
          </TabsTrigger>
          <TabsTrigger value="fail" data-ocid="pfg.fail.tab">
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            Failure List
          </TabsTrigger>
          <TabsTrigger value="graduating" data-ocid="pfg.graduating.tab">
            <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Graduating List
            <Badge className="ml-1.5 bg-blue-100 text-blue-800 text-[10px] border-blue-300">
              {graduatingList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Pass List – Official Format ── */}
        <TabsContent value="pass" className="pt-4">
          <Card>
            <CardContent className="pt-4">
              <PassFailListReport listType="pass" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Failure List – Official Format ── */}
        <TabsContent value="fail" className="pt-4">
          <Card>
            <CardContent className="pt-4">
              <PassFailListReport listType="fail" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Graduating List ── */}
        <TabsContent value="graduating" className="pt-4">
          {graduatingFilterBar}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Graduating List — Eligible Students ({graduatingList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {graduatingList.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="pfg.graduating.empty_state"
                >
                  No eligible graduating students found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Matric No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>CGPA</TableHead>
                      <TableHead>Credits Passed</TableHead>
                      <TableHead>Classification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {graduatingList
                      .sort((a, b) => Number(b.cgpa) - Number(a.cgpa))
                      .map(
                        (
                          {
                            student,
                            dept,
                            cgpa,
                            classification,
                            creditsPassed,
                          },
                          idx,
                        ) => (
                          <TableRow
                            key={String(student.id)}
                            data-ocid={`pfg.graduating.item.${idx + 1}`}
                          >
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {(student as any).matricNo ||
                                (student as any).regNo ||
                                "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.name}
                            </TableCell>
                            <TableCell className="text-xs">
                              {dept?.name}
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">
                                {cgpa}
                              </span>
                            </TableCell>
                            <TableCell>{creditsPassed}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {classification}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
