import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../context/AppContext";

const GRADUATION_CREDITS = 120;

export default function StudentProgressTab() {
  const { currentUser, students, courses, results } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  const progressData = useMemo(() => {
    if (!me) return null;
    const myResults = results.filter(
      (r) =>
        r.studentId === me.id &&
        (r.status === "published" || r.status === "approved"),
    );

    let completedCredits = 0;
    const resultRows = myResults.map((r) => {
      const course = courses.find((c) => c.id === r.courseId);
      const credits = course ? Number(course.creditUnits) : 0;
      if (r.grade !== "F") completedCredits += credits;
      return { r, course, credits };
    });

    const pct = Math.min(
      100,
      Math.round((completedCredits / GRADUATION_CREDITS) * 100),
    );
    const remaining = Math.max(0, GRADUATION_CREDITS - completedCredits);
    // Assume 15 credits per semester
    const semestersRemaining = remaining > 0 ? Math.ceil(remaining / 15) : 0;

    return { completedCredits, pct, remaining, semestersRemaining, resultRows };
  }, [me, results, courses]);

  if (!me || !progressData) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Student data not found.
      </div>
    );
  }

  const { completedCredits, pct, remaining, semestersRemaining, resultRows } =
    progressData;

  const progressColor =
    pct >= 80
      ? "text-success"
      : pct >= 50
        ? "text-warning"
        : "text-destructive";

  const progressBarColor =
    pct >= 80
      ? "[&>div]:bg-success"
      : pct >= 50
        ? "[&>div]:bg-warning"
        : "[&>div]:bg-destructive";

  return (
    <div className="space-y-6" data-ocid="progress.section">
      <div>
        <h1 className="text-xl font-bold">Academic Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track your journey toward graduation ({GRADUATION_CREDITS} credit
          units required)
        </p>
      </div>

      {/* Big progress display */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Circle-style indicator */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/30"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                className={`transition-all duration-700 ${
                  pct >= 80
                    ? "stroke-success"
                    : pct >= 50
                      ? "stroke-warning"
                      : "stroke-destructive"
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${progressColor}`}>
                {pct}%
              </span>
              <span className="text-xs text-muted-foreground">complete</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  Credit Units Completed
                </span>
                <span className={`text-sm font-bold ${progressColor}`}>
                  {completedCredits} / {GRADUATION_CREDITS}
                </span>
              </div>
              <Progress
                value={pct}
                className={`h-3 ${progressBarColor}`}
                data-ocid="progress.section"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-muted/40 rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">
                  {completedCredits}
                </p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </div>
              <div className="text-center bg-muted/40 rounded-lg p-3">
                <p className="text-lg font-bold text-foreground">{remaining}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div className="text-center bg-muted/40 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {semestersRemaining}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Semesters Est.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results table */}
      {resultRows.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Completed Courses</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead className="text-center">Credit Units</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Contributing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultRows.map(({ r, course, credits }, i) => (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`progress.item.${i + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-mono text-sm">
                    {course?.code ?? "—"}
                  </TableCell>
                  <TableCell>{course?.name ?? "Unknown"}</TableCell>
                  <TableCell className="text-center">{credits}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-bold ${
                        r.grade === "A"
                          ? "text-success"
                          : r.grade === "F"
                            ? "text-destructive"
                            : "text-primary"
                      }`}
                    >
                      {r.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.grade !== "F" ? (
                      <span className="text-xs text-success font-medium">
                        +{credits} cu
                      </span>
                    ) : (
                      <span className="text-xs text-destructive">
                        Not counted
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {resultRows.length === 0 && (
        <div
          className="bg-card rounded-xl border border-border p-10 text-center"
          data-ocid="progress.empty_state"
        >
          <p className="text-muted-foreground">
            No published results yet. Your progress will appear once results are
            published.
          </p>
        </div>
      )}
    </div>
  );
}
