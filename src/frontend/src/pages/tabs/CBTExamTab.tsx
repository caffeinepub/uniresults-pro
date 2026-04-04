import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Monitor,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface CBTQuestion {
  id: string;
  courseId: string;
  type: "mcq" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
  createdBy: string;
}

export interface CBTExam {
  id: string;
  courseId: string;
  title: string;
  duration: number;
  scheduledDate: string;
  scheduledTime: string;
  questionIds: string[];
  allowedStudentIds: string[];
  status: "draft" | "scheduled" | "ongoing" | "completed";
  createdBy: string;
}

export interface CBTResult {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  totalMarks: number;
  grade: string;
  submittedAt: string;
  status: "in_progress" | "submitted" | "graded";
}

function loadCBT<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function saveCBT<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function calcGrade(score: number, total: number): string {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 45) return "D";
  if (pct >= 40) return "E";
  return "F";
}

// ---- Student Exam Interface ----
function StudentExamView({
  exam,
  questions,
  onSubmit,
}: {
  exam: CBTExam;
  questions: CBTQuestion[];
  studentId: string;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(exam.duration * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onSubmitRef.current(answersRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const q = questions[current];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  function handleAnswer(val: string) {
    setAnswers({ ...answers, [q.id]: val });
  }

  function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit(answers);
  }

  if (!q)
    return <p className="text-muted-foreground">No questions available.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
        <span className="font-semibold text-sm">{exam.title}</span>
        <div
          className={`flex items-center gap-2 font-mono font-bold ${secondsLeft < 300 ? "text-destructive" : "text-primary"}`}
        >
          <Clock className="w-4 h-4" />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 no-print">
        {questions.map((qq, idx) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => setCurrent(idx)}
            className={`w-7 h-7 rounded text-xs font-bold border ${
              answers[qq.id] ? "bg-primary text-primary-foreground" : "bg-muted"
            } ${idx === current ? "ring-2 ring-primary" : ""}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Q{current + 1} of {questions.length} ({q.marks} mark
            {q.marks > 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium">{q.question}</p>
          {q.type === "mcq" && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={`opt-${q.id}-${i}`}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={String(i)}
                    checked={answers[q.id] === String(i)}
                    onChange={() => handleAnswer(String(i))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === "true_false" && (
            <div className="flex gap-4">
              {["True", "False"].map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={v.toLowerCase()}
                    checked={answers[q.id] === v.toLowerCase()}
                    onChange={() => handleAnswer(v.toLowerCase())}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === "short_answer" && (
            <Textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={3}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
        >
          Previous
        </Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(current + 1)}>Next</Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Submit Exam
          </Button>
        )}
      </div>
    </div>
  );
}

// ---- Main Tab ----
export default function CBTExamTab() {
  const { currentUser, courses, students } = useApp();
  const [questions, setQuestionsState] = useState<CBTQuestion[]>(() =>
    loadCBT<CBTQuestion>("unipro_cbt_questions"),
  );
  const [exams, setExamsState] = useState<CBTExam[]>(() =>
    loadCBT<CBTExam>("unipro_cbt_exams"),
  );
  const [results, setResultsState] = useState<CBTResult[]>(() =>
    loadCBT<CBTResult>("unipro_cbt_results"),
  );
  const [subTab, setSubTab] = useState<
    "questions" | "exams" | "results" | "take"
  >("exams");
  const [activeExam, setActiveExam] = useState<CBTExam | null>(null);
  const [showQForm, setShowQForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [qForm, setQForm] = useState({
    courseId: "",
    type: "mcq" as CBTQuestion["type"],
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "0",
    marks: 1,
  });
  const [examForm, setExamForm] = useState({
    courseId: "",
    title: "",
    duration: 60,
    scheduledDate: "",
    scheduledTime: "",
  });
  const [filterCourse, setFilterCourse] = useState("");

  const role = currentUser?.role;
  const isStudent = role === "Student";
  const _isAdmin = role === "SuperAdmin" || role === "Registrar";

  const student = isStudent
    ? students.find((s) => s.name === currentUser?.name)
    : null;

  function persistQ(data: CBTQuestion[]) {
    setQuestionsState(data);
    saveCBT("unipro_cbt_questions", data);
  }
  function persistE(data: CBTExam[]) {
    setExamsState(data);
    saveCBT("unipro_cbt_exams", data);
  }
  function persistR(data: CBTResult[]) {
    setResultsState(data);
    saveCBT("unipro_cbt_results", data);
  }

  function saveQuestion() {
    if (!qForm.question || !qForm.courseId) {
      toast.error("Fill in all fields");
      return;
    }
    const newQ: CBTQuestion = {
      id: Date.now().toString(),
      courseId: qForm.courseId,
      type: qForm.type,
      question: qForm.question,
      options: qForm.type === "mcq" ? qForm.options.filter(Boolean) : undefined,
      correctAnswer: qForm.correctAnswer,
      marks: qForm.marks,
      createdBy: currentUser?.name ?? "",
    };
    persistQ([...questions, newQ]);
    toast.success("Question added");
    setShowQForm(false);
  }

  function saveExam() {
    if (!examForm.courseId || !examForm.title || !examForm.scheduledDate) {
      toast.error("Fill all exam fields");
      return;
    }
    const courseQuestions = questions
      .filter((q) => q.courseId === examForm.courseId)
      .map((q) => q.id);
    const newExam: CBTExam = {
      id: Date.now().toString(),
      courseId: examForm.courseId,
      title: examForm.title,
      duration: examForm.duration,
      scheduledDate: examForm.scheduledDate,
      scheduledTime: examForm.scheduledTime,
      questionIds: courseQuestions,
      allowedStudentIds: [],
      status: "scheduled",
      createdBy: currentUser?.name ?? "",
    };
    persistE([...exams, newExam]);
    toast.success("Exam scheduled");
    setShowExamForm(false);
  }

  function handleExamSubmit(answers: Record<string, string>) {
    if (!activeExam || !student) return;
    const examQs = questions.filter((q) =>
      activeExam.questionIds.includes(q.id),
    );
    let score = 0;
    let totalMarks = 0;
    for (const q of examQs) {
      totalMarks += q.marks;
      const ans = answers[q.id];
      if (q.type === "short_answer") continue; // manual grading
      if (ans === q.correctAnswer) score += q.marks;
    }
    const grade = calcGrade(score, totalMarks);
    const newResult: CBTResult = {
      id: Date.now().toString(),
      examId: activeExam.id,
      studentId: String(student.id),
      answers,
      score,
      totalMarks,
      grade,
      submittedAt: new Date().toISOString(),
      status: "graded",
    };
    persistR([...results, newResult]);
    setActiveExam(null);
    setSubTab("results");
    toast.success(`Exam submitted! Score: ${score}/${totalMarks} (${grade})`);
  }

  const myExams =
    isStudent && student
      ? exams.filter((e) => e.status === "scheduled" || e.status === "ongoing")
      : exams;

  const myResults =
    isStudent && student
      ? results.filter((r) => r.studentId === String(student.id))
      : results;

  const courseName = (id: string) =>
    courses.find((c) => String(c.id) === id)?.name ?? id;
  const courseCode = (id: string) =>
    courses.find((c) => String(c.id) === id)?.code ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">CBT / Online Exam Module</h2>
      </div>

      {activeExam && isStudent ? (
        <StudentExamView
          exam={activeExam}
          questions={questions.filter((q) =>
            activeExam.questionIds.includes(q.id),
          )}
          studentId={String(student?.id ?? "")}
          onSubmit={handleExamSubmit}
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap no-print">
            {[
              { key: "exams", label: "Exams" },
              ...(isStudent
                ? []
                : [{ key: "questions", label: "Question Bank" }]),
              { key: "results", label: "Results" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSubTab(t.key as typeof subTab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                  subTab === t.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 border-border"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* QUESTION BANK */}
          {subTab === "questions" && !isStudent && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.code} – {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => setShowQForm(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead className="no-print">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions
                        .filter(
                          (q) => !filterCourse || q.courseId === filterCourse,
                        )
                        .map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="text-xs">
                              {courseCode(q.courseId)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {q.question}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {q.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{q.marks}</TableCell>
                            <TableCell className="no-print">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  persistQ(
                                    questions.filter((x) => x.id !== q.id),
                                  )
                                }
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {questions.filter(
                        (q) => !filterCourse || q.courseId === filterCourse,
                      ).length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-6"
                          >
                            No questions yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EXAMS */}
          {subTab === "exams" && (
            <div className="space-y-3">
              {!isStudent && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowExamForm(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Schedule Exam
                  </Button>
                </div>
              )}
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {myExams.length === 0 ? (
                  <p className="text-muted-foreground text-sm col-span-2">
                    No exams scheduled yet.
                  </p>
                ) : (
                  myExams.map((e) => {
                    const examQs = questions.filter((q) =>
                      e.questionIds.includes(q.id),
                    );
                    const totalMarks = examQs.reduce((s, q) => s + q.marks, 0);
                    const alreadyTaken =
                      isStudent &&
                      results.some(
                        (r) =>
                          r.examId === e.id &&
                          r.studentId === String(student?.id ?? ""),
                      );
                    return (
                      <Card key={e.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            {e.title}
                            <Badge
                              variant={
                                e.status === "scheduled"
                                  ? "outline"
                                  : e.status === "ongoing"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {e.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <p>
                            <span className="text-muted-foreground">
                              Course:
                            </span>{" "}
                            {courseCode(e.courseId)} – {courseName(e.courseId)}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Date:</span>{" "}
                            {e.scheduledDate} {e.scheduledTime}
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Duration:
                            </span>{" "}
                            {e.duration} min
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Questions:
                            </span>{" "}
                            {examQs.length} ({totalMarks} marks)
                          </p>
                          {isStudent &&
                            (alreadyTaken ? (
                              <Badge className="mt-2">Already Attempted</Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => {
                                  setActiveExam(e);
                                  setSubTab("take");
                                }}
                              >
                                Start Exam
                              </Button>
                            ))}
                          {!isStudent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1"
                              onClick={() =>
                                persistE(exams.filter((x) => x.id !== e.id))
                              }
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* RESULTS */}
          {subTab === "results" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      {!isStudent && <TableHead>Student</TableHead>}
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myResults.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-6"
                        >
                          No results yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myResults.map((r) => {
                        const exam = exams.find((e) => e.id === r.examId);
                        const stdnt = !isStudent
                          ? students.find((s) => String(s.id) === r.studentId)
                          : null;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="text-xs">
                              {exam?.title ?? r.examId}
                            </TableCell>
                            {!isStudent && (
                              <TableCell className="text-xs">
                                {stdnt?.name ?? r.studentId}
                              </TableCell>
                            )}
                            <TableCell>
                              {r.score}/{r.totalMarks}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  r.grade === "F" ? "destructive" : "default"
                                }
                              >
                                {r.grade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(r.submittedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Question Dialog */}
      <Dialog open={showQForm} onOpenChange={setShowQForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Course</Label>
              <Select
                value={qForm.courseId}
                onValueChange={(v) => setQForm({ ...qForm, courseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.code} – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question Type</Label>
              <Select
                value={qForm.type}
                onValueChange={(v) =>
                  setQForm({ ...qForm, type: v as CBTQuestion["type"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question</Label>
              <Textarea
                value={qForm.question}
                onChange={(e) =>
                  setQForm({ ...qForm, question: e.target.value })
                }
                rows={2}
              />
            </div>
            {qForm.type === "mcq" && (
              <div className="space-y-1">
                <Label>Options</Label>
                {qForm.options.map((opt, i) => (
                  <Input
                    key={`qopt-${i}-${opt.slice(0, 5)}`}
                    value={opt}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) => {
                      const o = [...qForm.options];
                      o[i] = e.target.value;
                      setQForm({ ...qForm, options: o });
                    }}
                  />
                ))}
                <Label>Correct Option (0-indexed)</Label>
                <Input
                  type="number"
                  value={qForm.correctAnswer}
                  min={0}
                  max={3}
                  onChange={(e) =>
                    setQForm({ ...qForm, correctAnswer: e.target.value })
                  }
                />
              </div>
            )}
            {qForm.type === "true_false" && (
              <div>
                <Label>Correct Answer</Label>
                <Select
                  value={qForm.correctAnswer}
                  onValueChange={(v) =>
                    setQForm({ ...qForm, correctAnswer: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {qForm.type === "short_answer" && (
              <div>
                <Label>Expected Answer (for reference)</Label>
                <Textarea
                  value={qForm.correctAnswer}
                  onChange={(e) =>
                    setQForm({ ...qForm, correctAnswer: e.target.value })
                  }
                  rows={2}
                />
              </div>
            )}
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                value={qForm.marks}
                min={1}
                onChange={(e) =>
                  setQForm({
                    ...qForm,
                    marks: Number.parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQForm(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuestion}>Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Exam Dialog */}
      <Dialog open={showExamForm} onOpenChange={setShowExamForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Course</Label>
              <Select
                value={examForm.courseId}
                onValueChange={(v) => setExamForm({ ...examForm, courseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.code} – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exam Title</Label>
              <Input
                value={examForm.title}
                onChange={(e) =>
                  setExamForm({ ...examForm, title: e.target.value })
                }
                placeholder="e.g. CSC101 CAT 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={examForm.scheduledDate}
                  onChange={(e) =>
                    setExamForm({ ...examForm, scheduledDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={examForm.scheduledTime}
                  onChange={(e) =>
                    setExamForm({ ...examForm, scheduledTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={examForm.duration}
                min={5}
                onChange={(e) =>
                  setExamForm({
                    ...examForm,
                    duration: Number.parseInt(e.target.value) || 60,
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {questions.filter((q) => q.courseId === examForm.courseId).length}{" "}
              questions available for this course.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExamForm(false)}>
              Cancel
            </Button>
            <Button onClick={saveExam}>Schedule Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
