import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExtendedStudent } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

interface Props {
  student?: ExtendedStudent;
  title?: string;
}

export default function GPATrendChart({ student, title }: Props) {
  const { currentUser, students, courses, results } = useApp();

  const target =
    student ?? students.find((s) => s.userPrincipal === currentUser?.principal);

  const data = useMemo(() => {
    if (!target) return [];

    const myResults = results.filter(
      (r) =>
        r.studentId === target.id &&
        (r.status === "published" || r.status === "approved"),
    );

    // Group by semester
    const semMap = new Map<
      string,
      { totalPoints: number; totalCredits: number }
    >();
    for (const r of myResults) {
      const course = courses.find((c) => c.id === r.courseId);
      if (!course) continue;
      const key = course.semester;
      if (!key) continue;
      const credits = Number(course.creditUnits);
      if (credits === 0) continue;
      const existing = semMap.get(key) ?? { totalPoints: 0, totalCredits: 0 };
      existing.totalPoints += r.gradePoint * credits;
      existing.totalCredits += credits;
      semMap.set(key, existing);
    }

    const sorted = Array.from(semMap.entries())
      .map(([sem, d]) => ({
        semester: sem,
        gpa:
          d.totalCredits > 0
            ? Number((d.totalPoints / d.totalCredits).toFixed(2))
            : 0,
      }))
      .sort((a, b) => a.semester.localeCompare(b.semester));

    return sorted;
  }, [target, results, courses]);

  if (!target) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No student data available
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground text-sm"
        data-ocid="gpa_trend.empty_state"
      >
        No published results yet to show GPA trend
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-xl p-5"
      data-ocid="gpa_trend.chart_point"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {title ?? `GPA Trend — ${target.name}`}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.01 250)" />
          <XAxis
            dataKey="semester"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) =>
              v.replace(/ (First|Second) Semester/, " $1").slice(-10)
            }
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "GPA"]}
            labelFormatter={(label: string) => `Semester: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="oklch(0.29 0.09 258)"
            strokeWidth={2.5}
            dot={{ fill: "oklch(0.29 0.09 258)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
