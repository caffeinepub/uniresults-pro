import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface CalendarEvent {
  id: string;
  title: string;
  type:
    | "Holiday"
    | "Resumption"
    | "Exam Period"
    | "Semester Start"
    | "Semester End"
    | "Other";
  startDate: string;
  endDate: string;
  description: string;
  createdAt: string;
}

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  Holiday: "bg-red-100 text-red-800 border-red-200",
  Resumption: "bg-green-100 text-green-800 border-green-200",
  "Exam Period": "bg-orange-100 text-orange-800 border-orange-200",
  "Semester Start": "bg-blue-100 text-blue-800 border-blue-200",
  "Semester End": "bg-purple-100 text-purple-800 border-purple-200",
  Other: "bg-gray-100 text-gray-800 border-gray-200",
};

const DEMO_EVENTS: CalendarEvent[] = [
  {
    id: "ce-1",
    title: "First Semester Begins",
    type: "Semester Start",
    startDate: "2024-10-07",
    endDate: "2024-10-07",
    description:
      "Commencement of 2024/2025 First Semester academic activities.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ce-2",
    title: "Mid-Semester Break",
    type: "Holiday",
    startDate: "2024-12-16",
    endDate: "2025-01-05",
    description: "Christmas and New Year break.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ce-3",
    title: "First Semester Exams",
    type: "Exam Period",
    startDate: "2025-02-10",
    endDate: "2025-02-28",
    description: "First semester examinations for all departments.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ce-4",
    title: "Second Semester Resumption",
    type: "Resumption",
    startDate: "2025-03-10",
    endDate: "2025-03-10",
    description: "Students resume for second semester.",
    createdAt: new Date().toISOString(),
  },
];

export function getCalendarEvents(): CalendarEvent[] {
  try {
    const saved = JSON.parse(localStorage.getItem("calendarEvents") || "[]");
    if (saved.length === 0) {
      localStorage.setItem("calendarEvents", JSON.stringify(DEMO_EVENTS));
      return DEMO_EVENTS;
    }
    return saved;
  } catch {
    return DEMO_EVENTS;
  }
}

function saveEvents(list: CalendarEvent[]) {
  localStorage.setItem("calendarEvents", JSON.stringify(list));
}

function getUpcomingEvents(n = 3): CalendarEvent[] {
  const now = new Date();
  return getCalendarEvents()
    .filter((e) => new Date(e.endDate) >= now)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, n);
}

// Upcoming events widget for all dashboards
export function UpcomingEventsWidget() {
  const upcoming = useMemo(getUpcomingEvents, []);
  if (upcoming.length === 0) return null;
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-primary" /> Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.map((e) => (
          <div
            key={e.id}
            className={`rounded border px-3 py-2 text-xs ${EVENT_COLORS[e.type]}`}
          >
            <div className="font-semibold">{e.title}</div>
            <div>
              {new Date(e.startDate).toLocaleDateString()}{" "}
              {e.startDate !== e.endDate
                ? `— ${new Date(e.endDate).toLocaleDateString()}`
                : ""}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Admin/Registrar management tab
export default function AcademicCalendarEventsTab() {
  const { currentUser, logAudit } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>(getCalendarEvents);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Other" as CalendarEvent["type"],
    startDate: "",
    endDate: "",
    description: "",
  });
  const [selMonth, setSelMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  function handleAdd() {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error("Title, start date, and end date are required");
      return;
    }
    const ev: CalendarEvent = {
      ...form,
      id: `ce-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [ev, ...events];
    saveEvents(updated);
    setEvents(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Registrar",
      "Calendar Event Added",
      form.title,
    );
    toast.success("Event added");
    setOpen(false);
    setForm({
      title: "",
      type: "Other",
      startDate: "",
      endDate: "",
      description: "",
    });
  }

  function handleDelete(id: string) {
    const updated = events.filter((e) => e.id !== id);
    saveEvents(updated);
    setEvents(updated);
    toast.success("Event removed");
  }

  const filtered = events
    .filter((e) => {
      if (!selMonth) return true;
      return e.startDate.startsWith(selMonth) || e.endDate.startsWith(selMonth);
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Academic Calendar Events</h2>
        <div className="ml-auto flex gap-2 items-center">
          <Input
            type="month"
            value={selMonth}
            onChange={(e) => setSelMonth(e.target.value)}
            className="w-36"
          />
          <Button
            data-ocid="cal_events.add.button"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div
            data-ocid="cal_events.empty_state"
            className="text-center py-8 text-muted-foreground"
          >
            No events for this month.
          </div>
        ) : (
          filtered.map((e, i) => (
            <Card
              key={e.id}
              data-ocid={`cal_events.item.${i + 1}`}
              className={`border ${EVENT_COLORS[e.type]}`}
            >
              <CardContent className="flex items-start justify-between pt-4">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs mt-1">
                    {new Date(e.startDate).toLocaleDateString()}
                    {e.startDate !== e.endDate &&
                      ` — ${new Date(e.endDate).toLocaleDateString()}`}
                  </div>
                  {e.description && (
                    <div className="text-xs mt-1 opacity-80">
                      {e.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {e.type}
                  </Badge>
                  <Button
                    data-ocid={"cal_events.delete.button"}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(e.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                data-ocid="cal_events.title.input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as any }))
                }
              >
                <SelectTrigger data-ocid="cal_events.type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Holiday",
                    "Resumption",
                    "Exam Period",
                    "Semester Start",
                    "Semester End",
                    "Other",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input
                  data-ocid="cal_events.start.input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End Date *</Label>
                <Input
                  data-ocid="cal_events.end.input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-ocid="cal_events.cancel.button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button data-ocid="cal_events.save.button" onClick={handleAdd}>
                Add Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
