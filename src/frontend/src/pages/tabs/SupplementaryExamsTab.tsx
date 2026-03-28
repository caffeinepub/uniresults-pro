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
import { AlertTriangle, ClipboardList, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { calcGradePoint, useApp } from "../../context/AppContext";

interface ResitEntry {
  resultId: string;
  score: string;
}

interface SavedResit {
  resultId: string;
  resitScore: number;
  resitGrade: string;
  savedAt: string;
}

const RESIT_KEY = "unipro_resit_scores";

function getResitScores(): Record<string, SavedResit> {
  try {
    return JSON.parse(localStorage.getItem(RESIT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveResitScore(rid: string, data: SavedResit) {
  const all = getResitScores();
  all[rid] = data;
  localStorage.setItem(RESIT_KEY, JSON.stringify(all));
}

export default function SupplementaryExamsTab() {
  const { results, students, courses, departments, currentUser } = useApp();

  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [resitEntries, setResitEntries] = useState<Record<string, ResitEntry>>(
    {},
  );
  const [savedResits, setSavedResits] =
    useState<Record<string, SavedResit>>(getResitScores);

  const hodDeptId = (currentUser as any)?.departmentId;

  const failedResults = useMemo(() => {
    return results
      .filter((r) => r.grade === "F" || r.gradePoint === 0)
      .map((r) => {
        const student = students.find(
          (s) => String(s.id) === String(r.studentId),
        );
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        const dept = departments.find(
          (d) => String(d.id) === String(student?.departmentId),
        );
        return { r, student, course, dept };
      })
      .filter(({ student, dept }) => {
        if (!student || !dept) return false;
        if (currentUser?.role === "HOD" && hodDeptId) {
          if (String(dept.id) !== String(hodDeptId)) return false;
        }
        if (filterDept !== "all" && String(dept.id) !== filterDept)
          return false;
        if (filterLevel !== "all" && String(student.level) !== filterLevel)
          return false;
        return true;
      });
  }, [
    results,
    students,
    courses,
    departments,
    currentUser,
    hodDeptId,
    filterDept,
    filterLevel,
  ]);

  function handleResitSave(rid: string) {
    const entry = resitEntries[rid];
    if (!entry) return;
    const score = Math.min(45, Math.max(0, Number(entry.score)));
    if (Number.isNaN(score)) {
      toast.error("Enter a valid score (0\u201345)");
      return;
    }
    const { grade } = calcGradePoint(score);
    const saved: SavedResit = {
      resultId: rid,
      resitScore: score,
      resitGrade: grade,
      savedAt: new Date().toISOString(),
    };
    saveResitScore(rid, saved);
    setSavedResits((prev) => ({ ...prev, [rid]: saved }));
    toast.success(`Resit score saved \u2014 ${grade}`);
    setResitEntries((prev) => {
      const next = { ...prev };
      delete next[rid];
      return next;
    });
  }

  const levels = ["100", "200", "300", "400", "500", "600"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold">Supplementary / Resit Exams</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {currentUser?.role !== "HOD" && (
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48" data-ocid="supp.dept.select">
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
          <SelectTrigger className="w-36" data-ocid="supp.level.select">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-4 h-4" />
            Failed Students ({failedResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {failedResults.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="supp.empty_state"
            >
              No failed results found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matric No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Orig. Score</TableHead>
                    <TableHead>Orig. Grade</TableHead>
                    <TableHead>Resit Score (max 45)</TableHead>
                    <TableHead>Resit Grade</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedResults.map(({ r, student, course, dept }, idx) => {
                    const rid = String(r.id);
                    const saved = savedResits[rid];
                    return (
                      <TableRow
                        key={rid}
                        data-ocid={`supp.item.${idx + 1}`}
                        className={saved ? "bg-green-50/50" : ""}
                      >
                        <TableCell className="font-mono text-xs">
                          {(student as any)?.matricNo ||
                            (student as any)?.regNo ||
                            "\u2014"}
                        </TableCell>
                        <TableCell>{student?.name ?? "\u2014"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {course?.code} \u2014 {course?.name}
                        </TableCell>
                        <TableCell className="text-xs">{dept?.name}</TableCell>
                        <TableCell>{student?.level}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-destructive">
                            {r.totalScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">
                            {r.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {saved ? (
                            <span className="font-semibold text-success">
                              {saved.resitScore}
                            </span>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              max={45}
                              className="w-20 h-7 text-xs"
                              placeholder="0\u201345"
                              value={resitEntries[rid]?.score ?? ""}
                              data-ocid={`supp.input.${idx + 1}`}
                              onChange={(e) =>
                                setResitEntries((prev) => ({
                                  ...prev,
                                  [rid]: {
                                    resultId: rid,
                                    score: e.target.value,
                                  },
                                }))
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {saved ? (
                            <Badge
                              className={`text-[10px] ${
                                saved.resitGrade === "F"
                                  ? "bg-red-100 text-red-700 border-red-300"
                                  : "bg-green-100 text-green-700 border-green-300"
                              }`}
                            >
                              {saved.resitGrade}
                              <span className="ml-1 text-[9px] opacity-70">
                                RESIT
                              </span>
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              \u2014
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!saved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              data-ocid={`supp.save_button.${idx + 1}`}
                              disabled={!resitEntries[rid]?.score}
                              onClick={() => handleResitSave(rid)}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
