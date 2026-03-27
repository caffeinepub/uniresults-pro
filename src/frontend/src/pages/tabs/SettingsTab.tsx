import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Database,
  Download,
  Lock,
  Save,
  Shield,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type InstitutionSettings, useApp } from "../../context/AppContext";
import {
  INSTITUTION_TYPE_OPTIONS,
  getInstitutionConfig,
} from "../../utils/institutionConfig";

const PREFIX = "unires_";

interface SecuritySettings {
  requireApprovalConfirmation: boolean;
  autoLockSession: boolean;
  showAuditToAllAdmins: boolean;
}

const DEFAULT_SECURITY: SecuritySettings = {
  requireApprovalConfirmation: true,
  autoLockSession: false,
  showAuditToAllAdmins: false,
};

function getStorageUsage(): string {
  try {
    return (JSON.stringify(localStorage).length / 1024).toFixed(1);
  } catch {
    return "0";
  }
}

function exportAllData() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `unires_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  for (const k of keys) localStorage.removeItem(k);
  window.location.reload();
}

function validateForm(form: InstitutionSettings): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name || form.name.trim().length < 3)
    errors.name = "Institution name must be at least 3 characters.";
  if (!form.address || form.address.trim().length < 5)
    errors.address = "Address must be at least 5 characters.";
  if (!form.phone || !/^[\d\s+\-()]{7,20}$/.test(form.phone))
    errors.phone =
      "Phone must be 7-20 characters (digits, spaces, +, -, () only).";
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Please enter a valid email address.";
  if (form.logoText && form.logoText.length > 6)
    errors.logoText = "Logo abbreviation must be 6 characters or fewer.";
  return errors;
}

export default function SettingsTab() {
  const {
    currentUser,
    institutionSettings,
    syncStatus,
    updateInstitutionSettings,
    logAudit,
  } = useApp();

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const canEdit = isSuperAdmin;

  const [form, setForm] = useState<InstitutionSettings>(institutionSettings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const [security, setSecurity] = useState<SecuritySettings>(() => {
    try {
      const raw = localStorage.getItem(`${PREFIX}securitySettings`);
      return raw
        ? { ...DEFAULT_SECURITY, ...JSON.parse(raw) }
        : DEFAULT_SECURITY;
    } catch {
      return DEFAULT_SECURITY;
    }
  });

  const [storageUsage, setStorageUsage] = useState(getStorageUsage);

  useEffect(() => {
    setForm(institutionSettings);
    setDirty(false);
  }, [institutionSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStorageUsage(getStorageUsage());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleFieldChange(field: keyof InstitutionSettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSaveAttempt() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    updateInstitutionSettings(form);
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "SuperAdmin",
      "UPDATE_INSTITUTION_SETTINGS",
      "Institution profile updated",
    );
    setDirty(false);
    setConfirmOpen(false);
    toast.success("Institution settings saved successfully.");
  }

  function handleSecurityChange(field: keyof SecuritySettings, value: boolean) {
    setSecurity((prev) => {
      const next = { ...prev, [field]: value };
      localStorage.setItem(`${PREFIX}securitySettings`, JSON.stringify(next));
      return next;
    });
    toast.success("Security preference updated.");
  }

  function timeSince(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff === 1) return "1 minute ago";
    return `${diff} minutes ago`;
  }

  return (
    <div className="space-y-6 max-w-3xl" data-ocid="settings.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage institution profile, security preferences, and data storage.
        </p>
      </div>

      {/* Institution Profile */}
      <Card data-ocid="settings.panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" />
            Institution Profile
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Edit your institution's official details used across reports and transcripts."
              : "View institution details. Only SuperAdmin can edit these settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canEdit && (
            <div
              className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
              data-ocid="settings.error_state"
            >
              <Lock className="w-3.5 h-3.5" />
              Only SuperAdmin can edit institution settings.
            </div>
          )}

          {/* Institution Type */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Institution Type</span>
              {(() => {
                const cfg = getInstitutionConfig(form.institutionType);
                const colorMap: Record<string, string> = {
                  university: "bg-blue-100 text-blue-800",
                  nce: "bg-purple-100 text-purple-800",
                  polytechnic: "bg-orange-100 text-orange-800",
                  secondary: "bg-green-100 text-green-800",
                  primary: "bg-yellow-100 text-yellow-800",
                  pre_nursery: "bg-pink-100 text-pink-800",
                };
                const badgeClass = `px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[cfg.type] ?? colorMap.university}`;
                return <span className={badgeClass}>{cfg.shortLabel}</span>;
              })()}
            </div>
            <select
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              value={form.institutionType ?? "university"}
              disabled={!canEdit}
              onChange={(e) =>
                handleFieldChange("institutionType", e.target.value)
              }
              data-ocid="settings.institution_type.select"
            >
              {INSTITUTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Changing institution type affects level labels, grading scale, and
              report formats throughout the system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Institution Name */}
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="inst-name">Institution Name *</Label>
              <Input
                id="inst-name"
                data-ocid="settings.input"
                value={form.name}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Federal University of Technology"
              />
              {errors.name && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.name_error"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="inst-address">Address *</Label>
              <Input
                id="inst-address"
                data-ocid="settings.address.input"
                value={form.address}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="P.M.B. 65, University Road"
              />
              {errors.address && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.address_error"
                >
                  {errors.address}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="inst-phone">Phone *</Label>
              <Input
                id="inst-phone"
                data-ocid="settings.phone.input"
                value={form.phone}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                placeholder="+234 801 234 5678"
              />
              {errors.phone && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.phone_error"
                >
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="inst-email">Email *</Label>
              <Input
                id="inst-email"
                type="email"
                data-ocid="settings.email.input"
                value={form.email}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="registry@university.edu.ng"
              />
              {errors.email && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.email_error"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-1">
              <Label htmlFor="inst-website">Website</Label>
              <Input
                id="inst-website"
                data-ocid="settings.website.input"
                value={form.website}
                disabled={!canEdit}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                placeholder="www.university.edu.ng"
              />
            </div>

            {/* Logo Abbreviation */}
            <div className="space-y-1">
              <Label htmlFor="inst-logo">Logo Abbreviation (max 6 chars)</Label>
              <Input
                id="inst-logo"
                data-ocid="settings.logo.input"
                value={form.logoText}
                disabled={!canEdit}
                maxLength={6}
                onChange={(e) => handleFieldChange("logoText", e.target.value)}
                placeholder="FUT"
              />
              {errors.logoText && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.logo_error"
                >
                  {errors.logoText}
                </p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    data-ocid="settings.save_button"
                    disabled={!dirty}
                    onClick={handleSaveAttempt}
                    className="gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Settings
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-ocid="settings.dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Update Institution Settings?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to update the institution settings?
                      This will affect all reports, transcripts, and system
                      displays.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="settings.cancel_button">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="settings.confirm_button"
                      onClick={handleConfirmSave}
                    >
                      Confirm Save
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Security Preferences
          </CardTitle>
          <CardDescription>
            Local security flags stored in your browser. These apply to your
            current session only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <p className="text-sm font-medium">
                Require confirmation before approving results
              </p>
              <p className="text-xs text-muted-foreground">
                Show a confirmation dialog before batch-approving results.
              </p>
            </div>
            <Switch
              data-ocid="settings.approval_confirm.switch"
              checked={security.requireApprovalConfirmation}
              onCheckedChange={(v) =>
                handleSecurityChange("requireApprovalConfirmation", v)
              }
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <p className="text-sm font-medium">
                Auto-lock session after 30 minutes of inactivity
              </p>
              <p className="text-xs text-muted-foreground">
                Return to login screen after extended inactivity.
              </p>
            </div>
            <Switch
              data-ocid="settings.auto_lock.switch"
              checked={security.autoLockSession}
              onCheckedChange={(v) =>
                handleSecurityChange("autoLockSession", v)
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">
                Show audit trail to all admin roles
              </p>
              <p className="text-xs text-muted-foreground">
                Allow HOD and Dean to view the full audit log.
              </p>
            </div>
            <Switch
              data-ocid="settings.audit_visibility.switch"
              checked={security.showAuditToAllAdmins}
              onCheckedChange={(v) =>
                handleSecurityChange("showAuditToAllAdmins", v)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync & Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Sync & Storage Status
          </CardTitle>
          <CardDescription>
            Monitor your connection status, last save time, and local storage
            usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Online status */}
            <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
              {syncStatus.isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Connection</p>
                <Badge
                  data-ocid="settings.sync.toggle"
                  variant={syncStatus.isOnline ? "default" : "secondary"}
                  className={
                    syncStatus.isOnline
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  }
                >
                  {syncStatus.isOnline ? "Connected" : "Offline Mode"}
                </Badge>
              </div>
            </div>

            {/* Last saved */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Last Saved</p>
              <p
                className="text-sm font-medium mt-0.5"
                data-ocid="settings.last_saved.panel"
              >
                {timeSince(syncStatus.lastSaved)}
              </p>
            </div>

            {/* Storage usage */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Storage Used</p>
              <p
                className="text-sm font-medium mt-0.5"
                data-ocid="settings.storage.panel"
              >
                {storageUsage} KB
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              data-ocid="settings.export.button"
              onClick={exportAllData}
              className="gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export All Data
            </Button>

            <AlertDialog
              open={clearConfirmOpen}
              onOpenChange={setClearConfirmOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  data-ocid="settings.clear.delete_button"
                  className="gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="settings.clear.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Clear All Application Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all students, results, courses,
                    and settings stored in your browser. This action cannot be
                    undone and the page will reload.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="settings.clear.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="settings.clear.confirm_button"
                    onClick={clearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
