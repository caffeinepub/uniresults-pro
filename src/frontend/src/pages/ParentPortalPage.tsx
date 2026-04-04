import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LogOut,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

interface ParentSession {
  wardMatricNo: string;
  wardName: string;
}

const LS_KEY = "unipro_parent_session";

export default function ParentPortalPage() {
  const { students, results, feeRecords, departments, faculties } = useApp();
  const [session, setSession] = useState<ParentSession | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
    } catch {
      return null;
    }
  });
  const [matricInput, setMatricInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "attendance" | "fees" | "inbox"
  >("overview");

  function handleLogin() {
    setError("");
    const student = students.find(
      (s) => s.matricNumber?.toLowerCase() === matricInput.trim().toLowerCase(),
    );
    if (!student) {
      setError("Student not found with that Matric Number.");
      return;
    }
    const parentPin =
      (student as { parentPin?: string }).parentPin ||
      matricInput.trim().slice(-4);
    if (pinInput.trim() !== parentPin) {
      setError(
        "Incorrect PIN. Default PIN is the last 4 digits of the Matric Number.",
      );
      return;
    }
    const sess: ParentSession = {
      wardMatricNo: student.matricNumber ?? "",
      wardName: student.name ?? "",
    };
    localStorage.setItem(LS_KEY, JSON.stringify(sess));
    setSession(sess);
  }

  function handleLogout() {
    localStorage.removeItem(LS_KEY);
    setSession(null);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center">
              <GraduationCap className="w-6 h-6 text-primary" />
              Parent Portal Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ward&apos;s Matric Number</Label>
              <Input
                value={matricInput}
                onChange={(e) => setMatricInput(e.target.value)}
                placeholder="e.g. CSE/2025/001"
              />
            </div>
            <div>
              <Label>Parent PIN</Label>
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-6 digit PIN"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default PIN: last 4 digits of Matric Number
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <a href="/" className="hover:underline text-primary">
                Back to Main Login
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = students.find((s) => s.matricNumber === session.wardMatricNo);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Student record not found.
          </p>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    );
  }

  const dept = departments.find((d) => d.id === student.departmentId);
  const faculty = faculties.find(
    (f) => dept?.facultyId && f.id === dept.facultyId,
  );

  const studentResults = results.filter(
    (r) => r.studentId === student.id && r.status === "published",
  );

  const studentFees = feeRecords.filter((f) => f.studentId === student.id);
  const totalFees = studentFees.reduce((s, f) => s + f.tuitionAmount, 0);
  const paidFees = studentFees
    .filter((f) => f.status === "paid")
    .reduce((s, f) => s + f.amountPaid, 0);
  const outstandingFees = totalFees - paidFees;

  const cgpa = (() => {
    const published = studentResults;
    if (!published.length) return 0;
    const totalGP = published.reduce(
      (s, r) => s + Number(r.gradePoint ?? 0) * 3,
      0,
    );
    const totalCU = published.reduce((_s, _r) => 0, 0);
    return totalCU > 0 ? totalGP / totalCU : 0;
  })();

  const tabs = [
    { key: "overview", label: "Overview", icon: User },
    { key: "results", label: "Results", icon: BookOpen },
    { key: "fees", label: "Fees", icon: ClipboardList },
    { key: "inbox", label: "Inbox", icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-semibold">Parent Portal</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt="Ward"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground text-sm">
                      {student.matricNumber}
                    </p>
                    <p className="text-sm">
                      {dept?.name} &bull; {faculty?.name}
                    </p>
                    <p className="text-sm">Level {String(student.level)}</p>
                    <Badge
                      variant={
                        student.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {student.status ?? "Active"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">CGPA</p>
                  <p className="text-2xl font-bold text-primary">
                    {cgpa.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Courses Passed
                  </p>
                  <p className="text-2xl font-bold">
                    {studentResults.filter((r) => r.grade !== "F").length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Outstanding Fees
                  </p>
                  <p
                    className={`text-2xl font-bold ${outstandingFees > 0 ? "text-destructive" : "text-green-600"}`}
                  >
                    ₦{outstandingFees.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {outstandingFees > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Outstanding fee balance of ₦{outstandingFees.toLocaleString()}{" "}
                  — please visit the Bursary.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {activeTab === "results" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Academic Results (Published)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentResults.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-6"
                        >
                          No published results yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentResults.map((r) => (
                        <TableRow key={String(r.id)}>
                          <TableCell className="font-mono text-xs">
                            {String(r.courseId)}
                          </TableCell>
                          <TableCell className="text-xs">{"-"}</TableCell>
                          <TableCell className="text-xs">{"-"}</TableCell>
                          <TableCell>{String(r.caScore ?? "-")}</TableCell>
                          <TableCell>{String(r.examScore ?? "-")}</TableCell>
                          <TableCell className="font-semibold">
                            {String(r.totalScore ?? "-")}
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fees */}
        {activeTab === "fees" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fee Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {studentFees.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No fee records found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Item</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Amount (₦)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((f, i) => (
                      <TableRow key={`fee-${f.session}-${i}`}>
                        <TableCell>{"Tuition Fee"}</TableCell>
                        <TableCell className="text-xs">{f.session}</TableCell>
                        <TableCell>
                          {f.tuitionAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              f.status === "paid" ? "default" : "destructive"
                            }
                          >
                            {f.status === "paid"
                              ? "Paid"
                              : f.status === "partial"
                                ? "Partial"
                                : "Unpaid"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/30">
                      <TableCell colSpan={2}>Outstanding Balance</TableCell>
                      <TableCell
                        className={
                          outstandingFees > 0
                            ? "text-destructive"
                            : "text-green-600"
                        }
                      >
                        ₦{outstandingFees.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inbox */}
        {activeTab === "inbox" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Messages for {student.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-6 text-sm">
                Messages sent to your ward's inbox will appear here. Log in as
                the student to view full message threads.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
