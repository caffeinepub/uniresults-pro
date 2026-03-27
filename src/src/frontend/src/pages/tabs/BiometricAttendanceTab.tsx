import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CameraOff, Download, User } from "lucide-react";
import { useMemo, useState } from "react";

interface BiometricEntry {
  sessionId: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  courseName: string;
  date: string;
  timestamp: string;
  photoDataUrl: string | null;
  present: boolean;
}

function loadBiometricEntries(): BiometricEntry[] {
  const entries: BiometricEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("biometric_")) {
        const parts = key.replace("biometric_", "").split("_");
        if (parts.length >= 2) {
          const sessionId = parts[0];
          const studentId = parts.slice(1).join("_");
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const data = JSON.parse(raw);
              entries.push({
                sessionId,
                studentId,
                studentName: data.studentName || "Unknown",
                matricNumber: data.matricNumber || "-",
                courseName: data.courseName || "-",
                date: data.date || "",
                timestamp: data.timestamp || "",
                photoDataUrl: data.photoDataUrl || null,
                present: data.present ?? true,
              });
            }
          } catch {}
        }
      }
    }
  } catch {}
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export default function BiometricAttendanceTab() {
  const [searchName, setSearchName] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const entries = useMemo(() => loadBiometricEntries(), []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (
        searchName &&
        !e.studentName.toLowerCase().includes(searchName.toLowerCase())
      )
        return false;
      if (courseFilter !== "all" && e.courseName !== courseFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [entries, searchName, courseFilter, dateFrom, dateTo]);

  const courseNames = useMemo(() => {
    const names = new Set(
      entries.map((e) => e.courseName).filter((n) => n !== "-"),
    );
    return Array.from(names).sort();
  }, [entries]);

  function exportLog() {
    const header = [
      "Student Name",
      "Matric No",
      "Course",
      "Date",
      "Timestamp",
      "Status",
    ];
    const rows = filtered.map((e) => [
      e.studentName,
      e.matricNumber,
      e.courseName,
      e.date,
      new Date(e.timestamp).toLocaleString(),
      e.present ? "Present" : "Absent",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biometric_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5" data-ocid="biometric.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Biometric Attendance Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Webcam-captured attendance photos and records
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportLog}
          data-ocid="biometric.export.button"
          disabled={filtered.length === 0}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/20 rounded-lg border border-border/50 no-print">
        <div className="space-y-1">
          <Label className="text-xs">Student Name</Label>
          <Input
            className="h-8 text-xs w-40"
            placeholder="Search name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            data-ocid="biometric.search_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Course</Label>
          <select
            className="h-8 text-xs border border-input rounded-md px-2 bg-background"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            data-ocid="biometric.course.select"
          >
            <option value="all">All Courses</option>
            {courseNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From Date</Label>
          <input
            type="date"
            className="h-8 text-xs border border-input rounded-md px-2 bg-background"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To Date</Label>
          <input
            type="date"
            className="h-8 text-xs border border-input rounded-md px-2 bg-background"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg"
          data-ocid="biometric.empty_state"
        >
          <CameraOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No biometric captures yet</p>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            Biometric photos are captured during attendance marking. Go to the
            Attendance tab, open a session, and click the camera icon next to a
            student.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="biometric.filter_empty_state"
        >
          No records match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((entry, i) => (
            <div
              key={`${entry.sessionId}_${entry.studentId}`}
              className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
              data-ocid={`biometric.item.${i + 1}`}
            >
              {/* Photo */}
              <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                {entry.photoDataUrl ? (
                  <img
                    src={entry.photoDataUrl}
                    alt={entry.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground/40" />
                )}
              </div>
              {/* Info */}
              <div className="p-2 space-y-1">
                <p className="text-xs font-semibold truncate">
                  {entry.studentName}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {entry.matricNumber}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {entry.courseName}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 ${entry.present ? "border-green-500 text-green-600" : "border-red-400 text-red-500"}`}
                  >
                    {entry.present ? "Present" : "Absent"}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
