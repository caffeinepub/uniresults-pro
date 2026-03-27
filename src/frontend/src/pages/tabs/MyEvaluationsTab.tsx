import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useMemo } from "react";
import type { LecturerEvaluation } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

const CRITERIA: { key: keyof LecturerEvaluation["scores"]; label: string }[] = [
  { key: "teaching", label: "Teaching Effectiveness" },
  { key: "punctuality", label: "Punctuality" },
  { key: "delivery", label: "Course Delivery" },
  { key: "accessibility", label: "Accessibility" },
  { key: "overall", label: "Overall" },
];

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= Math.round(value) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold">{value.toFixed(1)}</span>
    </span>
  );
}

export default function MyEvaluationsTab() {
  const { currentUser, lecturerEvaluations, staffMembers, courses } = useApp();

  const myStaff = staffMembers.find(
    (s) => s.staffId === currentUser?.principal || s.name === currentUser?.name,
  );

  const myEvals = useMemo(
    () =>
      myStaff
        ? lecturerEvaluations.filter((e) => e.lecturerId === myStaff.staffId)
        : [],
    [lecturerEvaluations, myStaff],
  );

  // Group by course
  const byCourse = useMemo(() => {
    const map: Record<string, LecturerEvaluation[]> = {};
    for (const e of myEvals) {
      if (!map[e.courseId]) map[e.courseId] = [];
      map[e.courseId].push(e);
    }
    return map;
  }, [myEvals]);

  function getAvg(
    evals: LecturerEvaluation[],
    key: keyof LecturerEvaluation["scores"],
  ) {
    if (evals.length === 0) return 0;
    return evals.reduce((sum, e) => sum + e.scores[key], 0) / evals.length;
  }

  const overallAvg =
    myEvals.length > 0
      ? myEvals.reduce((sum, e) => sum + e.scores.overall, 0) / myEvals.length
      : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> My Evaluations
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggregated student evaluation scores for your courses.
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Note: Individual student comments are confidential and not shown to
          lecturers.
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Overall Average</p>
          <StarDisplay value={overallAvg} />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Evaluations</p>
          <p className="text-2xl font-bold">{myEvals.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Courses Evaluated</p>
          <p className="text-2xl font-bold">{Object.keys(byCourse).length}</p>
        </div>
      </div>

      {myEvals.length === 0 && (
        <div
          className="py-12 text-center text-muted-foreground"
          data-ocid="my_evaluations.empty_state"
        >
          No evaluations received yet.
        </div>
      )}

      {/* Aggregate by criteria */}
      {myEvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Average Scores by Criteria (All Courses)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <StarDisplay value={getAvg(myEvals, c.key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per Course Breakdown */}
      {Object.entries(byCourse).map(([courseId, evals]) => {
        const course = courses.find((c) => String(c.id) === courseId);
        return (
          <Card key={courseId}>
            <CardHeader>
              <CardTitle className="text-sm">
                {course
                  ? `${course.code} — ${course.name}`
                  : `Course ${courseId}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {evals.length} response{evals.length !== 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {c.label}
                  </span>
                  <StarDisplay value={getAvg(evals, c.key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
