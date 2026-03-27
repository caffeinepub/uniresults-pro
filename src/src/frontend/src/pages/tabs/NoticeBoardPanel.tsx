import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { useMemo, useState } from "react";

export interface Notice {
  id: string;
  title: string;
  body: string;
  type: "General" | "Urgent" | "Pinned";
  audience: "All" | "Students" | "Staff" | "Lecturers";
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export function getNotices(): Notice[] {
  try {
    return JSON.parse(localStorage.getItem("notices") || "[]");
  } catch {
    return [];
  }
}

interface Props {
  userRole?: string;
}

const AUDIENCE_MAP: Record<string, string[]> = {
  SuperAdmin: ["All", "Staff"],
  Registrar: ["All", "Staff"],
  HOD: ["All", "Staff"],
  Dean: ["All", "Staff"],
  Lecturer: ["All", "Lecturers"],
  Student: ["All", "Students"],
};

export default function NoticeBoardPanel({ userRole = "All" }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const notices = useMemo(() => {
    const now = new Date();
    const allowed = AUDIENCE_MAP[userRole] ?? ["All"];
    return getNotices()
      .filter((n) => {
        if (n.expiresAt && new Date(n.expiresAt) < now) return false;
        return allowed.includes(n.audience);
      })
      .sort((a, b) => {
        // Pinned first, then Urgent, then by date
        const order = { Pinned: 0, Urgent: 1, General: 2 };
        if (order[a.type] !== order[b.type])
          return order[a.type] - order[b.type];
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 10);
  }, [userRole]);

  if (notices.length === 0) return null;

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden mb-4 no-print"
      data-ocid="notice_board.panel"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
        data-ocid="notice_board.toggle"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Notice Board
          </span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {notices.length}
          </Badge>
        </div>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="divide-y divide-border/50">
          {notices.map((n, i) => (
            <div
              key={n.id}
              className="px-4 py-2.5"
              data-ocid={`notice_board.item.${i + 1}`}
            >
              <div className="flex items-start gap-2">
                {n.type === "Pinned" && (
                  <Pin className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                )}
                {n.type === "Urgent" && (
                  <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {n.title}
                    </span>
                    {n.type === "Urgent" && (
                      <Badge
                        variant="destructive"
                        className="text-xs px-1.5 py-0"
                      >
                        URGENT
                      </Badge>
                    )}
                    {n.type === "Pinned" && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0"
                      >
                        PINNED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {n.createdBy} ·{" "}
                    {new Date(n.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
