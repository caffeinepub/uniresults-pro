import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Moon,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { getActiveCalendar, useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SuperAdmin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "faculties", label: "Faculties", icon: Building2 },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "students", label: "Students", icon: Users },
    { id: "staff", label: "Staff", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "course_mgmt", label: "Course Management", icon: BookOpen },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "summaries", label: "Result Summaries", icon: FileText },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "graduation", label: "Graduation", icon: GraduationCap },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "calendar", label: "Academic Calendar", icon: CalendarDays },
    { id: "audit", label: "Audit Log", icon: ScrollText },
    { id: "roles", label: "User Roles", icon: Settings },
    { id: "benchmarking", label: "Benchmarking", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "grade_scale", label: "Grade Scale", icon: Settings },
    { id: "advisors", label: "Advisors", icon: Users },
    { id: "notices_mgmt", label: "Notice Board", icon: Megaphone },
    { id: "transfers", label: "Transfers", icon: ChevronRight },
    { id: "biometric", label: "Biometric", icon: Camera },
    { id: "cam_security", label: "Cam Security", icon: Shield },
    { id: "report_monitor", label: "Report Monitor", icon: ClipboardList },
    {
      id: "pending_registrations",
      label: "Pending Registrations",
      icon: Users,
    },
  ],
  Registrar: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "faculties", label: "Faculties", icon: Building2 },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "students", label: "Students", icon: Users },
    { id: "staff", label: "Staff", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "course_mgmt", label: "Course Management", icon: BookOpen },
    { id: "fee_management", label: "Fee Management", icon: DollarSign },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "summaries", label: "Result Summaries", icon: FileText },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "graduation", label: "Graduation", icon: GraduationCap },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "calendar", label: "Academic Calendar", icon: CalendarDays },
    { id: "deferrals", label: "Deferrals", icon: Users },
    { id: "benchmarking", label: "Benchmarking", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "grade_scale", label: "Grade Scale", icon: Settings },
    { id: "advisors", label: "Advisors", icon: Users },
    { id: "notices_mgmt", label: "Notice Board", icon: Megaphone },
    { id: "transfers", label: "Transfers", icon: ChevronRight },
    { id: "biometric", label: "Biometric", icon: Camera },
    { id: "cam_security", label: "Cam Security", icon: Shield },
    { id: "report_monitor", label: "Report Monitor", icon: ClipboardList },
    {
      id: "pending_registrations",
      label: "Pending Registrations",
      icon: Users,
    },
  ],
  HOD: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "approvals", label: "Approvals", icon: FileCheck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "dept_report", label: "Dept. Report", icon: FileText },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "results", label: "All Results", icon: ClipboardList },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
    { id: "graduation", label: "Graduation", icon: GraduationCap },
    { id: "course_assignments", label: "Course Assignments", icon: BookOpen },
    { id: "hod_transfers", label: "Transfers", icon: ChevronRight },
    { id: "biometric", label: "Biometric", icon: Camera },
  ],
  Lecturer: [
    { id: "overview", label: "My Courses", icon: BookOpen },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "bulk_upload", label: "Bulk Upload", icon: ClipboardList },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "attendance", label: "Attendance", icon: ClipboardList },
    { id: "biometric", label: "Biometric", icon: Camera },
  ],
  Student: [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "course_reg", label: "Course Registration", icon: BookOpen },
    { id: "results", label: "My Results", icon: ClipboardList },
    { id: "semester_summary", label: "Semester Summary", icon: FileText },
    { id: "gpa", label: "GPA / CGPA", icon: BarChart3 },
    { id: "transcript", label: "Transcript", icon: FileText },
    { id: "fee_status", label: "Fee Status", icon: DollarSign },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
    { id: "graduation", label: "Graduation", icon: GraduationCap },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "deferral", label: "Deferral", icon: CalendarDays },
    { id: "progress", label: "My Progress", icon: BarChart3 },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "transfer", label: "Transfer", icon: ChevronRight },
    { id: "exam_schedule", label: "Exam Schedule", icon: CalendarDays },
    { id: "course_eval", label: "Course Eval", icon: FileCheck },
  ],
  Dean: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "approvals", label: "Approvals", icon: FileCheck },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "results", label: "All Results", icon: ClipboardList },
    { id: "graduation", label: "Graduation", icon: GraduationCap },
    { id: "faculty_report", label: "Faculty Report", icon: FileText },
    { id: "biometric", label: "Biometric", icon: Camera },
  ],
};

export const ActiveTabContext = { current: "overview" };

export const TabContext = React.createContext<{
  activeTab: string;
  setActiveTab: (t: string) => void;
}>({
  activeTab: "overview",
  setActiveTab: () => {},
});

interface SearchResult {
  category: "Students" | "Courses" | "Staff" | "Results";
  label: string;
  sublabel: string;
  tab?: string;
}

function GlobalSearch({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { students, courses, staffMembers, results } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const results_: SearchResult[] = React.useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    for (const s of students) {
      if (out.filter((r) => r.category === "Students").length >= 5) break;
      if (
        s.name.toLowerCase().includes(q) ||
        s.matricNumber.toLowerCase().includes(q)
      ) {
        out.push({
          category: "Students",
          label: s.name,
          sublabel: s.matricNumber,
          tab: "students",
        });
      }
    }
    for (const c of courses) {
      if (out.filter((r) => r.category === "Courses").length >= 5) break;
      if (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      ) {
        out.push({
          category: "Courses",
          label: c.name,
          sublabel: c.code,
          tab: "courses",
        });
      }
    }
    for (const m of staffMembers) {
      if (out.filter((r) => r.category === "Staff").length >= 5) break;
      if (
        m.name.toLowerCase().includes(q) ||
        m.staffId.toLowerCase().includes(q)
      ) {
        out.push({
          category: "Staff",
          label: m.name,
          sublabel: m.staffId,
          tab: "staff",
        });
      }
    }
    for (const r of results) {
      if (out.filter((x) => x.category === "Results").length >= 5) break;
      const course = courses.find((c) => c.id === r.courseId);
      const student = students.find((s) => s.id === r.studentId);
      if (!course || !student) continue;
      const label = `${student.name} — ${course.code}`;
      if (
        student.name.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q)
      ) {
        out.push({
          category: "Results",
          label,
          sublabel: `${r.grade} · ${r.totalScore}/100 · ${r.status}`,
          tab: "results",
        });
      }
    }
    return out;
  }, [query, students, courses, staffMembers, results]);

  const categories = ["Students", "Courses", "Staff", "Results"] as const;

  return (
    <div className="relative no-print" ref={ref}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          data-ocid="search.input"
          type="text"
          placeholder="Search students, courses, staff..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length >= 2);
          }}
          onFocus={() => {
            if (query.length >= 2) setOpen(true);
          }}
          className="pl-7 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-ring w-56 sm:w-64"
        />
      </div>

      {open && results_.length > 0 && (
        <div
          data-ocid="search.popover"
          className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {categories.map((cat) => {
            const items = results_.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40 border-b border-border">
                  {cat}
                </div>
                {items.map((item, i) => (
                  <button
                    key={`${cat}-${item.label}`}
                    type="button"
                    data-ocid={`search.${cat.toLowerCase()}.item.${i + 1}`}
                    className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      if (item.tab) onNavigate(item.tab);
                    }}
                  >
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sublabel}
                    </p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results_.length === 0 && (
        <div
          className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-lg z-50 p-4 text-center text-xs text-muted-foreground"
          data-ocid="search.empty_state"
        >
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}

function NotificationPanel({
  role,
  onClose,
  onTabLink,
}: {
  role: string;
  onClose: () => void;
  onTabLink: (tab: string) => void;
}) {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useApp();
  const roleNotifs = notifications
    .filter((n) => n.recipientRole === role)
    .slice(0, 50);
  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-NG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div
      className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
      data-ocid="notifications.popover"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            data-ocid="notifications.mark_all_button"
            onClick={() => markAllNotificationsRead(role)}
            className="text-xs text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {roleNotifs.length === 0 ? (
          <div
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="notifications.empty_state"
          >
            No notifications yet
          </div>
        ) : (
          roleNotifs.map((n, i) => (
            <button
              type="button"
              key={String(n.id)}
              data-ocid={`notifications.item.${i + 1}`}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.tabLink) onTabLink(n.tabLink);
                onClose();
              }}
              className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40 ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              <p
                className={`text-xs leading-snug ${
                  !n.read
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {n.message}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmt(n.createdAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, academicCalendars, notifications, syncStatus } =
    useApp();
  const { isDark, toggleDark } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const notifRef = useRef<HTMLDivElement>(null);
  const role = currentUser?.role ?? "SuperAdmin";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.SuperAdmin;
  const activeCalendar = getActiveCalendar(academicCalendars);
  const unreadCount = notifications.filter(
    (n) => n.recipientRole === role && !n.read,
  ).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top navbar */}
        {/* Offline Banner */}
        {!isOnline && (
          <div
            className="w-full bg-amber-500 text-white text-xs font-medium text-center py-1.5 px-4 z-50 no-print"
            data-ocid="offline.banner"
          >
            ⚠️ You are offline. Changes will sync when connection is restored.
          </div>
        )}

        <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center px-4 gap-3 shadow-xs no-print">
          <div className="flex items-center gap-2 min-w-[160px]">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">
                UNIVERSITY{" "}
                <span className="text-muted-foreground font-normal">
                  results
                </span>
              </span>
              {activeCalendar && (
                <p className="text-xs text-muted-foreground leading-none">
                  {activeCalendar.session} · {activeCalendar.semester} Sem
                </p>
              )}
            </div>
          </div>

          {/* Global Search */}
          <div className="hidden sm:block">
            <GlobalSearch onNavigate={setActiveTab} />
          </div>

          <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                data-ocid="nav.notifications.button"
                onClick={() => setNotifOpen((v) => !v)}
                className="notification-bell relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationPanel
                  role={role}
                  onClose={() => setNotifOpen(false)}
                  onTabLink={setActiveTab}
                />
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? "bg-green-500" : "bg-amber-500"}`}
              />
              <span className="text-muted-foreground">
                {syncStatus.isOnline ? "Online" : "Offline"}
              </span>
              {syncStatus.lastSaved && (
                <span className="text-muted-foreground/60">
                  · Saved{" "}
                  {Math.round(
                    (Date.now() - new Date(syncStatus.lastSaved).getTime()) /
                      60000,
                  ) || "<1"}
                  m ago
                </span>
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.role}
              </p>
            </div>
            <button
              type="button"
              data-ocid="nav.dark_mode.toggle"
              onClick={toggleDark}
              className="no-print w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={logout}
              className="no-print w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile/tablet nav */}
        <div className="lg:hidden border-b border-border bg-card px-4 py-2 overflow-x-auto no-print">
          <div className="flex gap-1 min-w-max">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`mobile_nav.${item.id}.link`}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-border py-4 px-6 text-center no-print">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with ❤ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </TabContext.Provider>
  );
}

export { Bell, ChevronRight };
