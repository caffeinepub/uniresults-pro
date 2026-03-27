import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowRight,
  CheckCircle2,
  Database,
  GraduationCap,
  Settings2,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function SystemInitWizard() {
  const {
    institutionSettings,
    updateInstitutionSettings,
    academicCalendars,
    setActiveCalendar,
    addAcademicCalendar,
    resetToDefaultData,
    currentUser,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [instForm, setInstForm] = useState({
    name: institutionSettings.name,
    address: institutionSettings.address,
    phone: institutionSettings.phone,
    email: institutionSettings.email,
    website: institutionSettings.website,
    logoText: institutionSettings.logoText,
  });
  const [selectedSession, setSelectedSession] = useState(
    academicCalendars.find((c) => c.isActive)?.session ??
      `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  );
  const [selectedSemester, setSelectedSemester] = useState<"First" | "Second">(
    academicCalendars.find((c) => c.isActive)?.semester ?? "First",
  );
  const [structureGenerated, setStructureGenerated] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("systemInitDone");
    if (!done) {
      setOpen(true);
    }
  }, []);

  function handleSkip() {
    localStorage.setItem("systemInitDone", "true");
    setOpen(false);
  }

  function handleNext() {
    if (step < 4) setStep(step + 1);
  }

  function handleFinish() {
    // Step 1: save institution settings
    updateInstitutionSettings(instForm);
    // Step 3: set active session
    const existing = academicCalendars.find(
      (c) => c.session === selectedSession && c.semester === selectedSemester,
    );
    if (existing) {
      setActiveCalendar(existing.id);
    } else {
      const newId = BigInt(Date.now());
      addAcademicCalendar({
        id: newId,
        session: selectedSession,
        semester: selectedSemester,
        isActive: true,
        startDate: "",
        endDate: "",
        registrationOpen: false,
        addDropOpen: false,
      });
    }
    localStorage.setItem("systemInitDone", "true");
    toast.success("System setup complete!");
    setOpen(false);
  }

  const steps = [
    { num: 1, label: "Institution", icon: Settings2 },
    { num: 2, label: "Admin Account", icon: Shield },
    { num: 3, label: "Academic Year", icon: GraduationCap },
    { num: 4, label: "Data Setup", icon: Database },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="init_wizard.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            System Setup Wizard
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center gap-1 py-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1 flex-1">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  step === s.num
                    ? "text-primary"
                    : step > s.num
                      ? "text-success"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > s.num
                      ? "bg-success text-success-foreground"
                      : step === s.num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px ${step > s.num ? "bg-success" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-3 min-h-[220px]">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Confirm your institution details — these appear on all reports
                and certificates.
              </p>
              <div className="grid gap-2">
                <Label>Institution Name</Label>
                <Input
                  data-ocid="init_wizard.institution_name.input"
                  value={instForm.name}
                  onChange={(e) =>
                    setInstForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  data-ocid="init_wizard.address.input"
                  value={instForm.address}
                  onChange={(e) =>
                    setInstForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    data-ocid="init_wizard.phone.input"
                    value={instForm.phone}
                    onChange={(e) =>
                      setInstForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    data-ocid="init_wizard.email.input"
                    value={instForm.email}
                    onChange={(e) =>
                      setInstForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirm the SuperAdmin account that will manage this system.
              </p>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">Current Administrator</p>
                <p className="text-sm">
                  Name: <strong>{currentUser?.name ?? "admin"}</strong>
                </p>
                <p className="text-sm">
                  Role: <strong>{currentUser?.role ?? "SuperAdmin"}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the Settings tab to change user accounts and passwords
                  after setup.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the active academic session and semester.
              </p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Academic Session</Label>
                  <Input
                    data-ocid="init_wizard.session.input"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    placeholder="e.g. 2025/2026"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Semester</Label>
                  <Select
                    value={selectedSemester}
                    onValueChange={(v) =>
                      setSelectedSemester(v as "First" | "Second")
                    }
                  >
                    <SelectTrigger data-ocid="init_wizard.semester.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First Semester</SelectItem>
                      <SelectItem value="Second">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optionally generate a default academic structure (faculties,
                departments, and courses) for a fresh start.
              </p>
              {structureGenerated ? (
                <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-4">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="text-sm font-medium text-success">
                    Default academic structure generated.
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  data-ocid="init_wizard.generate_data.button"
                  onClick={() => {
                    resetToDefaultData();
                    setStructureGenerated(true);
                    toast.success("Default academic structure generated");
                  }}
                >
                  <Database className="w-4 h-4 mr-2" /> Generate Default
                  Academic Structure
                </Button>
              )}
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                This creates faculties, departments, and sample courses. You can
                always modify them later from the Faculties, Departments, and
                Courses tabs.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            data-ocid="init_wizard.skip.button"
            onClick={handleSkip}
          >
            Skip Setup
          </Button>
          {step < 4 ? (
            <Button data-ocid="init_wizard.next.button" onClick={handleNext}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              data-ocid="init_wizard.finish.button"
              onClick={handleFinish}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Finish Setup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
