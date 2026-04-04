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
  CheckCircle,
  Eye,
  GraduationCap,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface PGApplication {
  id: string;
  referenceNo: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nin: string;
  previousQualification: string;
  classOfDegree: string;
  institution: string;
  graduationYear: string;
  programme: "MSc" | "PGDE" | "PhD" | "MBA" | "PGD";
  departmentId: string;
  session: string;
  status: "pending" | "shortlisted" | "admitted" | "rejected";
  rejectionReason?: string;
  appliedAt: string;
  stateOfOrigin?: string;
}

const LS_KEY = "unipro_pg_applications";

function loadApps(): PGApplication[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveApps(data: PGApplication[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const STATUS_COLORS: Record<string, string> = {
  pending: "outline",
  shortlisted: "outline",
  admitted: "default",
  rejected: "destructive",
};

const PROGRAMMES = ["MSc", "PGDE", "PhD", "MBA", "PGD"] as const;
const QUALIFICATIONS = ["BSc", "HND", "BEd", "BEng", "BTech", "PGD", "Other"];
const DEGREE_CLASSES = [
  "First Class",
  "Second Class Upper",
  "Second Class Lower",
  "Third Class",
  "Pass",
];
const SESSIONS = ["2024/2025", "2023/2024"];

// ---- Admin Management Tab ----
export default function PGAdmissionTab() {
  const { currentUser, departments, addStudent, logAudit } = useApp();
  const [apps, setAppsState] = useState<PGApplication[]>(loadApps);
  const [search, setSearch] = useState("");
  const [filterProg, setFilterProg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [viewApp, setViewApp] = useState<PGApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState<string | null>(null);

  function persist(data: PGApplication[]) {
    setAppsState(data);
    saveApps(data);
  }

  function handleStatusUpdate(
    id: string,
    status: PGApplication["status"],
    reason?: string,
  ) {
    const updated = apps.map((a) =>
      a.id === id ? { ...a, status, rejectionReason: reason } : a,
    );
    persist(updated);
    toast.success(`Application ${status}`);
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      `PG Application ${status}`,
      `App ID ${id}`,
    );
  }

  function handleAdmit(app: PGApplication) {
    // Convert to student
    const dept = departments.find((d) => String(d.id) === app.departmentId);
    const newStudent = {
      id: BigInt(Date.now()),
      name: app.fullName,
      matricNumber: `PG/${app.session.split("/")[0]}/${String(apps.indexOf(app) + 1).padStart(3, "0")}`,
      level: BigInt(700),
      departmentId: dept?.id ?? BigInt(1),
      status: "Active",
      jambRegNo: app.referenceNo,
      programmeType: app.programme,
      admissionSession: app.session,
      phone: app.phone,
      nin: app.nin,
      dateOfBirth: app.dateOfBirth,
      entryMode: "UTME" as const,
    };
    addStudent(newStudent as Parameters<typeof addStudent>[0]);
    handleStatusUpdate(app.id, "admitted");
    toast.success(`${app.fullName} admitted and student record created!`);
  }

  const filtered = useMemo(
    () =>
      apps.filter((a) => {
        const matchSearch =
          !search ||
          a.fullName.toLowerCase().includes(search.toLowerCase()) ||
          a.referenceNo.toLowerCase().includes(search.toLowerCase());
        const matchProg = !filterProg || a.programme === filterProg;
        const matchStatus = !filterStatus || a.status === filterStatus;
        const matchDept = !filterDept || a.departmentId === filterDept;
        return matchSearch && matchProg && matchStatus && matchDept;
      }),
    [apps, search, filterProg, filterStatus, filterDept],
  );

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    shortlisted: apps.filter((a) => a.status === "shortlisted").length,
    admitted: apps.filter((a) => a.status === "admitted").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Postgraduate Admission Portal</h2>
        <a
          href="/pg-apply"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary underline"
        >
          Open PG Application Form →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          {
            label: "Shortlisted",
            value: stats.shortlisted,
            color: "text-blue-600",
          },
          { label: "Admitted", value: stats.admitted, color: "text-green-600" },
          {
            label: "Rejected",
            value: stats.rejected,
            color: "text-destructive",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2 text-muted-foreground" />
          <Input
            className="pl-8 w-56 h-8 text-sm"
            placeholder="Search by name or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterProg} onValueChange={setFilterProg}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="Programme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Programmes</SelectItem>
            {PROGRAMMES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="admitted">Admitted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Depts</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="no-print">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No PG applications found. Share the link at{" "}
                      <strong>/pg-apply</strong> with candidates.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">
                        {a.referenceNo}
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.fullName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.programme}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {departments.find(
                          (d) => String(d.id) === a.departmentId,
                        )?.name ?? a.departmentId}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.previousQualification} ({a.classOfDegree})
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(a.appliedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_COLORS[a.status] as
                              | "default"
                              | "outline"
                              | "destructive"
                          }
                        >
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewApp(a)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {a.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleStatusUpdate(a.id, "shortlisted")
                              }
                            >
                              <CheckCircle className="w-3 h-3 text-blue-500" />
                            </Button>
                          )}
                          {(a.status === "pending" ||
                            a.status === "shortlisted") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAdmit(a)}
                              >
                                <UserPlus className="w-3 h-3 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowReject(a.id)}
                              >
                                <XCircle className="w-3 h-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Application */}
      {viewApp && (
        <Dialog open={!!viewApp} onOpenChange={() => setViewApp(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>PG Application — {viewApp.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {(
                [
                  ["Reference No", viewApp.referenceNo],
                  ["Full Name", viewApp.fullName],
                  ["Email", viewApp.email],
                  ["Phone", viewApp.phone],
                  ["Date of Birth", viewApp.dateOfBirth],
                  ["NIN", viewApp.nin],
                  ["State of Origin", viewApp.stateOfOrigin ?? "-"],
                  ["Previous Qualification", viewApp.previousQualification],
                  ["Class of Degree", viewApp.classOfDegree],
                  ["Institution Attended", viewApp.institution],
                  ["Graduation Year", viewApp.graduationYear],
                  ["Programme Applied", viewApp.programme],
                  [
                    "Department",
                    departments.find(
                      (d) => String(d.id) === viewApp.departmentId,
                    )?.name ?? viewApp.departmentId,
                  ],
                  ["Session", viewApp.session],
                  ["Status", viewApp.status],
                  ...(viewApp.rejectionReason
                    ? [["Rejection Reason", viewApp.rejectionReason]]
                    : []),
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-1">
                  <span className="font-semibold text-muted-foreground">
                    {k}:
                  </span>
                  <span className="text-right">{v}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewApp(null)}>
                Close
              </Button>
              {(viewApp.status === "pending" ||
                viewApp.status === "shortlisted") && (
                <Button
                  onClick={() => {
                    handleAdmit(viewApp);
                    setViewApp(null);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-1" /> Admit
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {showReject && (
        <Dialog open={!!showReject} onOpenChange={() => setShowReject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide reason..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReject(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (showReject)
                    handleStatusUpdate(showReject, "rejected", rejectReason);
                  setShowReject(null);
                  setRejectReason("");
                }}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---- PG Application types export ----
export {
  PROGRAMMES,
  QUALIFICATIONS,
  DEGREE_CLASSES,
  SESSIONS,
  loadApps,
  saveApps,
};
