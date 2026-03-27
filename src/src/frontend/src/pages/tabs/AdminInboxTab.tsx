import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import {
  getStudentInbox,
  saveStudentInbox,
  sendInboxMessage,
} from "./StudentInboxTab";

export default function AdminInboxTab() {
  const { currentUser, students, departments } = useApp();
  const [view, setView] = useState<"compose" | "sent">("sent");
  const [targetType, setTargetType] = useState<"student" | "department">(
    "student",
  );
  const [targetStudent, setTargetStudent] = useState("");
  const [targetDept, setTargetDept] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const allSent = getStudentInbox().sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );

  function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    const senderName = currentUser?.name ?? "Admin";
    const now = new Date().toISOString();

    if (targetType === "student") {
      if (!targetStudent) {
        toast.error("Select a student");
        return;
      }
      const student = students.find((s) => String(s.id) === targetStudent);
      if (!student) {
        toast.error("Student not found");
        return;
      }
      sendInboxMessage({
        studentId: String(student.id),
        studentName: student.name,
        subject: subject.trim(),
        body: body.trim(),
        sentBy: senderName,
        sentAt: now,
        type: "general",
      });
      toast.success(`Message sent to ${student.name}`);
    } else {
      if (!targetDept) {
        toast.error("Select a department");
        return;
      }
      const deptStudents = students.filter(
        (s) => String(s.departmentId) === targetDept,
      );
      const inbox = getStudentInbox();
      for (const student of deptStudents) {
        inbox.unshift({
          id: `msg-${Date.now()}-${student.id}`,
          studentId: String(student.id),
          studentName: student.name,
          subject: subject.trim(),
          body: body.trim(),
          sentBy: senderName,
          sentAt: now,
          read: false,
          type: "announcement",
        });
      }
      saveStudentInbox(inbox);
      toast.success(`Broadcast sent to ${deptStudents.length} students`);
    }

    setSubject("");
    setBody("");
    setTargetStudent("");
    setView("sent");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Student Inbox Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Send messages and notifications to students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "sent" ? "default" : "outline"}
            onClick={() => setView("sent")}
            className={
              view === "sent" ? "bg-primary text-primary-foreground" : ""
            }
          >
            Sent Messages
          </Button>
          <Button
            size="sm"
            data-ocid="admin_inbox.open_modal_button"
            variant={view === "compose" ? "default" : "outline"}
            onClick={() => setView("compose")}
            className={
              view === "compose" ? "bg-primary text-primary-foreground" : ""
            }
          >
            <Send className="w-3 h-3 mr-1" /> Compose
          </Button>
        </div>
      </div>

      {view === "compose" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold">New Message</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Send To</Label>
              <Select
                value={targetType}
                onValueChange={(v) =>
                  setTargetType(v as "student" | "department")
                }
              >
                <SelectTrigger data-ocid="admin_inbox.select" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Individual Student</SelectItem>
                  <SelectItem value="department">
                    Broadcast to Department
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType === "student" ? (
              <div>
                <Label className="text-xs">Select Student</Label>
                <Select value={targetStudent} onValueChange={setTargetStudent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name} ({s.matricNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs">Select Department</Label>
                <Select value={targetDept} onValueChange={setTargetDept}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose department..." />
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
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              data-ocid="admin_inbox.input"
              className="mt-1"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea
              data-ocid="admin_inbox.textarea"
              className="mt-1"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              data-ocid="admin_inbox.submit_button"
              onClick={handleSend}
              className="bg-primary text-primary-foreground"
            >
              {targetType === "department" ? (
                <>
                  <Users className="w-3 h-3 mr-1" /> Broadcast
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" /> Send Message
                </>
              )}
            </Button>
            <Button
              variant="outline"
              data-ocid="admin_inbox.cancel_button"
              onClick={() => setView("sent")}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {view === "sent" && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSent.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="admin_inbox.empty_state"
                  >
                    No messages sent yet
                  </TableCell>
                </TableRow>
              )}
              {allSent.slice(0, 50).map((msg, i) => (
                <TableRow key={msg.id} data-ocid={`admin_inbox.item.${i + 1}`}>
                  <TableCell className="text-sm font-medium">
                    {msg.studentName}
                  </TableCell>
                  <TableCell className="text-sm">{msg.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {msg.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(msg.sentAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {msg.read ? (
                      <Badge className="bg-success/15 text-success border-success/30 text-xs">
                        Read
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">
                        Unread
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
