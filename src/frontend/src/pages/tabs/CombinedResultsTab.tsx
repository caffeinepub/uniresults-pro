import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  Download,
  GitMerge,
  Printer,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { calcGradePoint, useApp } from "../../context/AppContext";

type SortDir = "asc" | "desc";

function useSort<T>(items: T[], defaultKey: keyof T) {
  const [col, setCol] = useState<keyof T>(defaultKey);
  const [dir, setDir] = useState<SortDir>("asc");
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (av === undefined || av === null || bv === undefined || bv === null)
        return 0;
      const cmp =
        (av as any) < (bv as any) ? -1 : (av as any) > (bv as any) ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [items, col, dir]);
  function toggle(c: keyof T) {
    if (c === col) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setCol(c);
      setDir("asc");
    }
  }
  return { sorted, col, dir, toggle };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown className="w-3 h-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  );
}

type CombinedRow = {
  studentId: string;
  name: string;
  matric: string;
  homeDept: string;
  programmes: string[];
  totalCourses: number;
  totalCredits: number;
  creditsPassed: number;
  cgpa: number;
  status: string;
  courses: Array<{
    code: string;
    name: string;
    deptCode: string;
    semester: string;
    total: number;
    grade: string;
    gradePoint: number;
    creditUnits: number;
  }>;
};

export default function CombinedResultsTab() {
  const { students, courses, results, departments } = useApp();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const combinedRows: CombinedRow[] = useMemo(() => {
    const rows: CombinedRow[] = [];

    for (const student of students) {
      const studentResults = results.filter(
        (r) => String(r.studentId) === String(student.id),
      );
      if (studentResults.length === 0) continue;

      const deptIdsUsed = new Set<string>();
      const courseRows: CombinedRow["courses"] = [];

      for (const res of studentResults) {
        const course = courses.find(
          (c) => String(c.id) === String(res.courseId),
        );
        if (!course) continue;
        const dept = departments.find(
          (d) => String(d.id) === String(course.departmentId),
        );
        const deptCode = dept?.name?.split(" ")[0]?.toUpperCase() ?? "UNK";
        deptIdsUsed.add(String(course.departmentId));

        const total = (res.caScore ?? 0) + (res.examScore ?? 0);
        const { grade, gradePoint } = calcGradePoint(total);
        courseRows.push({
          code: course.code,
          name: course.name,
          deptCode,
          semester: course.semester ?? "-",
          total,
          grade,
          gradePoint,
          creditUnits: Number(course.creditUnits ?? 0),
        });
      }

      // Only include students with courses from 2+ departments
      if (deptIdsUsed.size < 2) continue;

      const homeDept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      const programmes = [...deptIdsUsed].map((did) => {
        const d = departments.find((x) => String(x.id) === did);
        return d?.name?.split(" ")[0]?.toUpperCase() ?? "UNK";
      });
      const totalCredits = courseRows.reduce((s, c) => s + c.creditUnits, 0);
      const creditsPassed = courseRows
        .filter((c) => c.grade !== "F")
        .reduce((s, c) => s + c.creditUnits, 0);
      const tcp = courseRows.reduce(
        (s, c) => s + c.creditUnits * c.gradePoint,
        0,
      );
      const tgp = totalCredits;
      const cgpa = tgp > 0 ? tcp / tgp : 0;

      let status = "Good Standing";
      if (cgpa < 1.0) status = "Probation";
      else if (cgpa < 2.0) status = "Warning";

      rows.push({
        studentId: String(student.id),
        name: student.name,
        matric: student.matricNumber,
        homeDept: homeDept?.name ?? "-",
        programmes,
        totalCourses: courseRows.length,
        totalCredits,
        creditsPassed,
        cgpa,
        status,
        courses: courseRows,
      });
    }

    return rows;
  }, [students, results, courses, departments]);

  const filtered = useMemo(() => {
    if (!search) return combinedRows;
    const q = search.toLowerCase();
    return combinedRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.matric.toLowerCase().includes(q) ||
        r.homeDept.toLowerCase().includes(q),
    );
  }, [combinedRows, search]);

  const { sorted, col, dir, toggle } = useSort(filtered, "name");

  function exportCSV() {
    const header = [
      "Matric No",
      "Name",
      "Home Dept",
      "Programmes",
      "Total Courses",
      "Total Credits",
      "Credits Passed",
      "CGPA",
      "Status",
    ];
    const rows = sorted.map((r) => [
      r.matric,
      r.name,
      r.homeDept,
      r.programmes.join(" + "),
      r.totalCourses,
      r.totalCredits,
      r.creditsPassed,
      r.cgpa.toFixed(2),
      r.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-programme-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-violet-600" />
            Combined Programme Results
          </h2>
          <p className="text-sm text-muted-foreground">
            Students with courses spanning multiple departments (Education+CSC,
            CSC+PHY, GSE+EDU, etc.)
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="combined_results.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            data-ocid="combined_results.export_button"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <p className="text-xs text-muted-foreground">
              Combined Programme Students
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-violet-600">
              {combinedRows.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <p className="text-xs text-muted-foreground">Avg CGPA</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-primary">
              {combinedRows.length > 0
                ? (
                    combinedRows.reduce((s, r) => s + r.cgpa, 0) /
                    combinedRows.length
                  ).toFixed(2)
                : "0.00"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <p className="text-xs text-muted-foreground">Dept Combinations</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold text-foreground">
              {
                new Set(combinedRows.map((r) => r.programmes.sort().join("+")))
                  .size
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, matric, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="combined_results.search_input"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">S/N</TableHead>
                  {(
                    [
                      ["matric", "Matric No"],
                      ["name", "Name"],
                      ["homeDept", "Home Dept"],
                      ["programmes", "Programmes"],
                      ["totalCourses", "Courses"],
                      ["totalCredits", "Credits"],
                      ["creditsPassed", "Passed"],
                      ["cgpa", "CGPA"],
                      ["status", "Standing"],
                    ] as [keyof CombinedRow, string][]
                  ).map(([k, label]) => (
                    <TableHead
                      key={k}
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => toggle(k)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={col === k} dir={dir} />
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="no-print">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-10 text-muted-foreground"
                      data-ocid="combined_results.empty_state"
                    >
                      {combinedRows.length === 0
                        ? "No combined programme students found. Students need results from courses in 2 or more departments to appear here."
                        : "No results match your search."}
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((row, i) => (
                  <>
                    <TableRow
                      key={row.studentId}
                      className="cursor-pointer hover:bg-muted/30"
                      data-ocid={`combined_results.item.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {row.matric}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-xs">{row.homeDept}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.programmes.map((p) => (
                            <Badge
                              key={p}
                              className="text-[10px] bg-violet-500/10 text-violet-700 border-violet-500/20"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.totalCourses}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.totalCredits}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.creditsPassed}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold text-sm ${
                            row.cgpa >= 4.5
                              ? "text-green-600"
                              : row.cgpa >= 3.5
                                ? "text-blue-600"
                                : row.cgpa >= 2.4
                                  ? "text-amber-600"
                                  : "text-destructive"
                          }`}
                        >
                          {row.cgpa.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            row.status === "Good Standing"
                              ? "bg-green-500/10 text-green-700 border-green-500/20"
                              : row.status === "Warning"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="no-print">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === row.studentId
                                ? null
                                : row.studentId,
                            )
                          }
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          data-ocid={`combined_results.expand.${i + 1}`}
                        >
                          {expandedId === row.studentId ? (
                            <>
                              <ChevronUp className="w-3 h-3" /> Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" /> Courses
                            </>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedId === row.studentId && (
                      <TableRow key={`${row.studentId}-expand`}>
                        <TableCell colSpan={11} className="p-0">
                          <div className="bg-muted/20 border-y border-border/50 px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                              All Courses for {row.name}
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    {[
                                      "Code",
                                      "Course",
                                      "Dept",
                                      "Sem",
                                      "Total",
                                      "Grade",
                                      "GP",
                                      "CU",
                                    ].map((h) => (
                                      <th
                                        key={h}
                                        className="text-left pb-1 pr-4"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.courses.map((c) => (
                                    <tr
                                      key={c.code}
                                      className="border-t border-border/30"
                                    >
                                      <td className="py-1 pr-4 font-mono font-medium">
                                        {c.code}
                                      </td>
                                      <td className="py-1 pr-4">{c.name}</td>
                                      <td className="py-1 pr-4">
                                        <Badge className="text-[10px] bg-muted text-muted-foreground">
                                          {c.deptCode}
                                        </Badge>
                                      </td>
                                      <td className="py-1 pr-4 text-muted-foreground">
                                        {c.semester}
                                      </td>
                                      <td className="py-1 pr-4 font-medium">
                                        {c.total}
                                      </td>
                                      <td className="py-1 pr-4">
                                        <span
                                          className={`font-bold ${
                                            c.grade === "A"
                                              ? "text-green-600"
                                              : c.grade === "B"
                                                ? "text-blue-600"
                                                : c.grade === "F"
                                                  ? "text-destructive"
                                                  : "text-amber-600"
                                          }`}
                                        >
                                          {c.grade}
                                        </span>
                                      </td>
                                      <td className="py-1 pr-4">
                                        {c.gradePoint.toFixed(1)}
                                      </td>
                                      <td className="py-1">{c.creditUnits}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
