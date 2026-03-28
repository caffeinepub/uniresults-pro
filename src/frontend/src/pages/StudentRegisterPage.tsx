import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

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
  "FCT - Abuja",
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

const OLEVEL_GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];
const OLEVEL_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Agricultural Science",
  "Economics",
  "Government",
  "History",
  "Geography",
  "Computer Studies",
  "Further Mathematics",
  "Technical Drawing",
  "Civic Education",
  "Commerce",
  "Accounting",
  "Literature in English",
  "Yoruba",
  "Igbo",
  "Hausa",
  "French",
];

type OLevelRow = { id: number; subject: string; grade: string };

type Step = "lookup" | "form" | "success";

export default function StudentRegisterPage() {
  const {
    students,
    departments,
    addStudent,
    updateStudent,
    login,
    selfRegistrationOpen,
  } = useApp();

  const [step, setStep] = useState<Step>("lookup");
  const [jambInput, setJambInput] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [existingStudentId, setExistingStudentId] = useState<bigint | null>(
    null,
  );
  const [foundMessage, setFoundMessage] = useState("");

  // Form fields
  const [jambNo, setJambNo] = useState("");
  const [nin, setNin] = useState("");
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [oLevel, setOLevel] = useState<OLevelRow[]>([
    { id: Date.now(), subject: "", grade: "" },
  ]);
  const [photo, setPhoto] = useState<string>("");
  const [entryMode, setEntryMode] = useState<"UTME" | "DE">("UTME");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [camError, setCamError] = useState("");

  const startCamera = useCallback(async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch {
      setCamError(
        "Camera access denied. Please allow camera access or upload a photo.",
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      for (const t of (videoRef.current.srcObject as MediaStream).getTracks()) {
        t.stop();
      }
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    stopCamera();
    toast.success("Photo captured!");
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function addOLevelRow() {
    setOLevel((prev) => [
      ...prev,
      { id: Date.now() + prev.length, subject: "", grade: "" },
    ]);
  }
  function removeOLevelRow(idx: number) {
    setOLevel((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateOLevelRow(idx: number, field: keyof OLevelRow, value: string) {
    setOLevel((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  }

  function handleLookup() {
    setLookupError("");
    const val = jambInput.trim().toUpperCase();
    if (!val) {
      setLookupError("Please enter your JAMB registration number.");
      return;
    }
    const found = students.find(
      (s) =>
        (s.regNo && s.regNo.toUpperCase() === val) ||
        (s.jambRegNo && s.jambRegNo.toUpperCase() === val) ||
        s.matricNumber.toUpperCase() === val,
    );
    if (found) {
      setExistingStudentId(found.id);
      setJambNo(found.regNo ?? found.jambRegNo ?? val);
      setFullName(found.name ?? "");
      setSex(found.gender ?? "");
      setDateOfBirth(found.dob ?? "");
      setState(found.state ?? "");
      setLga(found.lga ?? "");
      setDepartmentId(String(found.departmentId ?? ""));
      setPhoto(found.photoUrl ?? "");
      setNin(found.nin ?? "");
      setFoundMessage(
        "Your admission record was found. Please complete your profile and set a password.",
      );
    } else {
      setExistingStudentId(null);
      setJambNo(val);
      setFoundMessage(
        "No record found. Please fill in your details to register.",
      );
    }
    setStep("form");
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!sex) errors.sex = "Sex is required.";
    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
    if (!state) errors.state = "State of origin is required.";
    if (!lga.trim()) errors.lga = "LGA is required.";
    if (!departmentId) errors.departmentId = "Department is required.";
    if (!password) errors.password = "Password is required.";
    if (password.length < 6)
      errors.password = "Password must be at least 6 characters.";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    setSubmitting(true);

    const validOLevel = oLevel.filter((r) => r.subject && r.grade);

    if (existingStudentId !== null) {
      updateStudent(existingStudentId, {
        name: fullName,
        gender: sex,
        dob: dateOfBirth,
        state,
        lga,
        nin,
        departmentId: BigInt(departmentId),
        photoUrl: photo,
        oLevelResults: validOLevel,
        password,
        regNo: jambNo,
        jambRegNo: jambNo,
        entryMode,
      });
      // Find the updated student to login
      const updated = students.find((s) => s.id === existingStudentId);
      if (updated) {
        login({
          name: fullName,
          role: "Student",
          principal: updated.userPrincipal ?? `student-${existingStudentId}`,
          departmentId: BigInt(departmentId),
        });
      }
    } else {
      // Create new student
      const dept = departments.find((d) => String(d.id) === departmentId);
      const prefix =
        dept?.name?.slice(0, 3).toUpperCase().replace(/\s/g, "") ?? "STU";
      const year = new Date().getFullYear();
      const existing = students.filter(
        (s) =>
          s.admissionYear === String(year) &&
          String(s.departmentId) === departmentId,
      );
      const serial = String(existing.length + 1).padStart(3, "0");
      const matricNumber = `${prefix}/${year}/${serial}`;
      const newId = BigInt(Date.now());
      const newStudent = {
        id: newId,
        name: fullName,
        matricNumber,
        departmentId: BigInt(departmentId),
        level: BigInt(100),
        status: "Active" as const,
        userPrincipal: `student-${newId}`,
        gender: sex,
        dob: dateOfBirth,
        state,
        lga,
        nin,
        regNo: jambNo,
        jambRegNo: jambNo,
        admissionYear: String(year),
        admissionSession: `${year}/${year + 1}`,
        photoUrl: photo,
        oLevelResults: validOLevel,
        password,
        programmeType: "undergraduate",
        entryMode,
      };
      addStudent(newStudent);
      login({
        name: fullName,
        role: "Student",
        principal: `student-${newId}`,
        departmentId: BigInt(departmentId),
      });
    }

    setSubmitting(false);
    setStep("success");
    toast.success("Registration complete! Welcome to UniResults Pro.");
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }

  if (!selfRegistrationOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Registration Portal Closed
            </h2>
            <p className="text-muted-foreground text-sm">
              The student self-registration portal is currently closed. Please
              contact the Registrar.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Student Registration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Federal University of Education Kontagora &mdash; UniResults Pro
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["lookup", "form", "success"] as Step[]).map((s, i) => {
            const labels = ["Lookup", "Register", "Done"];
            const isPast =
              (s === "lookup" && (step === "form" || step === "success")) ||
              (s === "form" && step === "success");
            const isActive = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`w-8 h-px ${
                      isPast || (s === "form" && step === "success")
                        ? "bg-success"
                        : "bg-border"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isPast || step === "success"
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPast || (s === "success" && step === "success") ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {labels[i]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "lookup" && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: JAMB Number Lookup</CardTitle>
                  <CardDescription>
                    Enter your JAMB registration number to check if your
                    admission record is already in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      JAMB Registration Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      data-ocid="student_register.input"
                      placeholder="e.g. 12345678AB"
                      value={jambInput}
                      onChange={(e) => {
                        setJambInput(e.target.value);
                        setLookupError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className={lookupError ? "border-destructive" : ""}
                    />
                    {lookupError && (
                      <p
                        className="text-xs text-destructive mt-1"
                        data-ocid="student_register.error_state"
                      >
                        {lookupError}
                      </p>
                    )}
                  </div>
                  <Button
                    data-ocid="student_register.primary_button"
                    className="w-full"
                    onClick={handleLookup}
                  >
                    Check Registration <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Already registered?{" "}
                    <a href="/" className="text-primary hover:underline">
                      Sign in here
                    </a>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Complete Your Registration</CardTitle>
                  <CardDescription>
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-md ${
                        existingStudentId !== null
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {existingStudentId !== null ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {foundMessage}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-medium mb-1.5 block">
                          JAMB Registration Number
                        </Label>
                        <Input
                          value={jambNo}
                          onChange={(e) => setJambNo(e.target.value)}
                          readOnly={existingStudentId !== null}
                          className={
                            existingStudentId !== null ? "bg-muted" : ""
                          }
                          data-ocid="student_register.jamb_input"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs font-medium mb-1.5 block">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={
                            formErrors.fullName ? "border-destructive" : ""
                          }
                          data-ocid="student_register.name_input"
                        />
                        {formErrors.fullName && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          NIN (National ID Number)
                        </Label>
                        <Input
                          placeholder="11 digits"
                          value={nin}
                          onChange={(e) => setNin(e.target.value)}
                          maxLength={11}
                          data-ocid="student_register.nin_input"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          Sex <span className="text-destructive">*</span>
                        </Label>
                        <Select value={sex} onValueChange={setSex}>
                          <SelectTrigger
                            data-ocid="student_register.sex_select"
                            className={
                              formErrors.sex ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.sex && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.sex}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          Date of Birth{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className={
                            formErrors.dateOfBirth ? "border-destructive" : ""
                          }
                          data-ocid="student_register.dob_input"
                        />
                        {formErrors.dateOfBirth && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.dateOfBirth}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          State of Origin{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger
                            data-ocid="student_register.state_select"
                            className={
                              formErrors.state ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select state..." />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.state && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.state}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          LGA <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="Local Government Area"
                          value={lga}
                          onChange={(e) => setLga(e.target.value)}
                          className={formErrors.lga ? "border-destructive" : ""}
                          data-ocid="student_register.lga_input"
                        />
                        {formErrors.lga && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.lga}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs font-medium mb-1.5 block">
                          Department / Programme{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={departmentId}
                          onValueChange={setDepartmentId}
                        >
                          <SelectTrigger
                            data-ocid="student_register.dept_select"
                            className={
                              formErrors.departmentId
                                ? "border-destructive"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select your department..." />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem
                                key={String(d.id)}
                                value={String(d.id)}
                              >
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.departmentId && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.departmentId}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Entry Mode */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">
                        Entry Mode <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={entryMode}
                        onValueChange={(v) => setEntryMode(v as "UTME" | "DE")}
                      >
                        <SelectTrigger data-ocid="student_register.entry_mode.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTME">
                            UTME (Regular Admission)
                          </SelectItem>
                          <SelectItem value="DE">Direct Entry (DE)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        UTME: min 120 credits, 8–12 semesters. DE: min 90
                        credits, 6–10 semesters.
                      </p>
                    </div>
                  </div>

                  {/* O-Level Results */}
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        O-Level / WAEC / NECO Results
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOLevelRow}
                        data-ocid="student_register.upload_button"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {oLevel.map((row, idx) => (
                        <div
                          key={row.id}
                          className="flex gap-2 items-center"
                          data-ocid={`student_register.olevel.item.${idx + 1}`}
                        >
                          <Select
                            value={row.subject}
                            onValueChange={(v) =>
                              updateOLevelRow(idx, "subject", v)
                            }
                          >
                            <SelectTrigger className="flex-1 text-xs">
                              <SelectValue placeholder="Subject..." />
                            </SelectTrigger>
                            <SelectContent>
                              {OLEVEL_SUBJECTS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={row.grade}
                            onValueChange={(v) =>
                              updateOLevelRow(idx, "grade", v)
                            }
                          >
                            <SelectTrigger className="w-20 text-xs">
                              <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {OLEVEL_GRADES.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            onClick={() => removeOLevelRow(idx)}
                            data-ocid={`student_register.olevel.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Passport Photo */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                      Passport Photograph
                    </h3>
                    <div className="flex gap-4 items-start">
                      {/* Photo preview */}
                      <div
                        className="w-24 h-24 rounded-full border-2 border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden"
                        data-ocid="student_register.canvas_target"
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Tabs defaultValue="webcam">
                          <TabsList className="h-8">
                            <TabsTrigger value="webcam" className="text-xs">
                              <Camera className="w-3 h-3 mr-1" /> Webcam
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="text-xs">
                              <Upload className="w-3 h-3 mr-1" /> Upload
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="webcam" className="mt-2">
                            {camError && (
                              <p className="text-xs text-destructive mb-2">
                                {camError}
                              </p>
                            )}
                            <video
                              ref={videoRef}
                              className={`w-full rounded-md bg-muted ${streamActive ? "block" : "hidden"}`}
                              style={{ maxHeight: 180 }}
                              autoPlay
                              playsInline
                              muted
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2 mt-2">
                              {!streamActive ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={startCamera}
                                  data-ocid="student_register.upload_button"
                                >
                                  <Camera className="w-3 h-3 mr-1" /> Start
                                  Camera
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="text-xs"
                                    onClick={capturePhoto}
                                    data-ocid="student_register.canvas_target"
                                  >
                                    Capture
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={stopCamera}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="upload" className="mt-2">
                            <label
                              className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                              data-ocid="student_register.dropzone"
                            >
                              <Upload className="w-4 h-4" />
                              Click to upload passport photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                              />
                            </label>
                          </TabsContent>
                        </Tabs>
                        {photo && (
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs text-success border-success/30"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Photo set
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                      Set Password
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={
                              formErrors.password
                                ? "border-destructive pr-10"
                                : "pr-10"
                            }
                            data-ocid="student_register.password_input"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword((p) => !p)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {formErrors.password && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.password}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">
                          Confirm Password{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={
                            formErrors.confirmPassword
                              ? "border-destructive"
                              : ""
                          }
                          data-ocid="student_register.confirm_password_input"
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("lookup")}
                      data-ocid="student_register.cancel_button"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={submitting}
                      onClick={handleSubmit}
                      data-ocid="student_register.submit_button"
                    >
                      {submitting
                        ? "Submitting..."
                        : existingStudentId !== null
                          ? "Complete Registration"
                          : "Register & Continue"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent
                  className="pt-8 pb-8 text-center"
                  data-ocid="student_register.success_state"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    Registration Complete!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Welcome to UniResults Pro. You will be redirected to your
                    student portal shortly.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="text-center mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
