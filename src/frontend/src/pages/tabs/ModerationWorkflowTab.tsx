import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CheckCircle2, ClipboardCheck, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

// Moderation records stored in localStorage
const MOD_KEY = "unipro_moderation";

interface ModerationRecord {
  courseId: string;
  moderatorId: string;
  status: "pending" | "approved";
  approvedAt?: string;
}

function getModerationRecords(): ModerationRecord[] {
  try {
    return JSON.parse(localStorage.getItem(MOD_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveModerationRecords(records: ModerationRecord[]) {
  localStorage.setItem(MOD_KEY, JSON.stringify(records));
}

export function getModerationStatus(
  courseId: string,
): "pending" | "approved" | "none" {
  const records = getModerationRecords();
  const rec = records.find((r) => r.courseId === courseId);
  return rec ? rec.status : "none";
}

export default function ModerationWorkflowTab() {
  const { courses, departments, staffMembers, currentUser, results } = useApp();

  const [modRecords, setModRecords] =
    useState<ModerationRecord[]>(getModerationRecords);
  const [assignCourse, setAssignCourse] = useState("");
  const [assignModerator, setAssignModerator] = useState("");

  const lecturers = staffMembers.filter((s) => s.role === "Lecturer");

  const coursesWithRegistrations = useMemo(() => {
    const courseIdsWithResults = new Set(
      results.map((r) => String(r.courseId)),
    );
    return courses.filter((c) => courseIdsWithResults.has(String(c.id)));
  }, [courses, results]);

  // If user is a Lecturer, show only courses assigned to them for moderation
  const isLecturer = currentUser?.role === "Lecturer";
  const myModCourses = useMemo(() => {
    if (!isLecturer) return [];
    return modRecords
      .filter(
        (mr) =>
          mr.moderatorId === String((currentUser as any)?.staffId) ||
          mr.moderatorId === currentUser?.name,
      )
      .map((mr) => ({
        mr,
        course: courses.find((c) => String(c.id) === mr.courseId),
        dept: departments.find((d) =>
          courses.find((c) => String(c.id) === mr.courseId)
            ? String(d.id) ===
              String(
                (courses.find((c) => String(c.id) === mr.courseId) as any)
                  ?.departmentId,
              )
            : false,
        ),
      }));
  }, [isLecturer, modRecords, courses, departments, currentUser]);

  function handleAssign() {
    if (!assignCourse || !assignModerator) {
      toast.error("Select a course and moderator.");
      return;
    }
    const updated = [
      ...modRecords.filter((r) => r.courseId !== assignCourse),
      {
        courseId: assignCourse,
        moderatorId: assignModerator,
        status: "pending" as const,
      },
    ];
    saveModerationRecords(updated);
    setModRecords(updated);
    toast.success("Moderator assigned.");
    setAssignCourse("");
    setAssignModerator("");
  }

  function handleApprove(courseId: string) {
    const updated = modRecords.map((r) =>
      r.courseId === courseId
        ? {
            ...r,
            status: "approved" as const,
            approvedAt: new Date().toISOString(),
          }
        : r,
    );
    saveModerationRecords(updated);
    setModRecords(updated);
    toast.success("Moderation approved — Lecturer can now submit to HOD.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Moderation Workflow</h2>
      </div>

      {/* Assign Moderator (HOD/Registrar) */}
      {!isLecturer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Assign Moderator to Course
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <p className="text-xs text-muted-foreground mb-1">Course</p>
              <Select value={assignCourse} onValueChange={setAssignCourse}>
                <SelectTrigger data-ocid="mod.course.select">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {coursesWithRegistrations.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-40">
              <label
                htmlFor="mod-moderator"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Moderator (Lecturer)
              </label>
              <Select
                value={assignModerator}
                onValueChange={setAssignModerator}
              >
                <SelectTrigger data-ocid="mod.moderator.select">
                  <SelectValue placeholder="Select moderator..." />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((l) => (
                    <SelectItem key={String(l.id)} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} data-ocid="mod.assign.button">
              Assign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Moderator view — courses to review */}
      {isLecturer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Courses Assigned to Me for Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myModCourses.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground"
                data-ocid="mod.empty_state"
              >
                No courses assigned to you for moderation.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myModCourses.map(({ mr, course, dept }, idx) => (
                    <TableRow
                      key={mr.courseId}
                      data-ocid={`mod.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {course?.code} — {course?.name}
                      </TableCell>
                      <TableCell className="text-xs">{dept?.name}</TableCell>
                      <TableCell>
                        {mr.status === "approved" ? (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 border-amber-400"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {mr.status === "pending" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            data-ocid={`mod.approve_button.${idx + 1}`}
                            onClick={() => handleApprove(mr.courseId)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve Moderation
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All moderation records (admin/hod view) */}
      {!isLecturer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Moderation Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {modRecords.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground"
                data-ocid="mod.records.empty_state"
              >
                No moderation records yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Moderator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modRecords.map((mr, idx) => {
                    const course = courses.find(
                      (c) => String(c.id) === mr.courseId,
                    );
                    const mod = staffMembers.find(
                      (s) => String(s.id) === mr.moderatorId,
                    );
                    return (
                      <TableRow
                        key={mr.courseId}
                        data-ocid={`mod.record.${idx + 1}`}
                      >
                        <TableCell className="font-mono text-xs">
                          {course?.code} — {course?.name}
                        </TableCell>
                        <TableCell>{mod?.name ?? mr.moderatorId}</TableCell>
                        <TableCell>
                          {mr.status === "approved" ? (
                            <Badge className="bg-success/10 text-success border-success/20 text-xs">
                              Approved
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-amber-600 border-amber-400"
                            >
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {mr.approvedAt
                            ? new Date(mr.approvedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
