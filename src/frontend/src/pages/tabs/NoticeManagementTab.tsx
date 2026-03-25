import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle, Bell, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Notice } from "./NoticeBoardPanel";
import { getNotices } from "./NoticeBoardPanel";

export default function NoticeManagementTab() {
  const { currentUser } = useApp();
  const [notices, setNotices] = useState<Notice[]>(getNotices);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "General" as Notice["type"],
    audience: "All" as Notice["audience"],
    expiresAt: "",
  });

  function saveNotices(list: Notice[]) {
    localStorage.setItem("notices", JSON.stringify(list));
    setNotices(list);
  }

  function handleAdd() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    const notice: Notice = {
      id: String(Date.now()),
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      audience: form.audience,
      createdBy: currentUser?.name ?? "Admin",
      createdAt: new Date().toISOString(),
      expiresAt: form.expiresAt || undefined,
    };
    saveNotices([notice, ...notices]);
    setOpen(false);
    setForm({
      title: "",
      body: "",
      type: "General",
      audience: "All",
      expiresAt: "",
    });
    toast.success("Notice posted");
  }

  function handleDelete(id: string) {
    saveNotices(notices.filter((n) => n.id !== id));
    toast.success("Notice deleted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notice Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Post announcements visible to selected user groups
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          data-ocid="notices.add_button"
          onClick={() => setOpen(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Post Notice
        </Button>
      </div>

      <div className="space-y-3">
        {notices.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="notices.empty_state"
          >
            No notices posted yet
          </div>
        ) : (
          notices.map((n, i) => (
            <div
              key={n.id}
              data-ocid={`notices.item.${i + 1}`}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">
                    {n.type === "Urgent" && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    {n.type === "Pinned" && (
                      <Pin className="w-4 h-4 text-primary" />
                    )}
                    {n.type === "General" && (
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{n.title}</span>
                      {n.type === "Urgent" && (
                        <Badge variant="destructive" className="text-xs">
                          URGENT
                        </Badge>
                      )}
                      {n.type === "Pinned" && (
                        <Badge variant="secondary" className="text-xs">
                          PINNED
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {n.audience}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {n.body}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Posted by {n.createdBy} ·{" "}
                      {new Date(n.createdAt).toLocaleDateString("en-NG")}
                      {n.expiresAt &&
                        ` · Expires ${new Date(n.expiresAt).toLocaleDateString("en-NG")}`}
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid={`notices.delete_button.${i + 1}`}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(n.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent data-ocid="notices.dialog">
          <DialogHeader>
            <DialogTitle>Post Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                data-ocid="notices.title.input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Notice title..."
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                data-ocid="notices.body.textarea"
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                placeholder="Write notice content..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as Notice["type"] }))
                  }
                >
                  <SelectTrigger data-ocid="notices.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Pinned">Pinned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      audience: v as Notice["audience"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="notices.audience.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Students">Students</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Lecturers">Lecturers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input
                data-ocid="notices.expiry.input"
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="notices.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="notices.submit_button" onClick={handleAdd}>
              Post Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
