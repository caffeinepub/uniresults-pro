import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

interface AmendmentRules {
  whoCanRequest: "lecturer_only" | "lecturer_hod";
  approvalChain: "hod_only" | "hod_registrar";
  maxDaysAfterPublication: number;
}

const DEFAULT_AMENDMENT_RULES: AmendmentRules = {
  whoCanRequest: "lecturer_only",
  approvalChain: "hod_registrar",
  maxDaysAfterPublication: 30,
};

function loadAmendmentRules(): AmendmentRules {
  try {
    const raw = localStorage.getItem("amendmentRules");
    if (raw) return JSON.parse(raw) as AmendmentRules;
  } catch {
    // ignore
  }
  return DEFAULT_AMENDMENT_RULES;
}

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
  const [amendRules, setAmendRules] =
    useState<AmendmentRules>(loadAmendmentRules);

  // Auto-open on first visit (no lock after completion - always editable)
  useEffect(() => {
    const done = localStorage.getItem("systemInitDone");
    if (!done) {
      setOpen(true);
    }
  }, []);

  // Sync form with latest settings when dialog opens
  function handleOpenChange(o: boolean) {
    if (o) {
      setInstForm({
        name: institutionSettings.name,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        website: institutionSettings.website,
        logoText: institutionSettings.logoText,
      });
      setAmendRules(loadAmendmentRules());
      setStep(1);
    }
    setOpen(o);
  }

  function handleSkip() {
    localStorage.setItem("systemInitDone", "true");
    setOpen(false);
  }

  function handleNext() {
    if (step < 5) setStep(step + 1);
  }

  function handleFinish() {
    updateInstitutionSettings(instForm);
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
    localStorage.setItem("amendmentRules", JSON.stringify(amendRules));
    localStorage.setItem("systemInitDone", "true");
    toast.success("Settings saved successfully!");
    setOpen(false);
  }

  const steps = [
    { num: 1, label: "Institution", icon: Settings2 },
    { num: 2, label: "Admin", icon: Shield },
    { num: 3, label: "Academic Year", icon: GraduationCap },
    { num: 4, label: "Data Setup", icon: Database },
    { num: 5, label: "Amendments", icon: Wrench },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* Hidden trigger - open programmatically or via button in AdminDashboard */}
        <span style={{ display: "none" }} />
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="init_wizard.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Settings Wizard
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
                      ? "text-green-600"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > s.num
                      ? "bg-green-500 text-white"
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
                  className={`flex-1 h-px ${step > s.num ? "bg-green-400" : "bg-border"}`}
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
                Institution details appear on all reports and certificates.
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
                  Use the Settings tab to change user accounts and passwords.
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
                departments, and courses).
              </p>
              {structureGenerated ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-400/40 bg-green-50 dark:bg-green-900/10 p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-700">
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
                Creates faculties, departments, and sample courses. Modify them
                later from the relevant tabs.
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure rules for result score amendment requests.
              </p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Who Can Request Amendments</Label>
                  <Select
                    value={amendRules.whoCanRequest}
                    onValueChange={(v) =>
                      setAmendRules((r) => ({
                        ...r,
                        whoCanRequest: v as AmendmentRules["whoCanRequest"],
                      }))
                    }
                  >
                    <SelectTrigger data-ocid="init_wizard.amend_who.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecturer_only">
                        Lecturer Only
                      </SelectItem>
                      <SelectItem value="lecturer_hod">
                        Lecturer + HOD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Approval Chain</Label>
                  <Select
                    value={amendRules.approvalChain}
                    onValueChange={(v) =>
                      setAmendRules((r) => ({
                        ...r,
                        approvalChain: v as AmendmentRules["approvalChain"],
                      }))
                    }
                  >
                    <SelectTrigger data-ocid="init_wizard.amend_chain.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hod_only">HOD Only</SelectItem>
                      <SelectItem value="hod_registrar">
                        HOD + Registrar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Max Days After Publication</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    data-ocid="init_wizard.amend_days.input"
                    value={amendRules.maxDaysAfterPublication}
                    onChange={(e) =>
                      setAmendRules((r) => ({
                        ...r,
                        maxDaysAfterPublication: Math.max(
                          1,
                          Number(e.target.value) || 30,
                        ),
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Lecturers can only request amendments within this window
                    after results are published.
                  </p>
                </div>
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
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button data-ocid="init_wizard.next.button" onClick={handleNext}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                data-ocid="init_wizard.finish.button"
                onClick={handleFinish}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Save Settings
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A button that opens the Settings Wizard dialog.
 * Can be placed anywhere in AdminDashboard.
 */
export function SettingsWizardButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ocid="settings_wizard.open_modal_button"
        >
          <Wrench className="w-3.5 h-3.5 mr-1.5" /> Settings Wizard
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <EmbeddedWizardContent />
      </DialogContent>
    </Dialog>
  );
}

/** Internal wizard content reused by the standalone button */
function EmbeddedWizardContent() {
  const {
    institutionSettings,
    updateInstitutionSettings,
    academicCalendars,
    setActiveCalendar,
    addAcademicCalendar,
    resetToDefaultData,
    currentUser,
  } = useApp();

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
  const [amendRules, setAmendRules] =
    useState<AmendmentRules>(loadAmendmentRules);

  function handleSave() {
    updateInstitutionSettings(instForm);
    const existing = academicCalendars.find(
      (c) => c.session === selectedSession && c.semester === selectedSemester,
    );
    if (existing) {
      setActiveCalendar(existing.id);
    } else {
      addAcademicCalendar({
        id: BigInt(Date.now()),
        session: selectedSession,
        semester: selectedSemester,
        isActive: true,
        startDate: "",
        endDate: "",
        registrationOpen: false,
        addDropOpen: false,
      });
    }
    localStorage.setItem("amendmentRules", JSON.stringify(amendRules));
    localStorage.setItem("systemInitDone", "true");
    toast.success("Settings saved!");
  }

  const steps = [
    { num: 1, label: "Institution", icon: Settings2 },
    { num: 2, label: "Admin", icon: Shield },
    { num: 3, label: "Academic Year", icon: GraduationCap },
    { num: 4, label: "Data Setup", icon: Database },
    { num: 5, label: "Amendments", icon: Wrench },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          Settings Wizard
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-1 py-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-1.5 text-xs font-medium ${
                step === s.num
                  ? "text-primary"
                  : step > s.num
                    ? "text-green-600"
                    : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.num
                    ? "bg-green-500 text-white"
                    : step === s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${step > s.num ? "bg-green-400" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="py-3 min-h-[200px]">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Institution details appear on all reports.
            </p>
            {(["name", "address", "phone", "email"] as const).map((field) => (
              <div key={field} className="grid gap-2">
                <Label className="capitalize">{field}</Label>
                <Input
                  value={instForm[field] ?? ""}
                  onChange={(e) =>
                    setInstForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Current Administrator</p>
              <p className="text-sm">
                Name: <strong>{currentUser?.name ?? "admin"}</strong>
              </p>
              <p className="text-sm">
                Role: <strong>{currentUser?.role ?? "SuperAdmin"}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Use the Settings tab to change user accounts.
              </p>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set the active academic session and semester.
            </p>
            <div className="grid gap-2">
              <Label>Academic Session</Label>
              <Input
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First Semester</SelectItem>
                  <SelectItem value="Second">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a default academic structure.
            </p>
            {structureGenerated ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-400/40 bg-green-50 dark:bg-green-900/10 p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  Default structure generated.
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetToDefaultData();
                  setStructureGenerated(true);
                  toast.success("Default academic structure generated");
                }}
              >
                <Database className="w-4 h-4 mr-2" /> Generate Default Structure
              </Button>
            )}
          </div>
        )}
        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure amendment request rules.
            </p>
            <div className="grid gap-2">
              <Label>Who Can Request</Label>
              <Select
                value={amendRules.whoCanRequest}
                onValueChange={(v) =>
                  setAmendRules((r) => ({
                    ...r,
                    whoCanRequest: v as AmendmentRules["whoCanRequest"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecturer_only">Lecturer Only</SelectItem>
                  <SelectItem value="lecturer_hod">Lecturer + HOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Approval Chain</Label>
              <Select
                value={amendRules.approvalChain}
                onValueChange={(v) =>
                  setAmendRules((r) => ({
                    ...r,
                    approvalChain: v as AmendmentRules["approvalChain"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hod_only">HOD Only</SelectItem>
                  <SelectItem value="hod_registrar">HOD + Registrar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Max Days After Publication</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={amendRules.maxDaysAfterPublication}
                onChange={(e) =>
                  setAmendRules((r) => ({
                    ...r,
                    maxDaysAfterPublication: Math.max(
                      1,
                      Number(e.target.value) || 30,
                    ),
                  }))
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          {step < 5 && (
            <Button size="sm" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
        <Button data-ocid="settings_wizard.save_button" onClick={handleSave}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Save Settings
        </Button>
      </div>
    </>
  );
}
