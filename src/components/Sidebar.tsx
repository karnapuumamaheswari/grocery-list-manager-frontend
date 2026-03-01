import {
  BarChart3,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ComponentType, useEffect, useState } from "react";

type SidebarItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  expiringCount: number;
}

const menuItems: SidebarItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Grocery List", to: "/grocery", icon: ShoppingCart },
  { label: "Pantry", to: "/pantry", icon: ClipboardList },
  { label: "Recipes", to: "/recipes", icon: ChefHat },
  { label: "Budget", to: "/budget", icon: Wallet },
  { label: "Purchase History", to: "/history", icon: ClipboardList },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
];

function MenuLinks({
  collapsed,
  expiringCount,
  onNavigate,
}: {
  collapsed: boolean;
  expiringCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const badge = item.to === "/pantry" ? expiringCount : item.badge;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "border-primary/45 bg-primary/10 text-foreground"
                  : "border-border/70 bg-card/70 text-muted-foreground hover:border-accent/40 hover:bg-card hover:text-foreground",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
            {!collapsed && badge && badge > 0 ? (
              <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                {badge}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </div>
  );
}

export function Sidebar({ collapsed, onToggleCollapse, onLogout, expiringCount }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: "light" | "dark" = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="fixed left-4 top-4 z-40 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/70 bg-card/95 px-3 py-4 shadow-xl backdrop-blur lg:sticky lg:z-20 lg:translate-x-0",
          collapsed ? "w-[84px]" : "w-[270px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "transition-all duration-200 ease-out",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold">Smart Grocery</p>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          ) : null}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={onToggleCollapse}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <MenuLinks collapsed={collapsed} expiringCount={expiringCount} onNavigate={() => setMobileOpen(false)} />

        <Button
          type="button"
          variant="outline"
          className={cn("mt-3 w-full gap-2", collapsed && "px-0")}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : null}
        </Button>

        <Button
          type="button"
          variant="outline"
          className={cn("mt-3 w-full gap-2", collapsed && "px-0")}
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? "Logout" : null}
        </Button>
      </aside>
    </>
  );
}
