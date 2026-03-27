import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, CameraOff, Printer, Shield, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../../camera/useCamera";
import { useApp } from "../../context/AppContext";
import { logCameraAccess } from "../../utils/institutionHelpers";

const PERM_KEY = "cameraPermissions";
const LOG_KEY = "cameraAccessLog";

interface CameraPermissions {
  student: boolean;
  lecturer: boolean;
  hod: boolean;
  dean: boolean;
  registrar: boolean;
  superadmin: boolean;
}

interface AccessLogEntry {
  role: string;
  action: string;
  timestamp: string;
}

const DEFAULT_PERMS: CameraPermissions = {
  student: true,
  lecturer: true,
  hod: true,
  dean: true,
  registrar: true,
  superadmin: true,
};

function loadPerms(): CameraPermissions {
  try {
    const s = localStorage.getItem(PERM_KEY);
    if (s) return { ...DEFAULT_PERMS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_PERMS;
}

function loadLog(): AccessLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {}
  return [];
}

const ROLE_LABELS: Record<keyof CameraPermissions, string> = {
  student: "Student",
  lecturer: "Lecturer",
  hod: "HOD",
  dean: "Dean",
  registrar: "Registrar",
  superadmin: "SuperAdmin",
};

export default function CameraSecurityTab() {
  const { currentUser } = useApp();
  const [perms, setPerms] = useState<CameraPermissions>(loadPerms);
  const [log, setLog] = useState<AccessLogEntry[]>(loadLog);

  const camera = useCamera({ facingMode: "user", width: 640, height: 480 });

  function savePerms(next: CameraPermissions) {
    setPerms(next);
    localStorage.setItem(PERM_KEY, JSON.stringify(next));
    toast.success("Camera permissions updated.");
  }

  async function handleStartCamera() {
    await camera.startCamera();
    logCameraAccess(currentUser?.role ?? "SuperAdmin", "start");
    setLog(loadLog());
  }

  async function handleStopCamera() {
    await camera.stopCamera();
    logCameraAccess(currentUser?.role ?? "SuperAdmin", "stop");
    setLog(loadLog());
  }

  function clearLog() {
    localStorage.removeItem(LOG_KEY);
    setLog([]);
    toast.success("Access log cleared.");
  }

  function printLog() {
    window.print();
  }

  return (
    <div className="space-y-6 max-w-3xl" data-ocid="cam_security.page">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Camera & Security
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage webcam permissions, monitor access, and view camera activity
          logs.
        </p>
      </div>

      {/* Camera Access Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Camera Access Permissions
          </CardTitle>
          <CardDescription>
            Control which roles can access the webcam for biometric capture and
            ID photos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(ROLE_LABELS) as (keyof CameraPermissions)[]).map(
            (roleKey) => (
              <div
                key={roleKey}
                className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{ROLE_LABELS[roleKey]}</p>
                  <p className="text-xs text-muted-foreground">
                    Allow {ROLE_LABELS[roleKey]} role to use webcam
                  </p>
                </div>
                <Switch
                  data-ocid={`cam_security.${roleKey}_camera.switch`}
                  checked={perms[roleKey]}
                  onCheckedChange={(v) => savePerms({ ...perms, [roleKey]: v })}
                />
              </div>
            ),
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="w-4 h-4" />
            Live Camera Preview
          </CardTitle>
          <CardDescription>
            Test the webcam feed directly from this panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleStartCamera}
              disabled={camera.isActive || camera.isLoading}
              data-ocid="cam_security.start_camera.button"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              {camera.isLoading ? "Starting..." : "Start Camera"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopCamera}
              disabled={!camera.isActive || camera.isLoading}
              data-ocid="cam_security.stop_camera.button"
            >
              <CameraOff className="w-3.5 h-3.5 mr-1.5" />
              Stop Camera
            </Button>
          </div>

          {camera.error && (
            <p
              className="text-xs text-destructive"
              data-ocid="cam_security.camera_error_state"
            >
              {camera.error.message}
            </p>
          )}

          <div
            className={`relative rounded-lg overflow-hidden bg-muted/30 border border-border ${camera.isActive ? "" : "opacity-40"}`}
            style={{ maxWidth: 400, aspectRatio: "4/3" }}
          >
            <video
              ref={camera.videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={camera.canvasRef} className="hidden" />
            {!camera.isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CameraOff className="w-10 h-10 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Camera Access Log</CardTitle>
              <CardDescription>
                Records of when webcam was activated or stopped.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={printLog}
                data-ocid="cam_security.print_log.button"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={clearLog}
                data-ocid="cam_security.clear_log.delete_button"
              >
                Clear Log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="cam_security.log_empty_state"
            >
              No camera access events recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.slice(0, 50).map((entry, i) => (
                  <TableRow
                    key={`${entry.timestamp}_${i}`}
                    data-ocid={`cam_security.log.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{entry.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.action === "start" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {entry.action === "start" ? "Started" : "Stopped"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
