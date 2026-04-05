import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  group?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  roleName?: string;
  institutionName?: string;
}

export default function DashboardSidebar({
  items,
  activeTab,
  onTabChange,
  roleName = "",
  institutionName = "",
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  // Group items by group property
  const groups = items.reduce<Record<string, SidebarItem[]>>((acc, item) => {
    const g = item.group ?? "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const groupKeys = [...new Set(items.map((i) => i.group ?? "General"))];

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        data-ocid="sidebar.panel"
        className={`no-print flex flex-col border-r border-border bg-card transition-all duration-200 ease-in-out shrink-0 overflow-hidden ${
          collapsed ? "w-14" : "w-56"
        }`}
        style={{ minHeight: "calc(100vh - 3.5rem)" }}
      >
        {/* Toggle button */}
        <div
          className={`flex items-center border-b border-border py-2 ${
            collapsed ? "justify-center px-0" : "justify-between px-3"
          }`}
        >
          {!collapsed && institutionName && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">
                {institutionName}
              </p>
              {roleName && (
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {roleName}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            data-ocid="sidebar.toggle"
            onClick={() => setCollapsed((c) => !c)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {groupKeys.map((groupName) => (
            <div key={groupName} className="mb-1">
              {!collapsed && groupKeys.length > 1 && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {groupName}
                </p>
              )}
              {groups[groupName]?.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-ocid={`sidebar.${item.id}.button`}
                          onClick={() => onTabChange(item.id)}
                          className={`w-full flex items-center justify-center h-9 mx-0 my-0.5 rounded-md transition-colors relative ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.badge && item.badge > 0 ? (
                            <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          ) : null}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                        {item.badge && item.badge > 0 ? ` (${item.badge})` : ""}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-ocid={`sidebar.${item.id}.button`}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 h-9 my-0.5 rounded-md transition-colors text-left ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate flex-1">
                      {item.label}
                    </span>
                    {item.badge && item.badge > 0 ? (
                      <Badge
                        variant="destructive"
                        className="h-4 min-w-4 px-1 text-[9px] shrink-0"
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
