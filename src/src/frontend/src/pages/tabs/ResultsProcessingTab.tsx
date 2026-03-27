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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useApp } from "@/context/AppContext";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Eye,
  FileCheck,
  Lock,
  Send,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useContext } from "react";
import { toast } from "sonner";
import { TabContext } from "../../components/Layout";

export interface Props {
  userRole: "Lecturer" | "HOD" | "Dean" | "Registrar";
}

type CourseStatus =
  | "draft"
  | "submitted"
  | "hod_approved"
  | "dean_approved"
  | "approved"
  | "published"
  | "rejected";

function deriveCourseStatus(statuses: string[]): CourseStatus {
  if (statuses.length === 0) return "draft";
  if (statuses.some((s) => s === "published")) return "published";
  if (statuses.some((s) => s === "approved")) return "approved";
  if (statuses.some((s) => s === "dean_approved")) return "dean_approved";
  if (statuses.some((s) => s === "hod_approved")) return "hod_approved";
  if (statuses.some((s) => s === "submitted")) return "submitted";
  if (statuses.some((s) => s === "pending")) return "draft";
  // rejected = pending with rejectionReason
  return "draft";
}

function StatusBadgeComp({ status }: { status: CourseStatus | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    pending: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    submitted: {
      label: "Submitted",
      cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    hod_approved: {
      label: "HOD Approved",
      cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    dean_approved: {
      label: "Dean Approved",
      cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    approved: {
      label: "Dean Approved",
      cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    published: {
      label: "Published",
      cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
  };
  const entry = map[status] ?? map.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}

export default function ResultsProcessingTab({ userRole }: Props) {
  const {
    courses,
    departments,
    faculties,
    results,
    students,
    staffMembers,
    currentUser,
    academicCalendars,
    submitCourseResults,
    approveResultsByCourse,
    rejectResultsByCourse,
    publishResultsByCourse,
    publishResultsBatch,
  } = useApp();

  const { setActiveTab } = useContext(TabContext);

  const [filterSession, setFilterSession] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    courseId: string;
    comment: string;
  }>({ open: false, courseId: "", comment: "" });

  // Seal semester dialog
  const [sealDialog, setSealDialog] = useState(false);

  const activeCal = academicCalendars.find((c) => c.isActive);

  // Build course list with status derived from results
  const courseRows = useMemo(() => {
    return courses
      .filter((c) => {
        if (userRole === "Lecturer") {
          return (
            c.lecturerPrincipal === currentUser?.principal ||
            c.lecturerPrincipal === currentUser?.name
          );
        }
        if (userRole === "HOD" && currentUser?.departmentId) {
          return c.departmentId === currentUser.departmentId;
        }
        return true;
      })
      .map((c) => {
        const dept = departments.find(
          (d) => String(d.id) === String(c.departmentId),
        );
        const faculty = dept
          ? faculties.find(
              (f) => String(f.id) === String((dept as any).facultyId),
            )
          : null;
        const lecturer =
          staffMembers.find(
            (s) =>
              s.name === c.lecturerPrincipal ||
              s.id?.toString() === c.lecturerPrincipal,
          ) ?? null;
        const lecturerName = lecturer?.name ?? c.lecturerPrincipal ?? "";

        const courseResults = results.filter((r) => r.courseId === c.id);
        const scored = courseResults.filter(
          (r) => r.caScore !== undefined || r.examScore !== undefined,
        );
        const statuses = courseResults.map((r) => r.status);

        // Determine if any result is rejected (pending + rejectionReason)
        const hasRejection = courseResults.some(
          (r) => r.status === "pending" && (r as any).rejectionReason,
        );
        let courseStatus: CourseStatus = deriveCourseStatus(statuses);
        if (hasRejection && courseStatus === "draft") courseStatus = "rejected";

        const rejectionComment =
          courseResults.find((r) => (r as any).rejectionReason)
            ?.rejectionReason ?? "";

        // enrolled students count from courseResults or students in dept
        const enrolledCount =
          courseResults.length > 0
            ? courseResults.length
            : students.filter((s) => s.departmentId === c.departmentId).length;
        const scoredCount = scored.length;
        const pendingCount = enrolledCount - scoredCount;

        return {
          course: c,
          dept,
          faculty,
          lecturerName,
          status: courseStatus,
          rejectionComment,
          enrolledCount,
          scoredCount,
          pendingCount,
          resultCount: courseResults.length,
        };
      })
      .filter((row) => {
        if (
          filterSession &&
          activeCal?.session &&
          !activeCal.session.toLowerCase().includes(filterSession.toLowerCase())
        )
          return false;
        if (filterSemester !== "all" && row.course.semester !== filterSemester)
          return false;
        if (
          filterDept !== "all" &&
          row.course.departmentId.toString() !== filterDept
        )
          return false;
        return true;
      });
  }, [
    courses,
    departments,
    faculties,
    results,
    students,
    staffMembers,
    currentUser,
    userRole,
    filterSession,
    filterSemester,
    filterDept,
    activeCal,
  ]);

  // Role-filtered view
  const visibleRows = useMemo(() => {
    if (userRole === "HOD")
      return courseRows.filter((r) =>
        ["submitted", "draft", "rejected", "hod_approved"].includes(r.status),
      );
    if (userRole === "Dean")
      return courseRows.filter((r) =>
        ["hod_approved", "dean_approved"].includes(r.status),
      );
    if (userRole === "Registrar")
      return courseRows.filter((r) =>
        ["dean_approved", "approved", "published"].includes(r.status),
      );
    return courseRows;
  }, [courseRows, userRole]);

  // Stats for Registrar
  const stats = useMemo(() => {
    const pending = courseRows.filter((r) =>
      ["submitted", "hod_approved"].includes(r.status),
    ).length;
    const approved = courseRows.filter((r) =>
      ["dean_approved", "approved"].includes(r.status),
    ).length;
    const published = courseRows.filter((r) => r.status === "published").length;
    return { pending, approved, published };
  }, [courseRows]);

  const toggleSelect = (courseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleBatchSubmit = () => {
    if (selected.size === 0) return;
    for (const id of selected) submitCourseResults(BigInt(id));
    setSelected(new Set());
    toast.success(`Submitted ${selected.size} course(s) for approval`);
  };

  const handleBatchApprove = () => {
    if (selected.size === 0) return;
    const level =
      userRole === "HOD" ? "hod" : userRole === "Dean" ? "dean" : "registrar";
    for (const id of selected) approveResultsByCourse(BigInt(id), level as any);
    setSelected(new Set());
    toast.success(`Approved ${selected.size} course(s)`);
  };

  const handleBatchPublish = () => {
    if (selected.size === 0) return;
    publishResultsBatch(Array.from(selected).map((id) => BigInt(id)));
    setSelected(new Set());
    toast.success(`Published ${selected.size} course(s)`);
  };

  const handleSealSemester = () => {
    const toPublish = courseRows
      .filter((r) => ["dean_approved", "approved"].includes(r.status))
      .map((r) => r.course.id);
    publishResultsBatch(toPublish);
    setSealDialog(false);
    toast.success("Semester sealed — all approved results published");
  };

  // Group by faculty + dept
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: typeof visibleRows }>();
    for (const row of visibleRows) {
      const key = `${row.faculty?.name ?? "Unknown Faculty"} > ${row.dept?.name ?? "Unknown Dept"}`;
      if (!map.has(key)) map.set(key, { label: key, rows: [] });
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.entries());
  }, [visibleRows]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Results Processing Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {userRole === "Lecturer" && "Submit score sheets for approval"}
            {userRole === "HOD" && "Review and approve submitted results"}
            {userRole === "Dean" && "Approve HOD-reviewed results"}
            {userRole === "Registrar" &&
              "Publish approved results to student portal"}
          </p>
        </div>
        {/* Registrar stats */}
        {userRole === "Registrar" && (
          <div className="flex gap-3 flex-wrap">
            <div className="text-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {stats.pending}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Pending
              </div>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {stats.approved}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Approved
              </div>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {stats.published}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Published
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label
                htmlFor="filter-session"
                className="text-xs font-medium text-muted-foreground"
              >
                Session
              </label>
              <input
                id="filter-session"
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="e.g. 2024/2025"
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                data-ocid="results_processing.search_input"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label
                htmlFor="filter-semester"
                className="text-xs font-medium text-muted-foreground"
              >
                Semester
              </label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger
                  className="h-8"
                  data-ocid="results_processing.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label
                htmlFor="filter-dept"
                className="text-xs font-medium text-muted-foreground"
              >
                Department
              </label>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id.toString()} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selected.size} course(s) selected
          </span>
          {userRole === "Lecturer" && (
            <Button
              size="sm"
              onClick={handleBatchSubmit}
              data-ocid="results_processing.primary_button"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit Selected
            </Button>
          )}
          {(userRole === "HOD" || userRole === "Dean") && (
            <Button
              size="sm"
              onClick={handleBatchApprove}
              data-ocid="results_processing.primary_button"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Approve Selected
            </Button>
          )}
          {userRole === "Registrar" && (
            <Button
              size="sm"
              onClick={handleBatchPublish}
              data-ocid="results_processing.primary_button"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5" />
              Publish Selected
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Seal semester (Registrar) */}
      {userRole === "Registrar" && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300"
            onClick={() => setSealDialog(true)}
            data-ocid="results_processing.secondary_button"
          >
            <Lock className="w-4 h-4 mr-2" />
            Seal Semester
          </Button>
        </div>
      )}

      {/* Course groups */}
      {grouped.length === 0 ? (
        <Card data-ocid="results_processing.empty_state">
          <CardContent className="py-12 text-center">
            <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No courses found for the selected filters
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([groupKey, group]) => (
          <Card key={groupKey} className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                {groupKey}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-5">
                      <Checkbox
                        checked={
                          group.rows.length > 0 &&
                          group.rows.every((r) =>
                            selected.has(r.course.id.toString()),
                          )
                        }
                        onCheckedChange={() => {
                          const allSelected = group.rows.every((r) =>
                            selected.has(r.course.id.toString()),
                          );
                          setSelected((prev) => {
                            const next = new Set(prev);
                            for (const r of group.rows) {
                              if (allSelected)
                                next.delete(r.course.id.toString());
                              else next.add(r.course.id.toString());
                            }
                            return next;
                          });
                        }}
                        data-ocid="results_processing.checkbox"
                      />
                    </TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rows.map((row, idx) => (
                    <TableRow
                      key={row.course.id.toString()}
                      data-ocid={`results_processing.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5">
                        <Checkbox
                          checked={selected.has(row.course.id.toString())}
                          onCheckedChange={() =>
                            toggleSelect(row.course.id.toString())
                          }
                          data-ocid={`results_processing.checkbox.${idx + 1}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {row.course.code}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {row.course.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.lecturerName || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.scoredCount} scored / {row.enrolledCount} enrolled
                        {row.pendingCount > 0 && (
                          <span className="text-amber-500">
                            {" "}
                            ({row.pendingCount} pending)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadgeComp status={row.status} />
                        {row.rejectionComment && (
                          <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate">
                            {row.rejectionComment}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Lecturer: submit */}
                          {userRole === "Lecturer" &&
                            ["draft", "rejected"].includes(row.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  submitCourseResults(row.course.id);
                                  toast.success(
                                    `${row.course.code} submitted for approval`,
                                  );
                                }}
                                data-ocid={`results_processing.submit_button.${idx + 1}`}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Submit
                              </Button>
                            )}

                          {/* View score sheet */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setActiveTab("score_sheet")}
                            data-ocid={`results_processing.secondary_button.${idx + 1}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Sheet
                          </Button>

                          {/* HOD: approve / reject */}
                          {userRole === "HOD" && row.status === "submitted" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => {
                                  approveResultsByCourse(row.course.id, "hod");
                                  toast.success(`${row.course.code} approved`);
                                }}
                                data-ocid={`results_processing.confirm_button.${idx + 1}`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setRejectDialog({
                                    open: true,
                                    courseId: row.course.id.toString(),
                                    comment: "",
                                  })
                                }
                                data-ocid={`results_processing.delete_button.${idx + 1}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Dean: approve / send back */}
                          {userRole === "Dean" &&
                            row.status === "hod_approved" && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                                  onClick={() => {
                                    approveResultsByCourse(
                                      row.course.id,
                                      "dean",
                                    );
                                    toast.success(
                                      `${row.course.code} approved`,
                                    );
                                  }}
                                  data-ocid={`results_processing.confirm_button.${idx + 1}`}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      courseId: row.course.id.toString(),
                                      comment: "",
                                    })
                                  }
                                  data-ocid={`results_processing.delete_button.${idx + 1}`}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Send Back
                                </Button>
                              </>
                            )}

                          {/* Registrar: publish */}
                          {userRole === "Registrar" &&
                            ["dean_approved", "approved"].includes(
                              row.status,
                            ) && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    publishResultsByCourse(row.course.id);
                                    toast.success(
                                      `${row.course.code} published`,
                                    );
                                  }}
                                  data-ocid={`results_processing.confirm_button.${idx + 1}`}
                                >
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  Publish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      courseId: row.course.id.toString(),
                                      comment: "",
                                    })
                                  }
                                  data-ocid={`results_processing.delete_button.${idx + 1}`}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Send Back
                                </Button>
                              </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Rejection Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent data-ocid="results_processing.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reject / Send Back Results
            </AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejection. The lecturer will see this comment
              and can revise and resubmit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            className="min-h-[100px]"
            value={rejectDialog.comment}
            onChange={(e) =>
              setRejectDialog((d) => ({ ...d, comment: e.target.value }))
            }
            data-ocid="results_processing.textarea"
          />
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="results_processing.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!rejectDialog.comment.trim()) {
                  toast.error("Please provide a rejection reason");
                  return;
                }
                rejectResultsByCourse(
                  BigInt(rejectDialog.courseId),
                  rejectDialog.comment,
                );
                setRejectDialog({ open: false, courseId: "", comment: "" });
                toast.success("Results sent back with comment");
              }}
              data-ocid="results_processing.confirm_button"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seal Semester Dialog */}
      <AlertDialog open={sealDialog} onOpenChange={setSealDialog}>
        <AlertDialogContent data-ocid="results_processing.modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              Seal Semester
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will publish ALL dean-approved results for the active
              semester at once. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="results_processing.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSealSemester}
              data-ocid="results_processing.confirm_button"
            >
              Seal &amp; Publish All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
