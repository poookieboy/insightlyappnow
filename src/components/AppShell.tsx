import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sparkles, LayoutGrid, User, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrialBanner } from "./TrialBanner";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tutor", label: "Iris", icon: Sparkles },
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:px-6",
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

export function AppShell({
  children,
  showTrialBanner = true,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  showTrialBanner?: boolean;
  className?: string;
  /** Use a wider content column — good for editors, dashboards, and tables. */
  wide?: boolean;
}) {
  return (
    <div className={cn("min-h-screen bg-gradient-soft pb-24", className)}>
      <div
        className={cn(
          "mx-auto px-4 pt-6 animate-fade-in sm:px-6 lg:px-8",
          wide ? "max-w-6xl" : "max-w-md sm:max-w-2xl lg:max-w-4xl",
        )}
      >
        {showTrialBanner && <TrialBanner />}
        {children}
      </div>
      <TabBar />
    </div>
  );
}
