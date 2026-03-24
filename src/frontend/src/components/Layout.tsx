import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { getActiveCalendar, useApp } from "../context/AppContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SuperAdmin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "students", label: "Students", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "course_mgmt", label: "Course Management", icon: BookOpen },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "summaries", label: "Result Summaries", icon: FileText },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "calendar", label: "Academic Calendar", icon: CalendarDays },
    { id: "audit", label: "Audit Log", icon: ScrollText },
    { id: "roles", label: "User Roles", icon: Settings },
  ],
  Registrar: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "students", label: "Students", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "course_mgmt", label: "Course Management", icon: BookOpen },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "summaries", label: "Result Summaries", icon: FileText },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "calendar", label: "Academic Calendar", icon: CalendarDays },
  ],
  HOD: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "approvals", label: "Approvals", icon: FileCheck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "carryovers", label: "Carry-overs", icon: RefreshCw },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "results", label: "All Results", icon: ClipboardList },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
  ],
  Lecturer: [
    { id: "overview", label: "My Courses", icon: BookOpen },
    { id: "results", label: "Results", icon: ClipboardList },
    { id: "bulk_upload", label: "Bulk Upload", icon: ClipboardList },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
  ],
  Student: [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "course_reg", label: "Course Registration", icon: BookOpen },
    { id: "results", label: "My Results", icon: ClipboardList },
    { id: "semester_summary", label: "Semester Summary", icon: FileText },
    { id: "gpa", label: "GPA / CGPA", icon: BarChart3 },
    { id: "transcript", label: "Transcript", icon: FileText },
    { id: "appeals", label: "Grade Appeals", icon: MessageSquare },
  ],
  Dean: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "approvals", label: "Approvals", icon: FileCheck },
    { id: "departments", label: "Departments", icon: Settings },
    { id: "results", label: "All Results", icon: ClipboardList },
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
  const { currentUser, logout, academicCalendars, notifications } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const role = currentUser?.role ?? "SuperAdmin";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.SuperAdmin;
  const activeCalendar = getActiveCalendar(academicCalendars);
  const unreadCount = notifications.filter(
    (n) => n.recipientRole === role && !n.read,
  ).length;

  // Close notification panel on outside click
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
        <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center px-4 gap-4 shadow-xs">
          <div className="flex items-center gap-2 min-w-[200px]">
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

          <nav className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
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
                className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              data-ocid="nav.logout.button"
              onClick={logout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden border-b border-border bg-card px-4 py-2 overflow-x-auto">
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

        <footer className="border-t border-border py-4 px-6 text-center">
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
