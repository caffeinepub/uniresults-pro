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
import { GraduationCap, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { type RoleName, useApp } from "../context/AppContext";

const DEMO_USERS: {
  label: string;
  role: RoleName;
  name: string;
  principal: string;
  departmentId?: bigint;
}[] = [
  {
    label: "Super Admin",
    role: "SuperAdmin",
    name: "Prof. Adebayo Williams",
    principal: "admin-1",
  },
  {
    label: "Registrar",
    role: "Registrar",
    name: "Mrs. Chinwe Obi",
    principal: "registrar-1",
  },
  {
    label: "Dean – Faculty of Engineering",
    role: "Dean",
    name: "Dr. Sarah Williams",
    principal: "dean-1",
  },
  {
    label: "HOD – Computer Science",
    role: "HOD",
    name: "Dr. Alistair Finch",
    principal: "hod-1",
    departmentId: BigInt(1),
  },
  {
    label: "Lecturer (CSC301, CSC302)",
    role: "Lecturer",
    name: "Dr. Emeka Olu",
    principal: "lecturer-1",
  },
  {
    label: "Student – Amara Okonkwo",
    role: "Student",
    name: "Amara Okonkwo",
    principal: "student-1",
  },
];

export default function LoginPage() {
  const { login } = useApp();
  const [selected, setSelected] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [tab, setTab] = useState<"demo" | "admin">("demo");

  function handleDemoLogin() {
    const user = DEMO_USERS.find((u) => u.principal === selected);
    if (!user) return;
    login({
      name: user.name,
      role: user.role,
      principal: user.principal,
      departmentId: user.departmentId,
    });
  }

  function handleAdminLogin() {
    if (adminSecret.trim()) {
      login({
        name: "System Administrator",
        role: "SuperAdmin",
        principal: "super-admin",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">UniResults Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            University Results Processing System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
            <button
              type="button"
              data-ocid="login.tab"
              onClick={() => setTab("demo")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "demo"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Demo Login
            </button>
            <button
              type="button"
              data-ocid="admin.tab"
              onClick={() => setTab("admin")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "admin"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin Setup
            </button>
          </div>

          {tab === "demo" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Select your role
                </Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger data-ocid="role.select" className="w-full">
                    <SelectValue placeholder="Choose a role to login as..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_USERS.map((u) => (
                      <SelectItem key={u.principal} value={u.principal}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-ocid="login.primary_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selected}
                onClick={handleDemoLogin}
              >
                Sign In
              </Button>
            </div>
          )}

          {tab === "admin" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Enter the admin secret to initialize as Super Administrator.
                  This is a one-time setup.
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Admin Secret
                </Label>
                <Input
                  data-ocid="admin.input"
                  type="password"
                  placeholder="Enter admin secret..."
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
              </div>
              <Button
                data-ocid="admin.submit_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAdminLogin}
              >
                Initialize as Admin
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
