import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Floating connectivity pill. Shows persistently while offline and
 * flashes a "Back online" confirmation when the connection returns.
 */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  const [showBack, setShowBack] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowBack(false);
      return;
    }
    if (wasOffline) {
      setShowBack(true);
      const t = setTimeout(() => setShowBack(false), 2600);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  if (online && !showBack) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg backdrop-blur transition-all",
          online ? "bg-emerald-500/90 text-white" : "bg-foreground/90 text-background",
        )}
      >
        {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {online
          ? "Back online — syncing your work"
          : "Offline — notes, timetable & revision still work"}
      </div>
    </div>
  );
}
