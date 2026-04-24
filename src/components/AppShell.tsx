import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutGrid, Sparkles, BookOpen, Settings as Cog } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/tutor", label: "Tutor", icon: Sparkles },
  { to: "/workspace", label: "Workspace", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Cog },
] as const;

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-soft pb-24">
      <div className="mx-auto max-w-md px-4 pt-6 animate-fade-in">{children}</div>
      <TabBar />
    </div>
  );
}
