import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function DataBackupTab() {
  const app = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(
    () => localStorage.getItem("unirp_last_backup") ?? null,
  );

  const BACKUP_KEYS = [
    "departments",
    "faculties",
    "courses",
    "students",
    "results",
    "courseRegistrations",
    "amendmentRequests",
    "academicCalendars",
    "gradeAppeals",
    "notifications",
    "auditLog",
    "graduationApplications",
    "timetableEntries",
    "feeRecords",
    "staffMembers",
    "semesterSeals",
    "deferralApplications",
    "attendanceSessions",
    "studentDocuments",
    "examSchedule",
    "courseFeedback",
    "institutionSettings",
    "graduationRequirements",
  ];

  const PREFIX = "unirp_";

  function handleExport() {
    const backup: Record<string, unknown> = {
      __version: "v37",
      __date: new Date().toISOString(),
    };
    for (const key of BACKUP_KEYS) {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw) {
        try {
          backup[key] = JSON.parse(raw);
        } catch {
          backup[key] = raw;
        }
      }
    }
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unipro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    localStorage.setItem("unirp_last_backup", now);
    setLastBackup(now);
    app.logAudit(
      app.currentUser?.name ?? "",
      app.currentUser?.role ?? "",
      "Data Backup Export",
      `Full system backup exported on ${now}`,
    );
    toast.success("Backup exported successfully");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setRestoreData(data);
        setRestoreOpen(true);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleRestore() {
    if (!restoreData) return;
    for (const key of BACKUP_KEYS) {
      if (restoreData[key] !== undefined) {
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(restoreData[key]));
        } catch {
          // ignore
        }
      }
    }
    app.logAudit(
      app.currentUser?.name ?? "",
      app.currentUser?.role ?? "",
      "Data Backup Restore",
      "System restored from backup file",
    );
    toast.success("Restore complete — please reload the page to see changes");
    setRestoreOpen(false);
    setRestoreData(null);
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Data Backup & Restore</h2>
        <p className="text-sm text-muted-foreground">
          Export a full JSON backup of all system data or restore from a
          previous backup.
        </p>
      </div>

      {lastBackup && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <span className="text-muted-foreground">Last backup: </span>
          <span className="font-medium">
            {new Date(lastBackup).toLocaleString("en-NG")}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Export Full Backup</p>
              <p className="text-xs text-muted-foreground">
                Downloads all system data as a JSON file
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            data-ocid="backup.export_button"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" /> Export Backup
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold">Restore from Backup</p>
              <p className="text-xs text-muted-foreground">
                Overwrites current data with backup file
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            className="w-full"
            data-ocid="backup.upload_button"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" /> Select Backup File
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm space-y-1">
        <p className="font-semibold text-destructive">⚠ Important</p>
        <p className="text-muted-foreground">
          Restoring from a backup will overwrite ALL current data. This action
          cannot be undone. Always export a fresh backup before restoring.
        </p>
      </div>

      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent data-ocid="backup.dialog">
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
            <DialogDescription>
              This will overwrite all current system data with the backup from{" "}
              <strong>
                {restoreData?.__date
                  ? new Date(restoreData.__date as string).toLocaleString(
                      "en-NG",
                    )
                  : "unknown date"}
              </strong>
              . All changes since that backup will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="backup.cancel_button"
              onClick={() => setRestoreOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="backup.confirm_button"
              onClick={handleRestore}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Restore Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
