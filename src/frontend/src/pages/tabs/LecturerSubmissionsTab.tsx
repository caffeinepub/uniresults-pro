import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function LecturerSubmissionsTab() {
  const {
    currentUser,
    results,
    courses,
    staffMembers,
    updateResultStatus,
    addNotification,
  } = useApp();

  const [rejectCourseId, setRejectCourseId] = useState<bigint | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const hodDeptId = (currentUser as any)?.departmentId;

  // Get courses belonging to HOD's department
  const deptCourses = courses.filter(
    (c) => String(c.departmentId) === String(hodDeptId),
  );
  const deptCourseIds = new Set(deptCourses.map((c) => String(c.id)));

  // Get submitted results in HOD's department
  const submittedResults = results.filter(
    (r) => r.status === "submitted" && deptCourseIds.has(String(r.courseId)),
  );

  // Group by courseId
  const grouped = deptCourses
    .filter((c) =>
      submittedResults.some((r) => String(r.courseId) === String(c.id)),
    )
    .map((course) => {
      const courseResults = submittedResults.filter(
        (r) => String(r.courseId) === String(course.id),
      );
      const firstResult = courseResults[0] as any;
      // Try to find the lecturer from staff or from result
      const lecturerId = firstResult?.lecturerId ?? firstResult?.submittedBy;
      const lecturerStaff = staffMembers?.find(
        (s) =>
          String(s.id) === String(lecturerId) ||
          s.name === firstResult?.lecturerName,
      );
      const lecturerName =
        firstResult?.lecturerName ?? lecturerStaff?.name ?? "Unknown Lecturer";
      const submittedAt = firstResult?.submittedAt
        ? new Date(firstResult.submittedAt).toLocaleDateString()
        : "—";
      return {
        course,
        results: courseResults,
        lecturerName,
        submittedAt,
        studentCount: courseResults.length,
      };
    });

  const handleApprove = (courseId: bigint, courseName: string) => {
    const courseResults = submittedResults.filter(
      (r) => String(r.courseId) === String(courseId),
    );
    for (const r of courseResults) {
      updateResultStatus(r.id, "hod_approved");
    }
    addNotification(
      "Dean",
      `Results for ${courseName} approved by HOD — ready for Dean review`,
      "results_processing",
    );
    toast.success(`Results for ${courseName} approved and forwarded to Dean`);
  };

  const handleReject = () => {
    if (!rejectCourseId || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    const courseResults = submittedResults.filter(
      (r) => String(r.courseId) === String(rejectCourseId),
    );
    for (const r of courseResults) {
      updateResultStatus(r.id, "draft", rejectReason);
    }
    const course = courses.find((c) => String(c.id) === String(rejectCourseId));
    addNotification(
      "Lecturer",
      `Results for ${course?.code ?? "course"} were rejected by HOD: ${rejectReason}`,
      "score_sheet",
    );
    toast.success("Results returned to Lecturer for correction");
    setRejectCourseId(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card className="bg-card border border-border rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Lecturer Submissions Pending HOD Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {grouped.length} pending submission
                {grouped.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Review and approve or reject submitted score sheets before
              forwarding to the Dean.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {grouped.length === 0 ? (
        <div
          data-ocid="lecturer_submissions.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <CheckCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No pending lecturer submissions
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            All submitted results have been reviewed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold">S/N</TableHead>
                <TableHead className="text-xs font-semibold">
                  Lecturer Name
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Course Code
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Course Title
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Students
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Submitted
                </TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((row, idx) => (
                <TableRow
                  key={String(row.course.id)}
                  className="hover:bg-muted/20"
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {row.lecturerName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">
                      {row.course.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{row.course.name}</TableCell>
                  <TableCell className="text-xs text-center">
                    {row.studentCount}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.submittedAt}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                      Awaiting HOD Review
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        data-ocid={`lecturer_submissions.confirm_button.${idx + 1}`}
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          handleApprove(
                            row.course.id,
                            `${row.course.code} – ${row.course.name}`,
                          )
                        }
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve → Dean
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`lecturer_submissions.delete_button.${idx + 1}`}
                        className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => {
                          setRejectCourseId(row.course.id);
                          setRejectReason("");
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject dialog */}
      <AlertDialog
        open={rejectCourseId !== null}
        onOpenChange={(open) => !open && setRejectCourseId(null)}
      >
        <AlertDialogContent data-ocid="lecturer_submissions.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submitted Results</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. The results will be
              returned to the Lecturer as a draft for correction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2">
            <Textarea
              data-ocid="lecturer_submissions.textarea"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="lecturer_submissions.cancel_button"
              onClick={() => setRejectCourseId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="lecturer_submissions.confirm_button"
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleReject}
            >
              Reject & Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
