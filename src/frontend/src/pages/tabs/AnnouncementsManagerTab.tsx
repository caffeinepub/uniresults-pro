import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, BellRing, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target: "All" | "Students Only" | "Staff Only" | string;
  priority: "Normal" | "Urgent";
  createdBy: string;
  createdAt: string;
}

const STORAGE_KEY = "unipro_announcements";

const DEMO: Announcement[] = [
  {
    id: "ann-1",
    title: "First Semester Examination Timetable Released",
    body: "The first semester examination timetable for 2024/2025 academic session has been released. Students are advised to check the notice board and exam timetable section of their portal for details.",
    target: "Students Only",
    priority: "Urgent",
    createdBy: "Registrar",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ann-2",
    title: "Score Sheet Submission Deadline",
    body: "All lecturers are reminded that the deadline for submitting score sheets to HODs is March 20, 2025. Late submissions will not be accepted without prior approval from the Dean.",
    target: "Staff Only",
    priority: "Urgent",
    createdBy: "HOD",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "ann-3",
    title: "Academic Calendar Update",
    body: "Please note that the resumption date for the second semester has been adjusted. New resumption date is April 7, 2025. All students and staff are expected to resume on this date.",
    target: "All",
    priority: "Normal",
    createdBy: "Admin",
    createdAt: new Date().toISOString(),
  },
];

export function getAnnouncements(): Announcement[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    ) as Announcement[];
    if (!saved.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO));
      return DEMO;
    }
    return saved;
  } catch {
    return DEMO;
  }
}

function saveAnnouncements(list: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const READ_KEY = "unipro_announcements_read";
export function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
}
export function markRead(ids: string[]) {
  localStorage.setItem(
    READ_KEY,
    JSON.stringify([...new Set([...getReadIds(), ...ids])]),
  );
}

// ---- Manager Tab (for Admin/HOD to post) ----
export default function AnnouncementsManagerTab() {
  const { currentUser, departments } = useApp();
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(getAnnouncements);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    target: "All",
    priority: "Normal" as "Normal" | "Urgent",
  });

  function handleSave() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      title: form.title.trim(),
      body: form.body.trim(),
      target: form.target,
      priority: form.priority,
      createdBy: currentUser?.name ?? currentUser?.role ?? "Admin",
      createdAt: new Date().toISOString(),
    };
    const updated = [ann, ...announcements];
    setAnnouncements(updated);
    saveAnnouncements(updated);
    toast.success("Announcement posted.");
    setOpen(false);
    setForm({ title: "", body: "", target: "All", priority: "Normal" });
  }

  function handleDelete(id: string) {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    saveAnnouncements(updated);
    setDeleteId(null);
    toast.success("Announcement deleted.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            Announcements Manager
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            data-ocid="announcements.open_modal_button"
          >
            <Plus className="w-3 h-3 mr-1" /> New Announcement
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements.length === 0 ? (
            <p
              className="text-center text-muted-foreground py-8"
              data-ocid="announcements.empty_state"
            >
              No announcements yet.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann, i) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-lg border ${ann.priority === "Urgent" ? "border-red-200 bg-red-50" : "border-border bg-card"}`}
                  data-ocid={`announcements.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ann.title}</span>
                        <Badge
                          className={`text-xs shrink-0 ${
                            ann.priority === "Urgent"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                          variant="outline"
                        >
                          {ann.priority === "Urgent" ? (
                            <BellRing className="w-3 h-3 mr-1" />
                          ) : (
                            <Bell className="w-3 h-3 mr-1" />
                          )}
                          {ann.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ann.target}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {ann.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Posted by {ann.createdBy} ·{" "}
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => setDeleteId(ann.id)}
                      data-ocid={`announcements.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Announcement Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-ocid="announcements.dialog">
          <DialogHeader>
            <DialogTitle>Post New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Announcement title"
                data-ocid="announcements.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your announcement here…"
                rows={4}
                data-ocid="announcements.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Target Audience</Label>
                <Select
                  value={form.target}
                  onValueChange={(v) => setForm({ ...form, target: v })}
                >
                  <SelectTrigger data-ocid="announcements.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Students Only">Students Only</SelectItem>
                    <SelectItem value="Staff Only">Staff Only</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as "Normal" | "Urgent" })
                  }
                >
                  <SelectTrigger data-ocid="announcements.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="announcements.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              data-ocid="announcements.submit_button"
            >
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent data-ocid="announcements.dialog">
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the announcement.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="announcements.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="announcements.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Read-only notices panel for Student/Lecturer dashboards ----
export function AnnouncementsNoticesPanel({ userRole }: { userRole: string }) {
  const [announcements] = useState<Announcement[]>(getAnnouncements);
  const [readIds] = useState<string[]>(getReadIds);

  const visible = announcements
    .filter((a) => {
      if (a.target === "All") return true;
      if (a.target === "Students Only" && userRole === "Student") return true;
      if (a.target === "Staff Only" && userRole !== "Student") return true;
      return false;
    })
    .slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
        <Bell className="w-3.5 h-3.5" /> Notices
      </h3>
      {visible.map((ann) => {
        const isNew = !readIds.includes(ann.id);
        return (
          <div
            key={ann.id}
            className={`flex gap-2 p-3 rounded-lg border text-sm ${
              ann.priority === "Urgent"
                ? "border-red-200 bg-red-50"
                : "border-border bg-muted/30"
            }`}
            data-ocid="announcements.card"
          >
            {isNew && (
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{ann.title}</span>
                {ann.priority === "Urgent" && (
                  <Badge
                    className="text-xs bg-red-100 text-red-700 border-red-200"
                    variant="outline"
                  >
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {ann.body}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {new Date(ann.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
