import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardList,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Mail,
  Printer,
  Search,
  Upload,
  UserCheck,
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
  status:
    | "pending"
    | "shortlisted"
    | "screening_scheduled"
    | "interview_scheduled"
    | "interview_done"
    | "admission_letter_issued"
    | "registered"
    | "matriculated"
    | "active_pg_student"
    | "rejected";
  rejectionReason?: string;
  appliedAt: string;
  stateOfOrigin?: string;
  // Pipeline extensions
  interviewDate?: string;
  interviewVenue?: string;
  interviewNotes?: string;
  admissionLetterIssued?: boolean;
  admissionLetterDate?: string;
  pgRegistered?: boolean;
  pgRegisteredCourses?: string[];
  matriculated?: boolean;
  matriculationDate?: string;
  matriculationNo?: string;
  documents?: { name: string; url: string; type: string }[];
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

const STATUS_COLORS: Record<PGApplication["status"], string> = {
  pending: "outline",
  shortlisted: "secondary",
  screening_scheduled: "secondary",
  interview_scheduled: "secondary",
  interview_done: "secondary",
  admission_letter_issued: "default",
  registered: "default",
  matriculated: "default",
  active_pg_student: "default",
  rejected: "destructive",
};

const STATUS_LABELS: Record<PGApplication["status"], string> = {
  pending: "Pending Review",
  shortlisted: "Shortlisted",
  screening_scheduled: "Screening Scheduled",
  interview_scheduled: "Interview Scheduled",
  interview_done: "Interview Done",
  admission_letter_issued: "Offer Letter Issued",
  registered: "PG Registered",
  matriculated: "Matriculated",
  active_pg_student: "Active PG Student",
  rejected: "Rejected",
};

const PIPELINE_STEPS = [
  { key: "pending", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "interview_done", label: "Screened" },
  { key: "admission_letter_issued", label: "Offer Issued" },
  { key: "registered", label: "Registered" },
  { key: "matriculated", label: "Matriculated" },
  { key: "active_pg_student", label: "Active" },
];

const STATUS_ORDER = PIPELINE_STEPS.map((s) => s.key);

function pipelineStep(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx < 0 ? 0 : idx;
}

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

const REQUIRED_DOCS = [
  "O-Level Certificate (WAEC/NECO)",
  "First Degree Certificate",
  "Academic Transcript",
  "NYSC Discharge Certificate",
  "Birth Certificate / Declaration of Age",
  "Passport Photograph",
  "Medical Certificate",
  "Local Government Identification",
];

export default function PGAdmissionTab() {
  const {
    currentUser,
    departments,
    addStudent,
    logAudit,
    institutionSettings,
  } = useApp();
  const [apps, setAppsState] = useState<PGApplication[]>(loadApps);
  const [search, setSearch] = useState("");
  const [filterProg, setFilterProg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [viewApp, setViewApp] = useState<PGApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState<string | null>(null);

  // Interview modal
  const [interviewModal, setInterviewModal] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    date: "",
    venue: "",
    notes: "",
  });

  // Interview done modal
  const [interviewDoneModal, setInterviewDoneModal] = useState<string | null>(
    null,
  );
  const [interviewDoneNotes, setInterviewDoneNotes] = useState("");

  // Admission letter modal
  const [letterModal, setLetterModal] = useState<PGApplication | null>(null);

  // Course registration modal
  const [courseRegModal, setCourseRegModal] = useState<string | null>(null);
  const [courseRegInput, setCourseRegInput] = useState("");

  // Matriculation modal
  const [matricModal, setMatricModal] = useState<string | null>(null);
  const [matricNo, setMatricNo] = useState("");

  function persist(data: PGApplication[]) {
    setAppsState(data);
    saveApps(data);
  }

  function update(id: string, patch: Partial<PGApplication>) {
    persist(apps.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function handleStatusUpdate(
    id: string,
    status: PGApplication["status"],
    reason?: string,
  ) {
    update(id, { status, ...(reason ? { rejectionReason: reason } : {}) });
    toast.success(`Application updated: ${STATUS_LABELS[status]}`);
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      `PG Application ${status}`,
      `App ID ${id}`,
    );
  }

  function handleAdmit(app: PGApplication) {
    const dept = departments.find((d) => String(d.id) === app.departmentId);
    const newStudent = {
      id: BigInt(Date.now()),
      name: app.fullName,
      matricNumber:
        app.matriculationNo ||
        `PG/${app.session.split("/")[0]}/${String(apps.indexOf(app) + 1).padStart(3, "0")}`,
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
    update(app.id, {
      status: "active_pg_student",
      pgRegistered: true,
      admissionLetterIssued: true,
    });
    toast.success(`${app.fullName} admitted and student record created!`);
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "PG Admission",
      `${app.fullName} admitted as PG student`,
    );
  }

  function handleScheduleInterview(id: string) {
    if (!interviewForm.date || !interviewForm.venue) {
      toast.error("Date and venue are required");
      return;
    }
    update(id, {
      status: "interview_scheduled",
      interviewDate: interviewForm.date,
      interviewVenue: interviewForm.venue,
      interviewNotes: interviewForm.notes,
    });
    setInterviewModal(null);
    setInterviewForm({ date: "", venue: "", notes: "" });
    toast.success("Interview scheduled successfully");
  }

  function handleMarkInterviewDone(id: string) {
    update(id, {
      status: "interview_done",
      interviewNotes: interviewDoneNotes,
    });
    setInterviewDoneModal(null);
    setInterviewDoneNotes("");
    toast.success("Interview marked as completed");
  }

  function handleIssueAdmissionLetter(app: PGApplication) {
    update(app.id, {
      status: "admission_letter_issued",
      admissionLetterIssued: true,
      admissionLetterDate: new Date().toISOString().split("T")[0],
    });
    setLetterModal(app);
    toast.success("Admission letter issued");
  }

  function handleRegisterCourses(id: string) {
    const codes = courseRegInput
      .split(/[,\n]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      toast.error("Enter at least one course code");
      return;
    }
    update(id, {
      status: "registered",
      pgRegistered: true,
      pgRegisteredCourses: codes,
    });
    setCourseRegModal(null);
    setCourseRegInput("");
    toast.success(`${codes.length} course(s) registered`);
  }

  function handleMatriculate(id: string) {
    if (!matricNo.trim()) {
      toast.error("Matriculation number is required");
      return;
    }
    update(id, {
      status: "matriculated",
      matriculated: true,
      matriculationDate: new Date().toISOString().split("T")[0],
      matriculationNo: matricNo.trim(),
    });
    setMatricModal(null);
    setMatricNo("");
    toast.success("Student matriculated successfully");
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "PG Matriculation",
      `App ID ${id} matriculated as ${matricNo}`,
    );
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
    shortlisted: apps.filter(
      (a) =>
        a.status === "shortlisted" ||
        a.status === "screening_scheduled" ||
        a.status === "interview_scheduled" ||
        a.status === "interview_done",
    ).length,
    admitted: apps.filter((a) =>
      [
        "admission_letter_issued",
        "registered",
        "matriculated",
        "active_pg_student",
      ].includes(a.status),
    ).length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          Postgraduate Admission Pipeline
        </h2>
        <a
          href="/pg-apply"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary underline"
          data-ocid="pg_admission.apply_link"
        >
          Open PG Application Form →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          {
            label: "In Pipeline",
            value: stats.shortlisted,
            color: "text-blue-600",
          },
          {
            label: "Admitted/Active",
            value: stats.admitted,
            color: "text-green-600",
          },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 no-print">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2 text-muted-foreground" />
          <Input
            className="pl-8 w-56 h-8 text-sm"
            placeholder="Search by name or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="pg_admission.search_input"
          />
        </div>
        <Select value={filterProg} onValueChange={setFilterProg}>
          <SelectTrigger
            className="w-32 h-8 text-sm"
            data-ocid="pg_admission.prog.select"
          >
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
          <SelectTrigger
            className="w-44 h-8 text-sm"
            data-ocid="pg_admission.status.select"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as PGApplication["status"][]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger
            className="w-48 h-8 text-sm"
            data-ocid="pg_admission.dept.select"
          >
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

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="pg_admission.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Pipeline</TableHead>
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
                      data-ocid="pg_admission.empty_state"
                    >
                      No PG applications found. Share the link at{" "}
                      <strong>/pg-apply</strong> with candidates.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a, idx) => (
                    <TableRow
                      key={a.id}
                      data-ocid={`pg_admission.item.${idx + 1}`}
                    >
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
                      <TableCell className="min-w-24">
                        <Progress
                          value={
                            ((pipelineStep(a.status) + 1) /
                              PIPELINE_STEPS.length) *
                            100
                          }
                          className="h-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Step {pipelineStep(a.status) + 1}/
                          {PIPELINE_STEPS.length}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_COLORS[a.status] as
                              | "default"
                              | "outline"
                              | "secondary"
                              | "destructive"
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {STATUS_LABELS[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewApp(a)}
                            title="View Details"
                            data-ocid={`pg_admission.view.${idx + 1}`}
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
                              title="Shortlist"
                              data-ocid={`pg_admission.shortlist.${idx + 1}`}
                            >
                              <CheckCircle className="w-3 h-3 text-blue-500" />
                            </Button>
                          )}
                          {(a.status === "pending" ||
                            a.status === "shortlisted") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setInterviewModal(a.id)}
                              title="Schedule Interview"
                              data-ocid={`pg_admission.schedule_interview.${idx + 1}`}
                            >
                              <Calendar className="w-3 h-3 text-amber-500" />
                            </Button>
                          )}
                          {a.status === "interview_scheduled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setInterviewDoneModal(a.id);
                                setInterviewDoneNotes(a.interviewNotes ?? "");
                              }}
                              title="Mark Interview Done"
                              data-ocid={`pg_admission.mark_interview_done.${idx + 1}`}
                            >
                              <UserCheck className="w-3 h-3 text-green-600" />
                            </Button>
                          )}
                          {a.status === "interview_done" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleIssueAdmissionLetter(a)}
                              title="Issue Admission Letter"
                              data-ocid={`pg_admission.issue_letter.${idx + 1}`}
                            >
                              <Mail className="w-3 h-3 text-primary" />
                            </Button>
                          )}
                          {a.status === "admission_letter_issued" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCourseRegModal(a.id)}
                              title="PG Course Registration"
                              data-ocid={`pg_admission.register_courses.${idx + 1}`}
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600" />
                            </Button>
                          )}
                          {a.status === "registered" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setMatricModal(a.id);
                                setMatricNo(
                                  a.matriculationNo ??
                                    `PG/${a.session.split("/")[0]}/${String(apps.indexOf(a) + 1).padStart(3, "0")}`,
                                );
                              }}
                              title="Matriculate"
                              data-ocid={`pg_admission.matriculate.${idx + 1}`}
                            >
                              <GraduationCap className="w-3 h-3 text-green-700" />
                            </Button>
                          )}
                          {a.status === "matriculated" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAdmit(a)}
                              title="Activate as PG Student"
                              data-ocid={`pg_admission.activate.${idx + 1}`}
                            >
                              <UserPlus className="w-3 h-3 text-green-600" />
                            </Button>
                          )}
                          {[
                            "pending",
                            "shortlisted",
                            "interview_scheduled",
                            "interview_done",
                          ].includes(a.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowReject(a.id)}
                              title="Reject"
                              data-ocid={`pg_admission.reject.${idx + 1}`}
                            >
                              <XCircle className="w-3 h-3 text-destructive" />
                            </Button>
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
          <DialogContent
            className="max-w-2xl max-h-[85vh] overflow-y-auto"
            data-ocid="pg_admission.view_dialog"
          >
            <DialogHeader>
              <DialogTitle>PG Application — {viewApp.fullName}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="mb-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="docs">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
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
                      ["Status", STATUS_LABELS[viewApp.status]],
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
              </TabsContent>

              <TabsContent value="pipeline">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Admission Pipeline</h3>
                  <div className="relative">
                    {PIPELINE_STEPS.map((step, i) => {
                      const current = pipelineStep(viewApp.status);
                      const done = i < current;
                      const active = i === current;
                      return (
                        <div
                          key={step.key}
                          className="flex gap-3 items-start mb-3"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              done
                                ? "bg-success text-white"
                                : active
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-xs font-medium ${
                                active
                                  ? "text-primary"
                                  : done
                                    ? "text-success"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.key === "interview_scheduled" &&
                              viewApp.interviewDate && (
                                <p className="text-xs text-muted-foreground">
                                  {viewApp.interviewDate} —{" "}
                                  {viewApp.interviewVenue}
                                </p>
                              )}
                            {step.key === "interview_done" &&
                              viewApp.interviewNotes && (
                                <p className="text-xs text-muted-foreground italic">
                                  Notes: {viewApp.interviewNotes}
                                </p>
                              )}
                            {step.key === "admission_letter_issued" &&
                              viewApp.admissionLetterDate && (
                                <p className="text-xs text-muted-foreground">
                                  Issued: {viewApp.admissionLetterDate}
                                </p>
                              )}
                            {step.key === "registered" &&
                              viewApp.pgRegisteredCourses && (
                                <p className="text-xs text-muted-foreground">
                                  Courses:{" "}
                                  {viewApp.pgRegisteredCourses.join(", ")}
                                </p>
                              )}
                            {step.key === "matriculated" &&
                              viewApp.matriculationNo && (
                                <p className="text-xs text-muted-foreground">
                                  Matric No: {viewApp.matriculationNo} —{" "}
                                  {viewApp.matriculationDate}
                                </p>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Document Checklist</h3>
                  {REQUIRED_DOCS.map((doc) => {
                    const uploaded = viewApp.documents?.some((d) =>
                      d.name
                        .toLowerCase()
                        .includes(doc.split(" ")[0].toLowerCase()),
                    );
                    return (
                      <div
                        key={doc}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox checked={!!uploaded} disabled />
                        <span
                          className={
                            uploaded
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {doc}
                        </span>
                        {uploaded && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            Uploaded
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewApp(null)}
                data-ocid="pg_admission.view_dialog.close_button"
              >
                Close
              </Button>
              {viewApp.status === "admission_letter_issued" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLetterModal(viewApp);
                  }}
                  data-ocid="pg_admission.view_dialog.print_letter_button"
                >
                  <Printer className="w-4 h-4 mr-1" /> Print Letter
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule Interview Modal */}
      {interviewModal && (
        <Dialog
          open={!!interviewModal}
          onOpenChange={() => setInterviewModal(null)}
        >
          <DialogContent data-ocid="pg_admission.interview_dialog">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Interview Date</Label>
                <Input
                  type="date"
                  value={interviewForm.date}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="pg_admission.interview_date.input"
                />
              </div>
              <div className="grid gap-2">
                <Label>Venue</Label>
                <Input
                  value={interviewForm.venue}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  placeholder="e.g. Senate Room, Admin Block"
                  data-ocid="pg_admission.interview_venue.input"
                />
              </div>
              <div className="grid gap-2">
                <Label>Notes / Instructions (optional)</Label>
                <Textarea
                  rows={2}
                  value={interviewForm.notes}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  data-ocid="pg_admission.interview_notes.textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInterviewModal(null)}
                data-ocid="pg_admission.interview_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleScheduleInterview(interviewModal)}
                data-ocid="pg_admission.interview_dialog.confirm_button"
              >
                Schedule Interview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark Interview Done Modal */}
      {interviewDoneModal && (
        <Dialog
          open={!!interviewDoneModal}
          onOpenChange={() => setInterviewDoneModal(null)}
        >
          <DialogContent data-ocid="pg_admission.interview_done_dialog">
            <DialogHeader>
              <DialogTitle>Mark Interview as Completed</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Interview Outcome / Notes</Label>
                <Textarea
                  rows={3}
                  value={interviewDoneNotes}
                  onChange={(e) => setInterviewDoneNotes(e.target.value)}
                  placeholder="Record interview outcome, scores, or observations..."
                  data-ocid="pg_admission.interview_done_notes.textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInterviewDoneModal(null)}
                data-ocid="pg_admission.interview_done_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleMarkInterviewDone(interviewDoneModal)}
                data-ocid="pg_admission.interview_done_dialog.confirm_button"
              >
                <UserCheck className="w-4 h-4 mr-1" /> Mark Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Admission Letter Modal */}
      {letterModal && (
        <Dialog open={!!letterModal} onOpenChange={() => setLetterModal(null)}>
          <DialogContent
            className="max-w-2xl"
            data-ocid="pg_admission.letter_dialog"
          >
            <DialogHeader>
              <DialogTitle>
                Admission Letter — {letterModal.fullName}
              </DialogTitle>
            </DialogHeader>
            <div
              id="pg-admission-letter"
              className="border border-border rounded-lg p-6 text-sm space-y-4 print:border-0"
            >
              <div className="text-center">
                <p className="text-lg font-bold uppercase">
                  {institutionSettings.name ||
                    "Federal University of Education, Kontagora"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Postgraduate Studies Office
                </p>
                <p className="text-xs text-muted-foreground">
                  Ref: {letterModal.referenceNo} &nbsp;|&nbsp; Date:{" "}
                  {new Date().toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="border-t border-b border-border py-3">
                <p className="font-semibold">LETTER OF ADMISSION</p>
              </div>
              <p>
                Dear <strong>{letterModal.fullName}</strong>,
              </p>
              <p>
                We are pleased to inform you that your application for admission
                into the postgraduate programme has been considered and you have
                been offered provisional admission for the following:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">Programme:</span>
                  <span>{letterModal.programme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Department:</span>
                  <span>
                    {departments.find(
                      (d) => String(d.id) === letterModal.departmentId,
                    )?.name ?? letterModal.departmentId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Session:</span>
                  <span>{letterModal.session}</span>
                </div>
                {letterModal.matriculationNo && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Matriculation No:</span>
                    <span>{letterModal.matriculationNo}</span>
                  </div>
                )}
              </div>
              <p className="text-sm">
                This admission is provisional and subject to the following
                conditions:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Satisfactory completion of all required documentation within
                  14 days.
                </li>
                <li>
                  Payment of all prescribed fees before the commencement of the
                  programme.
                </li>
                <li>
                  Verification of all academic credentials presented at the time
                  of application.
                </li>
                <li>
                  Compliance with all rules, regulations and bye-laws of the
                  institution.
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-border">
                <p className="font-semibold">
                  Registrar / Dean of Postgraduate Studies
                </p>
                <p className="text-xs text-muted-foreground">
                  {institutionSettings.name ||
                    "Federal University of Education, Kontagora"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLetterModal(null)}
                data-ocid="pg_admission.letter_dialog.close_button"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                data-ocid="pg_admission.letter_dialog.print_button"
              >
                <Printer className="w-4 h-4 mr-1" /> Print Letter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* PG Course Registration Modal */}
      {courseRegModal && (
        <Dialog
          open={!!courseRegModal}
          onOpenChange={() => setCourseRegModal(null)}
        >
          <DialogContent data-ocid="pg_admission.course_reg_dialog">
            <DialogHeader>
              <DialogTitle>PG Course Registration</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter course codes for 700/800 level courses (one per line or
                comma-separated):
              </p>
              <Textarea
                rows={5}
                value={courseRegInput}
                onChange={(e) => setCourseRegInput(e.target.value)}
                placeholder={"CSC 701\nCSC 703\nEDU 701"}
                data-ocid="pg_admission.course_codes.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCourseRegModal(null)}
                data-ocid="pg_admission.course_reg_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRegisterCourses(courseRegModal)}
                data-ocid="pg_admission.course_reg_dialog.confirm_button"
              >
                <BookOpen className="w-4 h-4 mr-1" /> Register Courses
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Matriculation Modal */}
      {matricModal && (
        <Dialog open={!!matricModal} onOpenChange={() => setMatricModal(null)}>
          <DialogContent data-ocid="pg_admission.matriculate_dialog">
            <DialogHeader>
              <DialogTitle>Assign Matriculation Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Matriculation Number</Label>
                <Input
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  placeholder="PG/2024/001"
                  data-ocid="pg_admission.matric_no.input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMatricModal(null)}
                data-ocid="pg_admission.matriculate_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleMatriculate(matricModal)}
                data-ocid="pg_admission.matriculate_dialog.confirm_button"
              >
                <GraduationCap className="w-4 h-4 mr-1" /> Matriculate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {showReject && (
        <Dialog open={!!showReject} onOpenChange={() => setShowReject(null)}>
          <DialogContent data-ocid="pg_admission.reject_dialog">
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
                data-ocid="pg_admission.reject_reason.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReject(null)}
                data-ocid="pg_admission.reject_dialog.cancel_button"
              >
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
                data-ocid="pg_admission.reject_dialog.confirm_button"
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

export {
  PROGRAMMES,
  QUALIFICATIONS,
  DEGREE_CLASSES,
  SESSIONS,
  loadApps,
  saveApps,
};
