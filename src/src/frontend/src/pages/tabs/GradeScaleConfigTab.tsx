import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface GradeScale {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export const DEFAULT_GRADE_SCALE: GradeScale = {
  A: 70,
  B: 60,
  C: 50,
  D: 45,
  E: 40,
};

export function getGradeScale(): GradeScale {
  try {
    const s = localStorage.getItem("gradeScale");
    if (s) return { ...DEFAULT_GRADE_SCALE, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_GRADE_SCALE;
}

export function calculateGrade(total: number): {
  grade: string;
  gradePoint: number;
  remark: string;
} {
  const scale = getGradeScale();
  if (total >= scale.A)
    return { grade: "A", gradePoint: 5, remark: "Distinction" };
  if (total >= scale.B) return { grade: "B", gradePoint: 4, remark: "Credit" };
  if (total >= scale.C) return { grade: "C", gradePoint: 3, remark: "Merit" };
  if (total >= scale.D) return { grade: "D", gradePoint: 2, remark: "Pass" };
  if (total >= scale.E)
    return { grade: "E", gradePoint: 1, remark: "Marginal Pass" };
  return { grade: "F", gradePoint: 0, remark: "Fail" };
}

const GRADE_INFO = [
  {
    grade: "A",
    key: "A" as keyof GradeScale,
    points: 5,
    remark: "Distinction",
    color: "text-success",
  },
  {
    grade: "B",
    key: "B" as keyof GradeScale,
    points: 4,
    remark: "Credit",
    color: "text-primary",
  },
  {
    grade: "C",
    key: "C" as keyof GradeScale,
    points: 3,
    remark: "Merit",
    color: "text-accent",
  },
  {
    grade: "D",
    key: "D" as keyof GradeScale,
    points: 2,
    remark: "Pass",
    color: "text-warning",
  },
  {
    grade: "E",
    key: "E" as keyof GradeScale,
    points: 1,
    remark: "Marginal Pass",
    color: "text-warning",
  },
  {
    grade: "F",
    key: null,
    points: 0,
    remark: "Fail",
    color: "text-destructive",
  },
];

export default function GradeScaleConfigTab() {
  const [scale, setScale] = useState<GradeScale>(getGradeScale);

  function handleSave() {
    // Validate ordering
    if (
      scale.A <= scale.B ||
      scale.B <= scale.C ||
      scale.C <= scale.D ||
      scale.D <= scale.E
    ) {
      toast.error(
        "Grade thresholds must be in descending order (A > B > C > D > E)",
      );
      return;
    }
    if (scale.A > 100 || scale.E < 1) {
      toast.error("Grade thresholds must be between 1 and 100");
      return;
    }
    localStorage.setItem("gradeScale", JSON.stringify(scale));
    toast.success("Grade scale saved. Changes apply to new calculations.");
  }

  function handleReset() {
    setScale(DEFAULT_GRADE_SCALE);
    localStorage.removeItem("gradeScale");
    toast.success("Grade scale reset to defaults");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grade Scale Configuration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize the minimum score for each grade. Changes apply to new grade
          calculations.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Grade</TableHead>
              <TableHead>Min Score</TableHead>
              <TableHead>Max Score</TableHead>
              <TableHead>Grade Points</TableHead>
              <TableHead>Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GRADE_INFO.map((g, i) => {
              const _nextMin = GRADE_INFO[i + 1]?.key
                ? scale[GRADE_INFO[i + 1].key as keyof GradeScale]
                : 0;
              const maxScore =
                i === 0
                  ? 100
                  : (scale[GRADE_INFO[i - 1].key as keyof GradeScale] ?? 100) -
                    1;
              return (
                <TableRow key={g.grade}>
                  <TableCell>
                    <span className={`font-bold text-lg ${g.color}`}>
                      {g.grade}
                    </span>
                  </TableCell>
                  <TableCell>
                    {g.key ? (
                      <Input
                        data-ocid={`grade_scale.${g.grade.toLowerCase()}.input`}
                        type="number"
                        min={1}
                        max={100}
                        value={scale[g.key]}
                        onChange={(e) =>
                          setScale((s) => ({
                            ...s,
                            [g.key as string]: Number(e.target.value),
                          }))
                        }
                        className="w-20 h-8 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.key ? maxScore : scale.E - 1}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${g.color}`}>
                      {g.points}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{g.remark}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-3">
        <Button data-ocid="grade_scale.save_button" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" /> Save Grade Scale
        </Button>
        <Button
          data-ocid="grade_scale.reset_button"
          variant="outline"
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
