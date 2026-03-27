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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import type { AmendmentRequest, ExtendedResult } from "@/context/AppContext";
import { BookOpen, Eye, FileEdit, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "B":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "C":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "D":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "E":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "F":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  submitted: {
    label: "Submitted",
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  hod_approved: {
    label: "HOD Approved",
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  dean_approved: {
    label: "Dean Approved",
    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  approved: {
    label: "Dean Approved",
    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  published: {
    label: "Published",
    cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function LecturerResultsTab() {
  const { currentUser, courses, results, students, addAmendmentRequest } =
    useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<bigint | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendReason, setAmendReason] = useState("");

  // My assigned courses
  const myCourses = useMemo(
    () => courses.filter((c) => c.lecturerPrincipal === currentUser?.principal),
    [courses, currentUser],
  );

  // Compute course-level summary
  const courseSummaries = useMemo(() => {
    return myCourses.map((course) => {
      const courseResults = results.filter(
        (r) => String(r.courseId) === String(course.id),
      ) as ExtendedResult[];

      const gradeCounts: Record<string, number> = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
      };
      for (const r of courseResults) {
        if (r.grade in gradeCounts) gradeCounts[r.grade]++;
      }

      // Derive status from results
      let status = "draft";
      const statuses = courseResults.map((r) => r.status);
      if (statuses.some((s) => s === "published")) status = "published";
      else if (statuses.some((s) => s === "approved" || s === "dean_approved"))
        status = "dean_approved";
      else if (statuses.some((s) => s === "hod_approved"))
        status = "hod_approved";
      else if (statuses.some((s) => s === "submitted")) status = "submitted";
      else if (statuses.some((s) => s === "rejected")) status = "rejected";
      else if (courseResults.length > 0) status = "draft";

      return {
        course,
        courseResults,
        gradeCounts,
        status,
        enrolled: courseResults.length,
      };
    });
  }, [myCourses, results]);

  const selectedSummary = useMemo(
    () =>
      courseSummaries.find(
        (s) => String(s.course.id) === String(selectedCourseId),
      ),
    [courseSummaries, selectedCourseId],
  );

  function handleRequestAmendment() {
    if (!selectedSummary || !amendReason.trim() || !currentUser) return;
    const req: AmendmentRequest = {
      id: BigInt(Date.now()),
      resultId: BigInt(0),
      studentId: BigInt(0),
      courseId: selectedSummary.course.id,
      originalCa: 0,
      originalExam: 0,
      newCa: 0,
      newExam: 0,
      reason: amendReason.trim(),
      lecturerName: currentUser.name,
      status: "pending_hod",
      createdAt: new Date().toISOString(),
    };
    addAmendmentRequest(req);
    toast.success("Amendment request submitted to HOD");
    setAmendOpen(false);
    setAmendReason("");
  }

  const canRequestAmendment = (status: string) =>
    ["submitted", "hod_approved", "dean_approved", "published"].includes(
      status,
    );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">My Results</h2>
        <p className="text-sm text-muted-foreground">
          View all your course score sheets. Once submitted, sheets are
          read-only.
        </p>
      </div>

      {myCourses.length === 0 ? (
        <Card>
          <CardContent
            className="py-12 text-center text-muted-foreground"
            data-ocid="lecturer_results.empty_state"
          >
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No courses assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Course Results Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-green-700">A</TableHead>
                    <TableHead className="text-blue-700">B</TableHead>
                    <TableHead className="text-yellow-700">C</TableHead>
                    <TableHead className="text-orange-700">D</TableHead>
                    <TableHead className="text-amber-700">E</TableHead>
                    <TableHead className="text-red-700">F</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSummaries.map((s, i) => {
                    const st = STATUS_MAP[s.status] ?? STATUS_MAP.draft;
                    return (
                      <TableRow
                        key={String(s.course.id)}
                        data-ocid={`lecturer_results.item.${i + 1}`}
                      >
                        <TableCell className="font-mono font-medium">
                          {s.course.code}
                        </TableCell>
                        <TableCell>{s.course.name}</TableCell>
                        <TableCell>{s.enrolled}</TableCell>
                        <TableCell className="text-green-700 font-medium">
                          {s.gradeCounts.A}
                        </TableCell>
                        <TableCell className="text-blue-700 font-medium">
                          {s.gradeCounts.B}
                        </TableCell>
                        <TableCell className="text-yellow-700 font-medium">
                          {s.gradeCounts.C}
                        </TableCell>
                        <TableCell className="text-orange-700 font-medium">
                          {s.gradeCounts.D}
                        </TableCell>
                        <TableCell className="text-amber-700 font-medium">
                          {s.gradeCounts.E}
                        </TableCell>
                        <TableCell className="text-red-700 font-medium">
                          {s.gradeCounts.F}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              data-ocid="lecturer_results.view.button"
                              onClick={() => setSelectedCourseId(s.course.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                            {canRequestAmendment(s.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                                data-ocid="lecturer_results.amend_button"
                                onClick={() => {
                                  setSelectedCourseId(s.course.id);
                                  setAmendOpen(true);
                                }}
                              >
                                <FileEdit className="w-3 h-3 mr-1" /> Amend
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-Only Score Sheet Modal */}
      <Dialog
        open={!!selectedCourseId && !amendOpen}
        onOpenChange={(o) => !o && setSelectedCourseId(null)}
      >
        <DialogContent
          className="sm:max-w-4xl max-h-[85vh] overflow-y-auto"
          data-ocid="lecturer_results.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              {selectedSummary?.course.code} — {selectedSummary?.course.name}
              <Badge variant="outline" className="ml-2 text-xs">
                Read-Only
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedSummary && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Status: </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(STATUS_MAP[selectedSummary.status] ?? STATUS_MAP.draft).cls}`}
                  >
                    {
                      (STATUS_MAP[selectedSummary.status] ?? STATUS_MAP.draft)
                        .label
                    }
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">
                    Total Students:{" "}
                  </span>
                  <strong>{selectedSummary.enrolled}</strong>
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>S/N</TableHead>
                      <TableHead>Matric No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>CA (/40)</TableHead>
                      <TableHead>Exam (/60)</TableHead>
                      <TableHead>Total (/100)</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>GP</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSummary.courseResults.map((r, idx) => {
                      const student = students.find(
                        (s) => String(s.id) === String(r.studentId),
                      );
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {student?.matricNumber ?? "-"}
                          </TableCell>
                          <TableCell>{student?.name ?? "-"}</TableCell>
                          <TableCell>{r.caScore}</TableCell>
                          <TableCell>{r.examScore}</TableCell>
                          <TableCell className="font-semibold">
                            {r.totalScore}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${gradeBadgeClass(r.grade)}`}
                            >
                              {r.grade}
                            </span>
                          </TableCell>
                          <TableCell>{r.gradePoint?.toFixed(1)}</TableCell>
                          <TableCell className="text-xs">{r.remarks}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {canRequestAmendment(selectedSummary.status) && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                    data-ocid="lecturer_results.open_modal_button"
                    onClick={() => setAmendOpen(true)}
                  >
                    <FileEdit className="w-4 h-4 mr-2" /> Request Amendment
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              data-ocid="lecturer_results.close_button"
              onClick={() => setSelectedCourseId(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment Request Dialog */}
      <Dialog open={amendOpen} onOpenChange={setAmendOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="lecturer_amendment.dialog"
        >
          <DialogHeader>
            <DialogTitle>Request Score Amendment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Course:{" "}
              <strong>
                {selectedSummary?.course.code} — {selectedSummary?.course.name}
              </strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="amend-reason">Reason for Amendment</Label>
              <Textarea
                id="amend-reason"
                data-ocid="lecturer_amendment.textarea"
                placeholder="Explain why scores need to be amended..."
                value={amendReason}
                onChange={(e) => setAmendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              data-ocid="lecturer_amendment.cancel_button"
              onClick={() => {
                setAmendOpen(false);
                setAmendReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="lecturer_amendment.submit_button"
              disabled={!amendReason.trim()}
              onClick={handleRequestAmendment}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
