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
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, GraduationCap, Save } from "lucide-react";
import { useEffect, useState } from "react";
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

const STEPS = [
  "Personal Info",
  "Academic Background",
  "Programme Selection",
  "Confirm & Submit",
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function generateRef(session: string): string {
  const yr = session.split("/")[0];
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PG/${yr}/${rand}`;
}

const DRAFT_KEY = "unipro_pg_apply_draft";

interface FormData {
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nin: string;
  address: string;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  // Step 2
  previousQualification: string;
  classOfDegree: string;
  institution: string;
  graduationYear: string;
  mastersCertTitle: string;
  nyscStatus: string;
  oLevel: Array<{ subject: string; grade: string; slotId: string }>;
  // Step 3
  programme: PGApplication["programme"];
  departmentId: string;
  facultyId: string;
  researchArea: string;
  proposedThesisTitle: string;
  researchProposal: string;
  modeOfStudy: string;
  session: string;
  // Step 4
  agreedTerms: boolean;
}

const EMPTY_FORM: FormData = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  nin: "",
  address: "",
  nationality: "Nigerian",
  stateOfOrigin: "",
  lga: "",
  previousQualification: "",
  classOfDegree: "",
  institution: "",
  graduationYear: "",
  mastersCertTitle: "",
  nyscStatus: "",
  oLevel: ["S1", "S2", "S3", "S4", "S5"].map((k) => ({
    subject: "",
    grade: "",
    slotId: k,
  })),
  programme: "MSc",
  departmentId: "",
  facultyId: "",
  researchArea: "",
  proposedThesisTitle: "",
  researchProposal: "",
  modeOfStudy: "Full Time",
  session: SESSIONS[0],
  agreedTerms: false,
};

export default function PGApplyPage() {
  const { departments, faculties } = useApp();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [form, setForm] = useState<FormData>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Save draft on every form change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.email.includes("@")) e.email = "Valid email required";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.dateOfBirth) e.dateOfBirth = "Required";
      if (!form.gender) e.gender = "Required";
    }
    if (s === 1) {
      if (!form.previousQualification) e.previousQualification = "Required";
      if (!form.classOfDegree) e.classOfDegree = "Required";
      if (!form.institution.trim()) e.institution = "Required";
      if (!form.graduationYear.trim()) e.graduationYear = "Required";
    }
    if (s === 2) {
      if (!form.departmentId) e.departmentId = "Required";
      if (!form.modeOfStudy) e.modeOfStudy = "Required";
    }
    if (s === 3) {
      if (!form.agreedTerms) e.agreedTerms = "You must agree to the terms";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate(step)) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    toast.success("Draft saved! Your progress has been preserved.");
  }

  function handleSubmit() {
    if (!validate(3)) return;
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
    saveApps([...loadApps(), newApp]);
    localStorage.removeItem(DRAFT_KEY);
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
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground text-sm">
              Your application has been received and is under review.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                Your Reference Number
              </p>
              <p className="text-2xl font-mono font-bold text-primary">
                {refNo}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Save this number for status tracking.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              You will be contacted via <strong>{form.email}</strong> for
              further steps.
            </p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">
              Postgraduate Admission Application
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Complete all sections carefully. Your draft is saved automatically.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${i < step ? "bg-green-500" : i === step ? "bg-primary" : "bg-muted"}`}
              />
              <p
                className={`text-xs mt-1 text-center truncate ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="secondary">
                Step {step + 1}/{STEPS.length}
              </Badge>
              {STEPS[step]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ── Step 1: Personal Info ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="e.g. Amaka Chioma Obi"
                      data-ocid="pg_apply.full_name_input"
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="your@email.com"
                      data-ocid="pg_apply.email_input"
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="08012345678"
                      data-ocid="pg_apply.phone_input"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setField("dateOfBirth", e.target.value)}
                      data-ocid="pg_apply.dob_input"
                    />
                    {errors.dateOfBirth && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) => setField("gender", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.gender_select">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>NIN (National ID Number)</Label>
                    <Input
                      value={form.nin}
                      onChange={(e) => setField("nin", e.target.value)}
                      placeholder="11-digit NIN"
                      data-ocid="pg_apply.nin_input"
                    />
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input
                      value={form.nationality}
                      onChange={(e) => setField("nationality", e.target.value)}
                      data-ocid="pg_apply.nationality_input"
                    />
                  </div>
                  <div>
                    <Label>State of Origin</Label>
                    <Select
                      value={form.stateOfOrigin}
                      onValueChange={(v) => setField("stateOfOrigin", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.state_select">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>LGA</Label>
                    <Input
                      value={form.lga}
                      onChange={(e) => setField("lga", e.target.value)}
                      placeholder="Local Government Area"
                      data-ocid="pg_apply.lga_input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Residential Address</Label>
                    <Textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="Full residential address"
                      data-ocid="pg_apply.address_textarea"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Academic Background ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>
                      Previous Qualification{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.previousQualification}
                      onValueChange={(v) =>
                        setField("previousQualification", v)
                      }
                    >
                      <SelectTrigger data-ocid="pg_apply.qualification_select">
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
                    <Label>
                      Class of Degree{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.classOfDegree}
                      onValueChange={(v) => setField("classOfDegree", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.degree_class_select">
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
                    <Label>
                      Institution Attended{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.institution}
                      onChange={(e) => setField("institution", e.target.value)}
                      placeholder="Name of institution"
                      data-ocid="pg_apply.institution_input"
                    />
                    {errors.institution && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.institution}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Year of Graduation{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.graduationYear}
                      onChange={(e) =>
                        setField("graduationYear", e.target.value)
                      }
                      placeholder="e.g. 2022"
                      data-ocid="pg_apply.grad_year_input"
                    />
                    {errors.graduationYear && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.graduationYear}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>NYSC Status</Label>
                    <Select
                      value={form.nyscStatus}
                      onValueChange={(v) => setField("nyscStatus", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.nysc_select">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Discharged">Discharged</SelectItem>
                        <SelectItem value="Exempted">Exempted</SelectItem>
                        <SelectItem value="Awaiting Call-up">
                          Awaiting Call-up
                        </SelectItem>
                        <SelectItem value="Not Applicable">
                          Not Applicable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Masters/Thesis Title (if PhD)</Label>
                    <Input
                      value={form.mastersCertTitle}
                      onChange={(e) =>
                        setField("mastersCertTitle", e.target.value)
                      }
                      placeholder="Previous thesis title..."
                      data-ocid="pg_apply.masters_title_input"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">
                    O-Level Results (5 subjects)
                  </Label>
                  <div className="space-y-2">
                    {form.oLevel.map((ol, slotIdx) => (
                      <div key={ol.slotId} className="flex gap-2">
                        <Input
                          className="flex-1 h-8 text-sm"
                          placeholder={`Subject ${slotIdx + 1}`}
                          value={ol.subject}
                          onChange={(e) => {
                            const updated = [...form.oLevel];
                            updated[slotIdx] = {
                              ...updated[slotIdx],
                              subject: e.target.value,
                            };
                            setField("oLevel", updated);
                          }}
                          data-ocid={`pg_apply.olevel_subject_${slotIdx + 1}`}
                        />
                        <Select
                          value={ol.grade}
                          onValueChange={(v) => {
                            const updated = [...form.oLevel];
                            updated[slotIdx] = {
                              ...updated[slotIdx],
                              grade: v,
                            };
                            setField("oLevel", updated);
                          }}
                        >
                          <SelectTrigger
                            className="w-24 h-8 text-sm"
                            data-ocid={`pg_apply.olevel_grade_${slotIdx + 1}`}
                          >
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "A1",
                              "B2",
                              "B3",
                              "C4",
                              "C5",
                              "C6",
                              "D7",
                              "E8",
                              "F9",
                            ].map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3 text-xs text-muted-foreground">
                  <strong>Note:</strong> Upload of actual certificates will be
                  completed during physical screening. Ensure all information
                  provided is accurate — misrepresentation leads to
                  disqualification.
                </div>
              </div>
            )}

            {/* ── Step 3: Programme Selection ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>
                      Programme <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.programme}
                      onValueChange={(v) =>
                        setField("programme", v as PGApplication["programme"])
                      }
                    >
                      <SelectTrigger data-ocid="pg_apply.programme_select">
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
                    <Label>
                      Mode of Study <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.modeOfStudy}
                      onValueChange={(v) => setField("modeOfStudy", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.mode_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Time">Full Time</SelectItem>
                        <SelectItem value="Part Time">Part Time</SelectItem>
                        <SelectItem value="Distance Learning">
                          Distance Learning
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.modeOfStudy && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.modeOfStudy}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Faculty / School</Label>
                    <Select
                      value={form.facultyId}
                      onValueChange={(v) => setField("facultyId", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.faculty_select">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((f) => (
                          <SelectItem key={String(f.id)} value={String(f.id)}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.departmentId}
                      onValueChange={(v) => setField("departmentId", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.department_select">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments
                          .filter(
                            (d) =>
                              !form.facultyId ||
                              String(d.facultyId) === form.facultyId,
                          )
                          .map((d) => (
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
                      onValueChange={(v) => setField("session", v)}
                    >
                      <SelectTrigger data-ocid="pg_apply.session_select">
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
                  <div>
                    <Label>Research Area / Interest</Label>
                    <Input
                      value={form.researchArea}
                      onChange={(e) => setField("researchArea", e.target.value)}
                      placeholder="e.g. Machine Learning in Education"
                      data-ocid="pg_apply.research_area_input"
                    />
                  </div>
                </div>
                {(form.programme === "PhD" || form.programme === "MSc") && (
                  <div>
                    <Label>
                      Proposed Thesis Title{" "}
                      {form.programme === "PhD"
                        ? "(Required for PhD)"
                        : "(Optional)"}
                    </Label>
                    <Input
                      value={form.proposedThesisTitle}
                      onChange={(e) =>
                        setField("proposedThesisTitle", e.target.value)
                      }
                      placeholder="Proposed thesis title..."
                      data-ocid="pg_apply.thesis_title_input"
                    />
                  </div>
                )}
                {form.programme === "PhD" && (
                  <div>
                    <Label>Research Proposal Summary</Label>
                    <Textarea
                      rows={4}
                      value={form.researchProposal}
                      onChange={(e) =>
                        setField("researchProposal", e.target.value)
                      }
                      placeholder="Briefly describe your proposed research (objectives, methodology, expected contribution)..."
                      data-ocid="pg_apply.research_proposal_textarea"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Confirm & Submit ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">
                  Review Your Application
                </h3>
                <div className="space-y-3 text-sm">
                  <SummarySection title="Personal Information">
                    <SummaryRow label="Name" value={form.fullName} />
                    <SummaryRow label="Email" value={form.email} />
                    <SummaryRow label="Phone" value={form.phone} />
                    <SummaryRow
                      label="Date of Birth"
                      value={form.dateOfBirth}
                    />
                    <SummaryRow label="Gender" value={form.gender} />
                    <SummaryRow label="State" value={form.stateOfOrigin} />
                    <SummaryRow
                      label="Mode of Study"
                      value={form.modeOfStudy}
                    />
                  </SummarySection>
                  <SummarySection title="Academic Background">
                    <SummaryRow
                      label="Qualification"
                      value={`${form.previousQualification} — ${form.classOfDegree}`}
                    />
                    <SummaryRow label="Institution" value={form.institution} />
                    <SummaryRow label="Year" value={form.graduationYear} />
                    <SummaryRow label="NYSC" value={form.nyscStatus} />
                  </SummarySection>
                  <SummarySection title="Programme">
                    <SummaryRow label="Programme" value={form.programme} />
                    <SummaryRow label="Session" value={form.session} />
                    <SummaryRow
                      label="Department"
                      value={
                        departments.find(
                          (d) => String(d.id) === form.departmentId,
                        )?.name ?? form.departmentId
                      }
                    />
                    {form.researchArea && (
                      <SummaryRow
                        label="Research Area"
                        value={form.researchArea}
                      />
                    )}
                  </SummarySection>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                  <strong>Declaration:</strong> I hereby declare that all
                  information provided in this application is true, accurate and
                  complete. I understand that misrepresentation of any
                  information will lead to disqualification or withdrawal of
                  admission.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={form.agreedTerms}
                    onChange={(e) => setField("agreedTerms", e.target.checked)}
                    className="rounded"
                    data-ocid="pg_apply.agree_terms_checkbox"
                  />
                  <label htmlFor="agreeTerms" className="text-sm">
                    I agree to the terms and conditions and confirm the
                    information above is accurate.
                  </label>
                </div>
                {errors.agreedTerms && (
                  <p className="text-destructive text-xs">
                    {errors.agreedTerms}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={step === 0 ? () => window.history.back() : handleBack}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              data-ocid="pg_apply.save_draft_btn"
            >
              <Save className="w-3 h-3 mr-1" /> Save Draft
            </Button>
          </div>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} data-ocid="pg_apply.next_btn">
              Next Step →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              data-ocid="pg_apply.submit_btn"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummarySection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">
        {title}
      </p>
      <div className="border rounded-lg overflow-hidden">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between px-3 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
