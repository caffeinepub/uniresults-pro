import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../context/AppContext";
import { calcGradePoint } from "../../context/AppContext";

const CGPA_RANGES = [
  { range: "0.0 – 1.0", min: 0, max: 1 },
  { range: "1.0 – 2.0", min: 1, max: 2 },
  { range: "2.0 – 3.0", min: 2, max: 3 },
  { range: "3.0 – 4.0", min: 3, max: 4 },
  { range: "4.0 – 5.0", min: 4, max: 5.01 },
];

const MOCK_PASS_TREND = [
  { session: "2020/2021", passRate: 72 },
  { session: "2021/2022", passRate: 78 },
  { session: "2022/2023", passRate: 75 },
  { session: "2023/2024", passRate: 83 },
  { session: "2024/2025", passRate: 81 },
];

const PIE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
];
const BAR_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

export default function AdvancedAnalyticsTab() {
  const { students, results, departments, courses } = useApp();
  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (filterDept !== "all" && String(s.departmentId) !== filterDept)
      return false;
    if (filterLevel !== "all" && String(s.level) !== filterLevel) return false;
    return true;
  });

  const filteredResults = results.filter((r) => {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    if (!course) return false;
    if (filterDept !== "all" && String(course.departmentId) !== filterDept)
      return false;
    return true;
  });

  // CGPA Distribution
  const studentCGPAs = filteredStudents
    .map((s) => {
      const sResults = filteredResults.filter(
        (r) => String(r.studentId) === String(s.id),
      );
      if (sResults.length === 0) return null;
      const totalGP = sResults.reduce(
        (sum, r) =>
          sum +
          calcGradePoint(r.totalScore).gradePoint *
            Number(
              courses.find((c) => String(c.id) === String(r.courseId))
                ?.creditUnits ?? 3,
            ),
        0,
      );
      const totalCU = sResults.reduce(
        (sum, r) =>
          sum +
          Number(
            courses.find((c) => String(c.id) === String(r.courseId))
              ?.creditUnits ?? 3,
          ),
        0,
      );
      return totalCU > 0 ? totalGP / totalCU : 0;
    })
    .filter((v): v is number => v !== null);

  const cgpaDistribution = CGPA_RANGES.map((range) => ({
    range: range.range,
    count: studentCGPAs.filter((v) => v >= range.min && v < range.max).length,
  }));

  // Enrollment by Department
  const enrollmentByDept = departments
    .slice(0, 10)
    .map((d, idx) => ({
      name: d.name.length > 20 ? `${d.name.slice(0, 18)}...` : d.name,
      students: students.filter((s) => String(s.departmentId) === String(d.id))
        .length,
      color: BAR_COLORS[idx % BAR_COLORS.length],
    }))
    .filter((d) => d.students > 0)
    .sort((a, b) => b.students - a.students)
    .slice(0, 8);

  // Grade Distribution
  const grades = ["A", "B", "C", "D", "E", "F"];
  const gradeDistribution = grades.map((g, i) => ({
    grade: g,
    count: filteredResults.filter((r) => r.grade === g).length,
    fill: PIE_COLORS[i],
  }));

  const totalResults = filteredResults.length;
  const passCount = filteredResults.filter((r) => r.grade !== "F").length;
  const passRate =
    totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Advanced Analytics</h2>
          <Badge variant="secondary">{filteredStudents.length} students</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger
              className="w-48 h-10"
              data-ocid="analytics_adv.select"
            >
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
            <SelectTrigger className="w-32 h-10">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {["100", "200", "300", "400", "500", "600"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l} Level
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold">{filteredStudents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Results</p>
            <p className="text-2xl font-bold">{totalResults}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pass Rate</p>
            <p className="text-2xl font-bold text-green-600">{passRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Departments</p>
            <p className="text-2xl font-bold">{departments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CGPA Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">CGPA Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {studentCGPAs.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No result data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cgpaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Students"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass Rate Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pass Rate Trend (5 Sessions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_PASS_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" tick={{ fontSize: 9 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Pass Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enrollment by Department */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Enrollment by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentByDept.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No enrollment data
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, enrollmentByDept.length * 32)}
              >
                <BarChart data={enrollmentByDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip />
                  <Bar dataKey="students" name="Students" radius={[0, 4, 4, 0]}>
                    {enrollmentByDept.map((d, i) => (
                      <Cell
                        key={d.name}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {totalResults === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No result data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={gradeDistribution.filter((g) => g.count > 0)}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ grade, percent }) =>
                      `${grade} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {gradeDistribution
                      .filter((g) => g.count > 0)
                      .map((g) => (
                        <Cell key={g.grade} fill={g.fill} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} results`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
