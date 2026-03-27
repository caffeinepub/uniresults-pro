import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Lock, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LecturerEvaluation } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

const CRITERIA: { key: keyof LecturerEvaluation["scores"]; label: string }[] = [
  { key: "teaching", label: "Teaching Effectiveness" },
  { key: "punctuality", label: "Punctuality" },
  { key: "delivery", label: "Course Delivery" },
  { key: "accessibility", label: "Accessibility" },
  { key: "overall", label: "Overall" },
];

function StarInput({
  value,
  onChange,
  readonly,
}: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          <Star
            className={`w-6 h-6 ${(hovered || value) >= s ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function EvalCard({
  course,
  staff,
  alreadySubmitted,
  studentId,
  session,
  semester,
}: {
  course: any;
  staff: any;
  alreadySubmitted: boolean;
  studentId: bigint;
  session: string;
  semester: string;
}) {
  const { addLecturerEvaluation } = useApp();
  const [scores, setScores] = useState<LecturerEvaluation["scores"]>({
    teaching: 0,
    punctuality: 0,
    delivery: 0,
    accessibility: 0,
    overall: 0,
  });
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  function handleSubmit() {
    if (Object.values(scores).some((v) => v === 0)) {
      toast.error("Please rate all criteria before submitting");
      return;
    }
    const ev: LecturerEvaluation = {
      id: `eval-${Date.now()}-${Math.random()}`,
      studentId: String(studentId),
      lecturerId: staff?.staffId ?? course.lecturerPrincipal ?? "unknown",
      courseId: String(course.id),
      session,
      semester,
      scores,
      comment,
      timestamp: new Date().toISOString(),
    };
    addLecturerEvaluation(ev);
    setSubmitted(true);
    toast.success("Evaluation submitted anonymously!");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {course.code} — {course.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lecturer: {staff?.name ?? "Not Assigned"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {submitted ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            ✓ Evaluation Submitted
          </Badge>
        ) : (
          <>
            {CRITERIA.map((c) => (
              <div key={c.key} className="space-y-1">
                <p className="text-xs font-medium">{c.label}</p>
                <StarInput
                  value={scores[c.key]}
                  onChange={(v) =>
                    setScores((prev) => ({ ...prev, [c.key]: v }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs font-medium">
                Anonymous Comment (optional)
              </p>
              <Textarea
                data-ocid="student_eval.comment.input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (anonymous)..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="w-full"
              data-ocid="student_eval.submit_button"
            >
              Submit Evaluation
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentEvaluationTab() {
  const {
    currentUser,
    students,
    courseRegistrations,
    courses,
    staffMembers,
    academicCalendars,
    evaluationWindowOpen,
    lecturerEvaluations,
  } = useApp();

  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const session = activeCalendar?.session ?? "2024/2025";
  const semester = activeCalendar?.semester ?? "First";

  if (!me)
    return (
      <div className="p-6 text-muted-foreground">Student record not found.</div>
    );

  if (!evaluationWindowOpen) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> Evaluate Lecturers
        </h1>
        <div
          className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border"
          data-ocid="student_eval.closed.panel"
        >
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Evaluations Closed</p>
            <p className="text-xs text-muted-foreground">
              Lecturer evaluations are currently closed for this semester.
              Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const myRegCourseIds = new Set(
    courseRegistrations
      .filter(
        (r) => String(r.studentId) === String(me.id) && r.semester === semester,
      )
      .map((r) => String(r.courseId)),
  );
  const myCourses = courses.filter((c) => myRegCourseIds.has(String(c.id)));

  const items = myCourses.map((course) => {
    const staff = staffMembers.find((s) =>
      s.courseIds.some((cid) => String(cid) === String(course.id)),
    );
    const alreadySubmitted = lecturerEvaluations.some(
      (e) =>
        e.studentId === String(me.id) &&
        e.courseId === String(course.id) &&
        e.session === session &&
        e.semester === semester,
    );
    return { course, staff, alreadySubmitted };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> Evaluate Lecturers
        </h1>
        <p className="text-sm text-muted-foreground">
          Your evaluations are anonymous. Rate each lecturer for your courses
          this semester.
        </p>
      </div>
      <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Evaluations are completely anonymous. Lecturers can only see averaged
        scores, not individual comments.
      </div>
      {items.length === 0 && (
        <div
          className="py-12 text-center text-muted-foreground"
          data-ocid="student_eval.empty_state"
        >
          No courses registered for this semester.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ course, staff, alreadySubmitted }) => (
          <EvalCard
            key={String(course.id)}
            course={course}
            staff={staff}
            alreadySubmitted={alreadySubmitted}
            studentId={me.id}
            session={session}
            semester={semester}
          />
        ))}
      </div>
    </div>
  );
}
