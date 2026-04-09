import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardPaste,
  Loader2,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isCourseCore } from "../../context/AppContext";

// ─── Types ──────────────────────────────────────────────────────────────────

import type { Course } from "../../context/AppContext";

interface ScanCourseModalProps {
  open: boolean;
  onClose: () => void;
  deptCourses: Course[];
  firstSemCredits: number;
  secondSemCredits: number;
  maxCredits: number;
  firstSemRegIds: Set<bigint>;
  secondSemRegIds: Set<bigint>;
  canReg1: boolean;
  canReg2: boolean;
  carryoverCourseIds: Set<bigint>;
  onAdd: (
    courseId: bigint,
    courseName: string,
    sem: "First" | "Second",
    currentCredits: number,
    course: Course,
  ) => void;
}

interface PasteCodesModalProps {
  open: boolean;
  onClose: () => void;
  deptCourses: Course[];
  firstSemCredits: number;
  secondSemCredits: number;
  maxCredits: number;
  firstSemRegIds: Set<bigint>;
  secondSemRegIds: Set<bigint>;
  canReg1: boolean;
  canReg2: boolean;
  carryoverCourseIds: Set<bigint>;
  onAdd: (
    courseId: bigint,
    courseName: string,
    sem: "First" | "Second",
    currentCredits: number,
    course: Course,
  ) => void;
}

type ParsedRow = {
  inputCode: string;
  course: Course | null;
  semester: "First" | "Second" | null;
  status: "available" | "already-registered" | "not-found" | "locked";
  selected: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeCode(code: string): string {
  return code
    .replace(/[.\s]+/g, " ")
    .trim()
    .toUpperCase();
}

function parseCourseInput(raw: string): string[] {
  return raw
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Scan Course Modal ───────────────────────────────────────────────────────

export function ScanCourseModal({
  open,
  onClose,
  deptCourses,
  firstSemCredits,
  secondSemCredits,
  maxCredits: _maxCredits,
  firstSemRegIds,
  secondSemRegIds,
  canReg1,
  canReg2,
  carryoverCourseIds,
  onAdd,
}: ScanCourseModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matchedCourse, setMatchedCourse] = useState<Course | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) {
      stopCamera();
      setManualCode("");
      setMatchedCourse(null);
      setMatchError(null);
      setRegistered(false);
      setCameraMode(false);
      setCameraError(null);
    }
  }, [open]);

  function stopCamera() {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setCameraLoading(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraMode(true);
    } catch {
      setCameraError(
        "Camera access denied. Please use the manual entry below.",
      );
    } finally {
      setCameraLoading(false);
    }
  }

  function handleCameraClose() {
    stopCamera();
    setCameraMode(false);
    setCameraError(null);
  }

  function findCourse(code: string): Course | null {
    const norm = normalizeCode(code);
    return (
      deptCourses.find((c) => normalizeCode(c.code) === norm) ??
      deptCourses.find((c) =>
        normalizeCode(c.code).startsWith(norm.slice(0, 5)),
      ) ??
      null
    );
  }

  function handleSearch() {
    setMatchError(null);
    setMatchedCourse(null);
    setRegistered(false);
    const code = manualCode.trim();
    if (!code) return;
    const found = findCourse(code);
    if (!found) {
      setMatchError(
        `No course found matching "${code}" in your department's catalog.`,
      );
      return;
    }
    setMatchedCourse(found);
  }

  function handleRegister() {
    if (!matchedCourse) return;
    const sem =
      matchedCourse.semester === "First" || matchedCourse.semester === "Second"
        ? (matchedCourse.semester as "First" | "Second")
        : null;
    if (!sem) {
      toast.error("Cannot determine semester for this course.");
      return;
    }
    const isReg1 = firstSemRegIds.has(matchedCourse.id);
    const isReg2 = secondSemRegIds.has(matchedCourse.id);
    if ((sem === "First" && isReg1) || (sem === "Second" && isReg2)) {
      toast.error(`${matchedCourse.code} is already registered.`);
      return;
    }
    if (sem === "First" && !canReg1) {
      toast.error("Registration is closed for First Semester.");
      return;
    }
    if (sem === "Second" && !canReg2) {
      toast.error("Registration is closed for Second Semester.");
      return;
    }
    if (carryoverCourseIds.has(matchedCourse.id)) {
      toast.error(
        "Carry-over courses are auto-registered and cannot be re-added.",
      );
      return;
    }
    const credits = sem === "First" ? firstSemCredits : secondSemCredits;
    onAdd(matchedCourse.id, matchedCourse.code, sem, credits, matchedCourse);
    setRegistered(true);
  }

  const semLabel = matchedCourse?.semester ?? "—";
  const isAlreadyReg =
    matchedCourse &&
    (firstSemRegIds.has(matchedCourse.id) ||
      secondSemRegIds.has(matchedCourse.id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="scan_course.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Scan / Search Course Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera section */}
          <div className="space-y-2">
            {!cameraMode ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={startCamera}
                disabled={cameraLoading}
                data-ocid="scan_course.camera_button"
              >
                {cameraLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {cameraLoading ? "Starting camera..." : "Open Camera"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    style={{ width: "100%", height: 200, objectFit: "cover" }}
                    playsInline
                    muted
                    autoPlay
                  />
                  <button
                    type="button"
                    onClick={handleCameraClose}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                    data-ocid="scan_course.close_camera_button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-primary/80 rounded-lg"
                      style={{
                        width: 160,
                        height: 80,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Point camera at barcode or QR code, then type the detected
                  code below
                </p>
              </div>
            )}

            {cameraError && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                data-ocid="scan_course.error_state"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Course Code</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. BIO 101 or GST.111"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setMatchedCourse(null);
                  setMatchError(null);
                  setRegistered(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-ocid="scan_course.input"
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={!manualCode.trim()}
                data-ocid="scan_course.search_button"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Type or paste the course code then click search (or press Enter)
            </p>
          </div>

          {/* Error */}
          {matchError && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              data-ocid="scan_course.error_state"
            >
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{matchError}</p>
            </div>
          )}

          {/* Match result */}
          {matchedCourse && (
            <div
              className="p-4 rounded-xl border border-border bg-muted/30 space-y-3"
              data-ocid="scan_course.panel"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">
                      {matchedCourse.code}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isCourseCore(matchedCourse.code)
                          ? "border-primary/30 text-primary bg-primary/5"
                          : ""
                      }
                    >
                      {isCourseCore(matchedCourse.code) ? "Core" : "Elective"}
                    </Badge>
                    <Badge variant="secondary">{semLabel} Sem</Badge>
                  </div>
                  <p className="text-sm mt-1 text-foreground">
                    {matchedCourse.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {String(matchedCourse.creditUnits)} credit units
                  </p>
                </div>
                {isAlreadyReg && (
                  <Badge className="bg-success/10 text-success border-success/20 shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Registered
                  </Badge>
                )}
              </div>

              {registered ? (
                <div
                  className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20"
                  data-ocid="scan_course.success_state"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm text-success font-medium">
                    Successfully registered!
                  </p>
                </div>
              ) : (
                !isAlreadyReg && (
                  <Button
                    className="w-full"
                    onClick={handleRegister}
                    data-ocid="scan_course.primary_button"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Register This Course
                  </Button>
                )
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="scan_course.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Paste Codes Modal ───────────────────────────────────────────────────────

export function PasteCodesModal({
  open,
  onClose,
  deptCourses,
  firstSemCredits,
  secondSemCredits,
  maxCredits,
  firstSemRegIds,
  secondSemRegIds,
  canReg1,
  canReg2,
  carryoverCourseIds,
  onAdd,
}: PasteCodesModalProps) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!open) {
      setRawText("");
      setParsed([]);
      setIsParsed(false);
    }
  }, [open]);

  function findCourse(code: string): Course | null {
    const norm = normalizeCode(code);
    return (
      deptCourses.find((c) => normalizeCode(c.code) === norm) ??
      deptCourses.find((c) =>
        normalizeCode(c.code).startsWith(norm.slice(0, 5)),
      ) ??
      null
    );
  }

  function handleParse() {
    const codes = parseCourseInput(rawText);
    if (!codes.length) {
      toast.error("No course codes found. Please paste at least one code.");
      return;
    }

    const rows: ParsedRow[] = codes.map((inputCode) => {
      const course = findCourse(inputCode);
      if (!course) {
        return {
          inputCode,
          course: null,
          semester: null,
          status: "not-found" as const,
          selected: false,
        };
      }
      const sem =
        course.semester === "First" || course.semester === "Second"
          ? (course.semester as "First" | "Second")
          : null;
      const isReg =
        (sem === "First" && firstSemRegIds.has(course.id)) ||
        (sem === "Second" && secondSemRegIds.has(course.id));
      const isLocked = carryoverCourseIds.has(course.id);
      const status = isLocked
        ? "locked"
        : isReg
          ? "already-registered"
          : "available";
      return {
        inputCode,
        course,
        semester: sem,
        status,
        selected: status === "available",
      };
    });

    setParsed(rows);
    setIsParsed(true);
  }

  function toggleSelect(idx: number) {
    setParsed((prev) =>
      prev.map((r, i) =>
        i === idx && r.status === "available"
          ? { ...r, selected: !r.selected }
          : r,
      ),
    );
  }

  function selectAll() {
    setParsed((prev) =>
      prev.map((r) =>
        r.status === "available" ? { ...r, selected: true } : r,
      ),
    );
  }

  function selectNone() {
    setParsed((prev) => prev.map((r) => ({ ...r, selected: false })));
  }

  async function handleRegisterSelected() {
    const toReg = parsed.filter(
      (r) => r.selected && r.status === "available" && r.course && r.semester,
    );
    if (!toReg.length) {
      toast.error("No courses selected for registration.");
      return;
    }

    setIsRegistering(true);
    let successCount = 0;
    let skipped = 0;

    // Track running credit totals
    let credits1 = firstSemCredits;
    let credits2 = secondSemCredits;

    for (const row of toReg) {
      if (!row.course || !row.semester) continue;
      const sem = row.semester;
      if (sem === "First" && !canReg1) {
        skipped++;
        continue;
      }
      if (sem === "Second" && !canReg2) {
        skipped++;
        continue;
      }
      const credits = sem === "First" ? credits1 : credits2;
      const newTotal = credits + Number(row.course.creditUnits);
      if (newTotal > maxCredits) {
        skipped++;
        continue;
      }
      onAdd(row.course.id, row.course.code, sem, credits, row.course);
      if (sem === "First") credits1 = newTotal;
      else credits2 = newTotal;
      successCount++;
    }

    await new Promise((r) => setTimeout(r, 300));
    setIsRegistering(false);

    const notFound = parsed.filter((r) => r.status === "not-found").length;
    const alreadyReg = parsed.filter(
      (r) => r.status === "already-registered" || r.status === "locked",
    ).length;
    toast.success(
      `Registered ${successCount} course${successCount !== 1 ? "s" : ""}.${notFound ? ` ${notFound} not found.` : ""}${alreadyReg ? ` ${alreadyReg} already registered.` : ""}${skipped > successCount ? ` ${skipped} skipped (credit limit or portal closed).` : ""}`,
    );
    if (successCount > 0) {
      onClose();
    }
  }

  const selectedCount = parsed.filter((r) => r.selected).length;
  const notFoundCount = parsed.filter((r) => r.status === "not-found").length;
  const alreadyRegCount = parsed.filter(
    (r) => r.status === "already-registered" || r.status === "locked",
  ).length;

  function statusBadge(row: ParsedRow) {
    switch (row.status) {
      case "available":
        return (
          <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
            Available
          </Badge>
        );
      case "already-registered":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            Registered
          </Badge>
        );
      case "locked":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">
            Carry-Over
          </Badge>
        );
      case "not-found":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
            Not Found
          </Badge>
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        data-ocid="paste_codes.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-primary" />
            Paste Course Codes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!isParsed ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Paste course codes below</Label>
                <Textarea
                  placeholder={
                    "Paste course codes here, one per line or comma-separated\nExample:\nBIO 101\nGST 111\nCHM 101, MTH 101"
                  }
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-36 font-mono text-sm"
                  data-ocid="paste_codes.textarea"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Separate codes with commas, semicolons, or new lines. Dots and
                spaces in codes are normalized automatically (e.g.{" "}
                <code>BIO.101</code> = <code>BIO 101</code>).
              </p>
              <Button
                className="w-full"
                onClick={handleParse}
                disabled={!rawText.trim()}
                data-ocid="paste_codes.parse_button"
              >
                <Search className="w-4 h-4 mr-2" />
                Parse Codes
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs font-medium">
                  {parsed.length} code{parsed.length !== 1 ? "s" : ""} parsed
                </span>
                {notFoundCount > 0 && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                    {notFoundCount} not found
                  </Badge>
                )}
                {alreadyRegCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {alreadyRegCount} already registered
                  </Badge>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={selectAll}
                    data-ocid="paste_codes.select_all_button"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:underline"
                    onClick={selectNone}
                    data-ocid="paste_codes.select_none_button"
                  >
                    Select None
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Sem</TableHead>
                      <TableHead className="text-xs">Units</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((row, i) => (
                      <TableRow
                        key={`${row.inputCode}-${i}`}
                        className={
                          row.status === "not-found" ? "opacity-50" : ""
                        }
                        data-ocid={`paste_codes.item.${i + 1}`}
                      >
                        <TableCell>
                          {row.status === "available" && (
                            <Checkbox
                              checked={row.selected}
                              onCheckedChange={() => toggleSelect(i)}
                              data-ocid={`paste_codes.checkbox.${i + 1}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {row.course?.code ?? row.inputCode}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {row.course?.name ?? (
                            <span className="text-muted-foreground italic">
                              Not in catalog
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.semester ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.course ? String(row.course.creditUnits) : "—"}
                        </TableCell>
                        <TableCell>{statusBadge(row)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setIsParsed(false)}
                data-ocid="paste_codes.back_button"
              >
                ← Edit input
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="paste_codes.cancel_button"
          >
            Cancel
          </Button>
          {isParsed && (
            <Button
              disabled={selectedCount === 0 || isRegistering}
              onClick={handleRegisterSelected}
              data-ocid="paste_codes.submit_button"
            >
              {isRegistering ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Register{" "}
              {selectedCount > 0 ? `${selectedCount} Selected` : "Selected"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
