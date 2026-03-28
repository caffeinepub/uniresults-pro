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

  // Pass list
  const passList = useMemo(() => {
    return students
      .map((student) => {
        const dept = getStudentDepartment(student, departments);
        if (filterDept !== "all" && String(dept?.id) !== filterDept)
          return null;
        if (filterLevel !== "all" && String(student.level) !== filterLevel)
          return null;
        const sr = results.filter(
          (r) =>
            String(r.studentId) === String(student.id) &&
            ["approved", "published"].includes(r.status) &&
            (filterSession === "all" || (r as any).session === filterSession) &&
            (filterSemester === "all" ||
              (r as any).semester === filterSemester),
        );
        if (sr.length === 0) return null;
        if (!sr.every((r) => r.grade !== "F")) return null;
        return { student, dept };
      })
      .filter(Boolean) as Array<{
      student: (typeof students)[0];
      dept: ReturnType<typeof getStudentDepartment>;
    }>;
  }, [
    students,
    results,
    departments,
    filterDept,
    filterLevel,
    filterSession,
    filterSemester,
  ]);

  // Fail list
  const failList = useMemo(() => {
    return students
      .map((student) => {
        const dept = getStudentDepartment(student, departments);
        if (filterDept !== "all" && String(dept?.id) !== filterDept)
          return null;
        if (filterLevel !== "all" && String(student.level) !== filterLevel)
          return null;
        const sr = results.filter(
          (r) =>
            String(r.studentId) === String(student.id) &&
            ["approved", "published"].includes(r.status) &&
            (filterSession === "all" || (r as any).session === filterSession) &&
            (filterSemester === "all" ||
              (r as any).semester === filterSemester),
        );
        const failed = sr.filter((r) => r.grade === "F");
        if (failed.length === 0) return null;
        const failedCourses = failed.map((r) => {
          const c = courses.find((c) => String(c.id) === String(r.courseId));
          return c ? `${c.code} \u2014 ${c.name}` : String(r.courseId);
        });
        return { student, dept, failedCourses };
      })
      .filter(Boolean) as Array<{
      student: (typeof students)[0];
      dept: ReturnType<typeof getStudentDepartment>;
      failedCourses: string[];
    }>;
  }, [
    students,
    results,
    courses,
    departments,
    filterDept,
    filterLevel,
    filterSession,
    filterSemester,
  ]);

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

  const filterBar = (
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
        <TabsList className="no-print">
          <TabsTrigger value="pass" data-ocid="pfg.pass.tab">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            Pass List
            <Badge className="ml-1.5 bg-green-100 text-green-800 text-[10px] border-green-300">
              {passList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="fail" data-ocid="pfg.fail.tab">
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            Failure List
            <Badge className="ml-1.5 bg-red-100 text-red-800 text-[10px] border-red-300">
              {failList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="graduating" data-ocid="pfg.graduating.tab">
            <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Graduating List
            <Badge className="ml-1.5 bg-blue-100 text-blue-800 text-[10px] border-blue-300">
              {graduatingList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pass" className="pt-4">
          {filterBar}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Pass List \u2014 Students Who Passed All Courses (
                {passList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {passList.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="pfg.pass.empty_state"
                >
                  No students match the current filter.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Matric No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passList.map(({ student, dept }, idx) => (
                      <TableRow
                        key={String(student.id)}
                        data-ocid={`pfg.pass.item.${idx + 1}`}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {(student as any).matricNo ||
                            (student as any).regNo ||
                            "\u2014"}
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell className="text-xs">{dept?.name}</TableCell>
                        <TableCell>{student.level}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fail" className="pt-4">
          {filterBar}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Failure List \u2014 Students with Failed Courses (
                {failList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {failList.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="pfg.fail.empty_state"
                >
                  No students with failed courses.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Matric No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Failed Courses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failList.map(({ student, dept, failedCourses }, idx) => (
                      <TableRow
                        key={String(student.id)}
                        data-ocid={`pfg.fail.item.${idx + 1}`}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {(student as any).matricNo ||
                            (student as any).regNo ||
                            "\u2014"}
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell className="text-xs">{dept?.name}</TableCell>
                        <TableCell>{student.level}</TableCell>
                        <TableCell className="text-xs text-destructive max-w-48">
                          {failedCourses.join("; ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graduating" className="pt-4">
          {filterBar}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Graduating List \u2014 Eligible Students (
                {graduatingList.length})
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
                                "\u2014"}
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
