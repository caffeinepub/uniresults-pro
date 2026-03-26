import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, CheckCheck, Mail, MailOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";

export interface StudentInboxMessage {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  body: string;
  sentBy: string;
  sentAt: string;
  read: boolean;
  type: "result" | "general" | "announcement";
}

export function getStudentInbox(): StudentInboxMessage[] {
  try {
    return JSON.parse(localStorage.getItem("studentInbox") || "[]");
  } catch {
    return [];
  }
}

export function saveStudentInbox(msgs: StudentInboxMessage[]) {
  localStorage.setItem("studentInbox", JSON.stringify(msgs));
}

export function sendInboxMessage(
  msg: Omit<StudentInboxMessage, "id" | "read">,
) {
  const inbox = getStudentInbox();
  inbox.unshift({
    ...msg,
    id: `msg-${Date.now()}-${Math.random()}`,
    read: false,
  });
  saveStudentInbox(inbox);
}

export function getUnreadCount(studentId: string): number {
  return getStudentInbox().filter((m) => m.studentId === studentId && !m.read)
    .length;
}

export default function StudentInboxTab() {
  const { currentUser, students } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const [messages, setMessages] = useState<StudentInboxMessage[]>([]);
  const [selected, setSelected] = useState<StudentInboxMessage | null>(null);

  useEffect(() => {
    const all = getStudentInbox();
    const mine = me ? all.filter((m) => m.studentId === String(me.id)) : [];
    setMessages(mine);
    // Mark all as read
    if (me) {
      const updated = all.map((m) =>
        m.studentId === String(me.id) ? { ...m, read: true } : m,
      );
      saveStudentInbox(updated);
    }
  }, [me]);

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            My Inbox
            {unread > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unread}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {messages.length} messages
          </p>
        </div>
      </div>

      {selected ? (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">{selected.subject}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                From: {selected.sentBy} &middot;{" "}
                {new Date(selected.sentAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(null)}
            >
              Back to Inbox
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {selected.body}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="inbox.empty_state"
                  >
                    <MailOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Your inbox is empty
                  </TableCell>
                </TableRow>
              )}
              {messages.map((msg, i) => (
                <TableRow
                  key={msg.id}
                  data-ocid={`inbox.item.${i + 1}`}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelected(msg)}
                >
                  <TableCell>
                    {msg.read ? (
                      <MailOpen className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary" />
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-sm ${!msg.read ? "font-semibold" : ""}`}
                  >
                    {msg.subject}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {msg.sentBy}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(msg.sentAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {msg.type}
                    </Badge>
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

export function InboxUnreadBadge({ studentId }: { studentId: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(getUnreadCount(studentId));
    const interval = setInterval(
      () => setCount(getUnreadCount(studentId)),
      3000,
    );
    return () => clearInterval(interval);
  }, [studentId]);
  if (count === 0) return null;
  return (
    <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
      {count > 9 ? "9+" : count}
    </span>
  );
}
