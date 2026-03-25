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
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../context/AppContext";

export default function BenchmarkingTab() {
  const { departments, courses, results } = useApp();

  const semesters = ["First", "Second"];

  const [semA, setSemA] = useState("First");
  const [semB, setSemB] = useState("Second");

  const publishedResults = results.filter(
    (r) => r.status === "published" || r.status === "approved",
  );

  function getStats(semester: string) {
    return departments.map((dept) => {
      const deptCourses = courses.filter(
        (c) =>
          c.departmentId === dept.id &&
          (semester === "All" || c.semester === semester),
      );
      const deptResults = publishedResults.filter((r) =>
        deptCourses.some((c) => c.id === r.courseId),
      );
      const avgScore =
        deptResults.length > 0
          ? deptResults.reduce((sum, r) => sum + r.totalScore, 0) /
            deptResults.length
          : 0;
      const passRate =
        deptResults.length > 0
          ? (deptResults.filter((r) => r.totalScore >= 40).length /
              deptResults.length) *
            100
          : 0;
      return {
        dept: dept.name.split(" ").slice(0, 2).join(" "),
        fullName: dept.name,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate),
        count: deptResults.length,
      };
    });
  }

  const statsA = getStats(semA);
  const statsB = getStats(semB);

  const chartData = departments.map((dept, i) => ({
    name: dept.name.split(" ").slice(0, 2).join(" "),
    [`${semA} Avg`]: statsA[i]?.avgScore ?? 0,
    [`${semB} Avg`]: statsB[i]?.avgScore ?? 0,
    [`${semA} Pass%`]: statsA[i]?.passRate ?? 0,
    [`${semB} Pass%`]: statsB[i]?.passRate ?? 0,
  }));

  return (
    <div className="space-y-6" data-ocid="benchmarking.section">
      <div>
        <h1 className="text-xl font-bold">Result Benchmarking</h1>
        <p className="text-sm text-muted-foreground">
          Compare performance across semesters and departments
        </p>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-4 flex-wrap bg-muted/30 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Compare</span>
          <Select value={semA} onValueChange={setSemA}>
            <SelectTrigger
              data-ocid="benchmarking.select"
              className="w-36 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} Semester
                </SelectItem>
              ))}
              <SelectItem value="All">All Semesters</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">vs</span>
        <div className="flex items-center gap-2">
          <Select value={semB} onValueChange={setSemB}>
            <SelectTrigger className="w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} Semester
                </SelectItem>
              ))}
              <SelectItem value="All">All Semesters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <p className="text-sm font-semibold mb-4">
            Average Score by Department
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey={`${semA} Avg`}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey={`${semB} Avg`}
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold">
            Detailed Comparison: {semA} vs {semB}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">{semA} Avg</TableHead>
              <TableHead className="text-center">{semA} Pass%</TableHead>
              <TableHead className="text-center">{semB} Avg</TableHead>
              <TableHead className="text-center">{semB} Pass%</TableHead>
              <TableHead className="text-center">Change (Avg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept, i) => {
              const a = statsA[i];
              const b = statsB[i];
              const diff = b && a ? b.avgScore - a.avgScore : 0;
              return (
                <TableRow
                  key={String(dept.id)}
                  data-ocid={`benchmarking.item.${i + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-center">
                    {a?.count === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={
                          a && a.avgScore >= 50
                            ? "text-success font-semibold"
                            : "text-destructive font-semibold"
                        }
                      >
                        {a?.avgScore ?? 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {a?.count === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={
                          a && a.passRate >= 60
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {a?.passRate ?? 0}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {b?.count === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={
                          b && b.avgScore >= 50
                            ? "text-success font-semibold"
                            : "text-destructive font-semibold"
                        }
                      >
                        {b?.avgScore ?? 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {b?.count === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={
                          b && b.passRate >= 60
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {b?.passRate ?? 0}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {a?.count === 0 && b?.count === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={
                          diff > 0
                            ? "text-success font-semibold"
                            : diff < 0
                              ? "text-destructive font-semibold"
                              : "text-muted-foreground"
                        }
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
