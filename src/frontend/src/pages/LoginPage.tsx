import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Copy,
  Fingerprint,
  GraduationCap,
  Loader2,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type RoleName, useApp } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const DEMO_USERS: {
  label: string;
  role: RoleName;
  name: string;
  principal: string;
  departmentId?: bigint;
}[] = [
  {
    label: "Super Admin",
    role: "SuperAdmin",
    name: "Prof. Adebayo Williams",
    principal: "admin-1",
  },
  {
    label: "Registrar",
    role: "Registrar",
    name: "Mrs. Chinwe Obi",
    principal: "registrar-1",
  },
  {
    label: "Dean \u2013 Faculty of Engineering",
    role: "Dean",
    name: "Dr. Sarah Williams",
    principal: "dean-1",
  },
  {
    label: "HOD \u2013 Computer Science",
    role: "HOD",
    name: "Dr. Alistair Finch",
    principal: "hod-1",
    departmentId: BigInt(1),
  },
  {
    label: "Lecturer (CSC301, CSC302)",
    role: "Lecturer",
    name: "Dr. Emeka Olu",
    principal: "lecturer-1",
  },
  {
    label: "Student \u2013 Amara Okonkwo",
    role: "Student",
    name: "Amara Okonkwo",
    principal: "student-1",
  },
  {
    label: "Exam Officer – Dept. of Computer Science",
    role: "ExamOfficer",
    name: "Mr. Suleiman Idris",
    principal: "exam-officer-demo",
    departmentId: BigInt(1),
  },
];

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  roleRequested: string;
  department: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export function getPendingRegistrations(): PendingRegistration[] {
  try {
    const d = localStorage.getItem("pendingRegistrations");
    if (d) return JSON.parse(d);
  } catch {}
  return [];
}

export function savePendingRegistrations(regs: PendingRegistration[]) {
  localStorage.setItem("pendingRegistrations", JSON.stringify(regs));
}

interface VerifyResult {
  studentName: string;
  matricNumber: string;
  department: string;
  level: string;
  cgpa: number;
  courses: { code: string; name: string; grade: string }[];
}

export default function LoginPage() {
  const { login, students, courses, results } = useApp();
  const [selected, setSelected] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [tab, setTab] = useState<
    "demo" | "admin" | "request" | "student" | "verify"
  >("demo");
  const [submitted, setSubmitted] = useState(false);

  // Request access form
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqRole, setReqRole] = useState("");
  const [reqDept, setReqDept] = useState("");
  const [reqMsg, setReqMsg] = useState("");

  // Student login
  const [matricInput, setMatricInput] = useState("");
  const [matricError, setMatricError] = useState("");

  // Verify result
  const [verifyMatric, setVerifyMatric] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const {
    login: iiLogin,
    clear: iiClear,
    identity,
    isLoggingIn,
    isLoginSuccess,
  } = useInternetIdentity();
  const [iiNotFound, setIiNotFound] = useState(false);
  const [iiPrincipal, setIiPrincipal] = useState("");

  // When II login succeeds, look up user
  const handleIILogin = () => {
    setIiNotFound(false);
    iiLogin();
  };

  // Effect-style: watch identity changes
  if (isLoginSuccess && identity && !iiNotFound) {
    const principal = identity.getPrincipal().toString();
    // Look up in unires_users or DEMO_USERS by userPrincipal
    let found = false;
    try {
      const stored = localStorage.getItem("unires_users");
      if (stored) {
        const users = JSON.parse(stored);
        const match = users.find(
          (u: any) =>
            u.userPrincipal === principal || u.principal === principal,
        );
        if (match) {
          login({
            name: match.name,
            role: match.role,
            principal: match.principal ?? match.userPrincipal,
            departmentId: match.departmentId,
          });
          found = true;
        }
      }
    } catch {}
    if (!found) {
      const demoMatch = DEMO_USERS.find((u) => u.principal === principal);
      if (demoMatch) {
        login({
          name: demoMatch.name,
          role: demoMatch.role,
          principal: demoMatch.principal,
          departmentId: demoMatch.departmentId,
        });
        found = true;
      }
    }
    if (!found) {
      setIiPrincipal(principal);
      setIiNotFound(true);
    }
  }

  function handleDemoLogin() {
    const user = DEMO_USERS.find((u) => u.principal === selected);
    if (!user) return;
    login({
      name: user.name,
      role: user.role,
      principal: user.principal,
      departmentId: user.departmentId,
    });
  }

  function handleAdminLogin() {
    if (adminSecret.trim()) {
      login({
        name: "System Administrator",
        role: "SuperAdmin",
        principal: "super-admin",
      });
    }
  }

  function handleRequestAccess() {
    if (!reqName.trim() || !reqEmail.trim() || !reqRole) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const existing = getPendingRegistrations();
    const newReq: PendingRegistration = {
      id: `req-${Date.now()}`,
      name: reqName.trim(),
      email: reqEmail.trim(),
      roleRequested: reqRole,
      department: reqDept.trim(),
      message: reqMsg.trim(),
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    savePendingRegistrations([...existing, newReq]);
    setSubmitted(true);
    toast.success(
      "Access request submitted! An admin will review your request.",
    );
  }

  function handleStudentLogin() {
    setMatricError("");
    const matric = matricInput.trim().toUpperCase();
    if (!matric) {
      setMatricError("Please enter your matric number.");
      return;
    }
    // Look up student in localStorage first, then fallback to context
    let foundStudent = students.find(
      (s) => s.matricNumber.toUpperCase() === matric,
    );
    if (!foundStudent) {
      // Also check localStorage directly in case context hasn't loaded
      try {
        const stored = JSON.parse(localStorage.getItem("students") || "[]");
        foundStudent = stored.find(
          (s: any) => s.matricNumber?.toUpperCase() === matric,
        );
      } catch {}
    }
    if (!foundStudent) {
      setMatricError("Matric number not found. Please contact the Registrar.");
      return;
    }
    login({
      name: foundStudent.name,
      role: "Student",
      principal: foundStudent.userPrincipal ?? `student-${foundStudent.id}`,
      departmentId: foundStudent.departmentId,
    });
    toast.success(`Welcome back, ${foundStudent.name}!`);
  }

  function handleVerifyResult() {
    setVerifyError("");
    setVerifyResult(null);
    const matric = verifyMatric.trim().toUpperCase();
    const code = verifyCode.trim().toUpperCase();
    if (!matric || !code) {
      setVerifyError("Both fields are required.");
      return;
    }

    // Check code
    const codes: { matricNumber: string; code: string; generatedAt: string }[] =
      JSON.parse(localStorage.getItem("resultVerificationCodes") || "[]");
    const matchingCode = codes.find(
      (c) =>
        c.matricNumber.toUpperCase() === matric &&
        c.code.toUpperCase() === code,
    );
    if (!matchingCode) {
      setVerifyError("Invalid matric number or verification code.");
      return;
    }

    const student = students.find(
      (s) => s.matricNumber.toUpperCase() === matric,
    );
    if (!student) {
      setVerifyError("Student not found.");
      return;
    }

    const myResults = results.filter(
      (r) => r.studentId === student.id && r.status === "published",
    );
    const myCourses = myResults.map((r) => {
      const c = courses.find((c) => String(c.id) === String(r.courseId));
      return {
        code: c?.code ?? "N/A",
        name: c?.name ?? "Unknown",
        grade: r.grade,
      };
    });
    let tw = 0;
    let tc = 0;
    for (const r of myResults) {
      const c = courses.find((c) => String(c.id) === String(r.courseId));
      const cr = c ? Number(c.creditUnits) : 0;
      tw += r.gradePoint * cr;
      tc += cr;
    }
    const cgpa = tc > 0 ? Number.parseFloat((tw / tc).toFixed(2)) : 0;

    setVerifyResult({
      studentName: student.name,
      matricNumber: student.matricNumber,
      department: String(student.departmentId),
      level: String(student.level),
      cgpa,
      courses: myCourses,
    });
  }

  const tabs = [
    { key: "demo" as const, label: "Demo Login" },
    { key: "admin" as const, label: "Admin Setup" },
    { key: "request" as const, label: "Request Access" },
    { key: "student" as const, label: "Student Login" },
    { key: "verify" as const, label: "Verify Result" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">UniResults Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            University Results Processing System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                data-ocid={`login.${t.key}.tab`}
                onClick={() => setTab(t.key)}
                className={`flex-1 min-w-[80px] py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === t.key
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "demo" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Select your role
                </Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger data-ocid="role.select" className="w-full">
                    <SelectValue placeholder="Choose a role to login as..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_USERS.map((u) => (
                      <SelectItem key={u.principal} value={u.principal}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-ocid="login.primary_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selected}
                onClick={handleDemoLogin}
              >
                Sign In
              </Button>
            </div>
          )}

          {tab === "admin" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Enter the admin secret to initialize as Super Administrator.
                  This is a one-time setup.
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Admin Secret
                </Label>
                <Input
                  data-ocid="admin.input"
                  type="password"
                  placeholder="Enter admin secret..."
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
              </div>
              <Button
                data-ocid="admin.submit_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAdminLogin}
              >
                Initialize as Admin
              </Button>
            </div>
          )}

          {tab === "request" && (
            <div className="space-y-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-3"
                  data-ocid="request_access.success_state"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Request Submitted!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your access request has been submitted. An administrator
                    will review it and create your account.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setReqName("");
                      setReqEmail("");
                      setReqRole("");
                      setReqDept("");
                      setReqMsg("");
                    }}
                    data-ocid="request_access.secondary_button"
                  >
                    Submit Another
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <UserPlus className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Submit a request to access the system. An admin will
                      review and approve your account.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        data-ocid="request_access.input"
                        placeholder="Enter your full name"
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Email Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="your@email.edu.ng"
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Role Requested{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={reqRole} onValueChange={setReqRole}>
                        <SelectTrigger
                          data-ocid="request_access.select"
                          className="w-full"
                        >
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                          <SelectItem value="HOD">
                            Head of Department
                          </SelectItem>
                          <SelectItem value="Dean">Dean</SelectItem>
                          <SelectItem value="Registrar">Registrar</SelectItem>
                          <SelectItem value="ExamOfficer">
                            Exam Officer
                          </SelectItem>
                          <SelectItem value="Student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Department
                      </Label>
                      <Input
                        placeholder="Your department (optional)"
                        value={reqDept}
                        onChange={(e) => setReqDept(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Additional Notes
                      </Label>
                      <Textarea
                        data-ocid="request_access.textarea"
                        placeholder="Any additional information..."
                        value={reqMsg}
                        onChange={(e) => setReqMsg(e.target.value)}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    data-ocid="request_access.submit_button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleRequestAccess}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          )}

          {tab === "student" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Enter your matric number to access your results and portal.
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Matric Number
                </Label>
                <Input
                  data-ocid="student_login.input"
                  placeholder="e.g. CSC/2021/001"
                  value={matricInput}
                  onChange={(e) => {
                    setMatricInput(e.target.value);
                    setMatricError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
                  className={matricError ? "border-destructive" : ""}
                />
                {matricError && (
                  <p
                    className="text-xs text-destructive mt-1"
                    data-ocid="student_login.error_state"
                  >
                    {matricError}
                  </p>
                )}
              </div>
              <Button
                data-ocid="student_login.submit_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleStudentLogin}
              >
                Sign In
              </Button>
            </div>
          )}

          {tab === "verify" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Enter a student's matric number and verification code to view
                  their published results.
                </p>
              </div>
              {verifyResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                  data-ocid="verify.success_state"
                >
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Verified
                      </h3>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        <strong>{verifyResult.studentName}</strong>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Matric No:
                        </span>{" "}
                        {verifyResult.matricNumber}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Level:</span>{" "}
                        {verifyResult.level}00
                      </p>
                      <p>
                        <span className="text-muted-foreground">CGPA:</span>{" "}
                        <strong>{verifyResult.cgpa.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                  {verifyResult.courses.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 font-medium">
                              Course
                            </th>
                            <th className="text-left p-2 font-medium">Title</th>
                            <th className="text-left p-2 font-medium">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verifyResult.courses.map((c) => (
                            <tr
                              key={c.code + c.grade}
                              className="border-t border-border"
                            >
                              <td className="p-2 font-mono">{c.code}</td>
                              <td className="p-2">{c.name}</td>
                              <td className="p-2 font-semibold">{c.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVerifyResult(null);
                      setVerifyMatric("");
                      setVerifyCode("");
                    }}
                  >
                    Verify Another
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Matric Number
                      </Label>
                      <Input
                        data-ocid="verify.input"
                        placeholder="e.g. CSC/2021/001"
                        value={verifyMatric}
                        onChange={(e) => {
                          setVerifyMatric(e.target.value);
                          setVerifyError("");
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Verification Code
                      </Label>
                      <Input
                        placeholder="8-character code"
                        value={verifyCode}
                        onChange={(e) => {
                          setVerifyCode(e.target.value);
                          setVerifyError("");
                        }}
                      />
                    </div>
                  </div>
                  {verifyError && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="verify.error_state"
                    >
                      {verifyError}
                    </p>
                  )}
                  <Button
                    data-ocid="verify.submit_button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleVerifyResult}
                  >
                    Verify Result
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Internet Identity Login */}
        <div className="mt-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Or sign in with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Internet Identity</p>
                <p className="text-xs text-muted-foreground">
                  Secure, decentralized authentication
                </p>
              </div>
            </div>
            {iiNotFound ? (
              <div className="space-y-2" data-ocid="ii_login.error_state">
                <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
                  No account is linked to this Internet Identity. Please contact
                  your administrator to link your principal.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {iiPrincipal}
                  </code>
                  <button
                    type="button"
                    data-ocid="ii_login.secondary_button"
                    onClick={() => {
                      navigator.clipboard.writeText(iiPrincipal);
                      toast.success("Principal copied");
                    }}
                    className="p-1.5 rounded hover:bg-muted"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => {
                    setIiNotFound(false);
                    iiClear();
                  }}
                >
                  Try a different identity
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="ii_login.primary_button"
                onClick={handleIILogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
