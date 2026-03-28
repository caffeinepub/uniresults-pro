import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CheckCheck, Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { sendInboxMessage } from "./StudentInboxTab";

export default function BroadcastInboxTab() {
  const { currentUser, students, departments, logAudit } = useApp();
  const [target, setTarget] = useState<"all" | "department" | "level">("all");
  const [deptId, setDeptId] = useState("");
  const [level, setLevel] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const levels = ["100", "200", "300", "400", "500", "600"];

  function getTargetStudents() {
    let targets = [...students];
    if (target === "department" && deptId) {
      targets = targets.filter((s) => String(s.departmentId) === deptId);
    } else if (target === "level" && level) {
      targets = targets.filter((s) => {
        const lvl = s.level ?? (s as any).admissionYear;
        return String(lvl) === level;
      });
    }
    return targets;
  }

  function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message body are required");
      return;
    }
    const targets = getTargetStudents();
    if (targets.length === 0) {
      toast.error("No students matched the selected target");
      return;
    }
    for (const student of targets) {
      sendInboxMessage({
        studentId: String(student.id),
        studentName: student.name ?? "",
        subject: title.trim(),
        body: body.trim(),
        sentBy: currentUser?.name ?? "Admin",
        sentAt: new Date().toISOString(),
        type: "announcement",
      });
    }
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "",
      "Broadcast Sent",
      `"${title}" sent to ${targets.length} students`,
    );
    toast.success(`Broadcast sent to ${targets.length} students`);
    setSent(true);
    setTitle("");
    setBody("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Broadcast Message</h2>
        <Badge variant="outline">Send to Students Inbox</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compose Broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Target Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as any)}>
              <SelectTrigger data-ocid="broadcast.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="department">By Department</SelectItem>
                <SelectItem value="level">By Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "department" && (
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger data-ocid="broadcast.dept.select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {target === "level" && (
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger data-ocid="broadcast.level.select">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Subject / Title</Label>
            <Input
              data-ocid="broadcast.title.input"
              placeholder="Message subject"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Message Body</Label>
            <Textarea
              data-ocid="broadcast.body.textarea"
              placeholder="Write your message here..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {getTargetStudents().length} student(s) will receive this message
            </span>
            <Button
              data-ocid="broadcast.send.button"
              onClick={handleSend}
              disabled={sent}
            >
              {sent ? (
                <>
                  <CheckCheck className="w-4 h-4 mr-2" /> Sent!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Broadcast
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
