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
import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import type { PGApplication } from "./tabs/PGAdmissionTab";
import {
  DEGREE_CLASSES,
  PROGRAMMES,
  QUALIFICATIONS,
  SESSIONS,
  loadApps,
  saveApps,
} from "./tabs/PGAdmissionTab";

const STEPS = ["Personal Info", "Academic Background", "Programme & Submit"];

function generateRef(session: string): string {
  const yr = session.split("/")[0];
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PG/${yr}/${rand}`;
}

export default function PGApplyPage() {
  const { departments } = useApp();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [refNo, setRefNo] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nin: "",
    stateOfOrigin: "",
    previousQualification: "",
    classOfDegree: "",
    institution: "",
    graduationYear: "",
    programme: "MSc" as PGApplication["programme"],
    departmentId: "",
    session: SESSIONS[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(stepIdx: number): boolean {
    const e: Record<string, string> = {};
    if (stepIdx === 0) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.email.includes("@")) e.email = "Valid email required";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.dateOfBirth) e.dateOfBirth = "Required";
    }
    if (stepIdx === 1) {
      if (!form.previousQualification) e.previousQualification = "Required";
      if (!form.classOfDegree) e.classOfDegree = "Required";
      if (!form.institution.trim()) e.institution = "Required";
      if (!form.graduationYear.trim()) e.graduationYear = "Required";
    }
    if (stepIdx === 2) {
      if (!form.departmentId) e.departmentId = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate(step)) return;
    setStep(step + 1);
  }

  function handleSubmit() {
    if (!validate(step)) return;
    const ref = generateRef(form.session);
    const newApp: PGApplication = {
      id: Date.now().toString(),
      referenceNo: ref,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
      nin: form.nin,
      previousQualification: form.previousQualification,
      classOfDegree: form.classOfDegree,
      institution: form.institution,
      graduationYear: form.graduationYear,
      programme: form.programme,
      departmentId: form.departmentId,
      session: form.session,
      stateOfOrigin: form.stateOfOrigin,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };
    const existing = loadApps();
    saveApps([...existing, newApp]);
    setRefNo(ref);
    setSubmitted(true);
    toast.success("Application submitted successfully!");
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Your application has been received.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                Your Reference Number
              </p>
              <p className="text-2xl font-mono font-bold text-primary">
                {refNo}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Save this for status tracking.
              </p>
            </div>
            <a href="/" className="block">
              <Button variant="outline" className="w-full">
                Return to Main Page
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Postgraduate Application</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Fill in all required fields to apply for postgraduate admission.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${
                  i < step
                    ? "bg-green-500"
                    : i === step
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
              <p
                className={`text-xs mt-1 text-center ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Step {step + 1}: {STEPS[step]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            {step === 0 && (
              <>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    placeholder="e.g. Amaka Chioma Obi"
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="08012345678"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                  {errors.dateOfBirth && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div>
                  <Label>NIN</Label>
                  <Input
                    value={form.nin}
                    onChange={(e) => setForm({ ...form, nin: e.target.value })}
                    placeholder="National Identification Number"
                  />
                </div>
                <div>
                  <Label>State of Origin</Label>
                  <Input
                    value={form.stateOfOrigin}
                    onChange={(e) =>
                      setForm({ ...form, stateOfOrigin: e.target.value })
                    }
                    placeholder="e.g. Kogi"
                  />
                </div>
              </>
            )}

            {/* Step 2 */}
            {step === 1 && (
              <>
                <div>
                  <Label>Previous Qualification *</Label>
                  <Select
                    value={form.previousQualification}
                    onValueChange={(v) =>
                      setForm({ ...form, previousQualification: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATIONS.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.previousQualification && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.previousQualification}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Class of Degree *</Label>
                  <Select
                    value={form.classOfDegree}
                    onValueChange={(v) =>
                      setForm({ ...form, classOfDegree: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_CLASSES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classOfDegree && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.classOfDegree}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Institution Attended *</Label>
                  <Input
                    value={form.institution}
                    onChange={(e) =>
                      setForm({ ...form, institution: e.target.value })
                    }
                    placeholder="Name of institution"
                  />
                  {errors.institution && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.institution}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Year of Graduation *</Label>
                  <Input
                    value={form.graduationYear}
                    onChange={(e) =>
                      setForm({ ...form, graduationYear: e.target.value })
                    }
                    placeholder="e.g. 2022"
                  />
                  {errors.graduationYear && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.graduationYear}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 2 && (
              <>
                <div>
                  <Label>Programme Applying For *</Label>
                  <Select
                    value={form.programme}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        programme: v as PGApplication["programme"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMMES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department *</Label>
                  <Select
                    value={form.departmentId}
                    onValueChange={(v) => setForm({ ...form, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={String(d.id)} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.departmentId}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Academic Session</Label>
                  <Select
                    value={form.session}
                    onValueChange={(v) => setForm({ ...form, session: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground">
                  By submitting this form, you confirm that the information
                  provided is accurate and complete.
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              step > 0 ? setStep(step - 1) : window.history.back()
            }
            disabled={step === 0 && typeof window === "undefined"}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Next Step</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
