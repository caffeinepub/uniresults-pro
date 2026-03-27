import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../blob-storage/ExternalBlob";
import { useCamera } from "../../camera/useCamera";

interface PhotoAvatarProps {
  photoKey: string;
  name: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

const SIZE_MAP = {
  sm: {
    container: "w-8 h-8",
    text: "text-xs",
    icon: "w-3 h-3",
    badge: "w-4 h-4",
  },
  md: {
    container: "w-16 h-16",
    text: "text-lg",
    icon: "w-5 h-5",
    badge: "w-5 h-5",
  },
  lg: {
    container: "w-24 h-24",
    text: "text-2xl",
    icon: "w-8 h-8",
    badge: "w-6 h-6",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export default function PhotoAvatar({
  photoKey,
  name,
  size = "md",
  editable = false,
}: PhotoAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    localStorage.getItem(photoKey),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s = SIZE_MAP[size];

  // Re-read from localStorage if photoKey changes
  useEffect(() => {
    setPhotoUrl(localStorage.getItem(photoKey));
  }, [photoKey]);

  const {
    videoRef,
    canvasRef,
    isActive,
    startCamera,
    stopCamera,
    capturePhoto,
    error: cameraError,
  } = useCamera({ facingMode: "user", width: 400, height: 300 });

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct: number) => {
          setProgress(Math.round(pct * 100));
        },
      );
      const url = blob.getDirectURL();
      localStorage.setItem(photoKey, url);
      setPhotoUrl(url);
      setDialogOpen(false);
      toast.success("Photo saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleCapture() {
    const file = await capturePhoto();
    if (file) await uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      stopCamera();
      setDialogOpen(false);
    }
  }

  return (
    <>
      <div className={`relative shrink-0 ${s.container}`}>
        {/* Avatar circle */}
        <div
          className={`${s.container} rounded-full overflow-hidden flex items-center justify-center font-bold text-white select-none ${
            photoUrl ? "" : getColorFromName(name)
          }`}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={s.text}>
              {getInitials(name) || <User className={s.icon} />}
            </span>
          )}
        </div>

        {/* Edit button overlay */}
        {editable && (
          <button
            type="button"
            data-ocid="photo_avatar.open_modal_button"
            onClick={() => setDialogOpen(true)}
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            style={{ width: 22, height: 22 }}
            title="Change photo"
          >
            <Camera style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>

      {/* Upload/Capture Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent data-ocid="photo_avatar.dialog" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Photo</DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="upload"
            onValueChange={(v) => {
              if (v === "camera") startCamera();
              else stopCamera();
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1">
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex-1">
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Camera
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 mt-3">
              <Button
                variant="outline"
                type="button"
                className="w-full h-auto border-2 border-dashed p-6 flex flex-col items-center gap-3 hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Click to choose a photo
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG up to 5MB
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-ocid="photo_avatar.upload_button"
                onChange={handleFileChange}
              />
              {uploading && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Uploading... {progress}%
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="camera" className="space-y-3 mt-3">
              {cameraError && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                  {cameraError?.message}
                </p>
              )}
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button
                className="w-full"
                data-ocid="photo_avatar.submit_button"
                onClick={handleCapture}
                disabled={!isActive || uploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? `Uploading... ${progress}%` : "Capture & Save"}
              </Button>
              {uploading && <Progress value={progress} className="h-2" />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
