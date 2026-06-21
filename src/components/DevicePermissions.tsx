import { useEffect, useState } from "react";
import { Camera, Mic, Bell, Check, X, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type State = "granted" | "denied" | "prompt" | "unsupported";

function StatePill({ state }: { state: State }) {
  if (state === "granted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <Check className="h-3 w-3" /> Granted
      </span>
    );
  if (state === "denied")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-700">
        <X className="h-3 w-3" /> Denied
      </span>
    );
  if (state === "unsupported")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        N/A
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      <HelpCircle className="h-3 w-3" /> Not asked
    </span>
  );
}

function Row({
  icon,
  title,
  desc,
  state,
  busy,
  onRequest,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  state: State;
  busy: boolean;
  onRequest: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <StatePill state={state} />
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Button
        size="sm"
        variant={state === "granted" ? "outline" : "default"}
        disabled={busy || state === "granted" || state === "unsupported"}
        onClick={onRequest}
        className={state === "granted" ? "" : "bg-gradient-primary text-primary-foreground"}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === "granted" ? (
          "On"
        ) : state === "denied" ? (
          "Settings"
        ) : (
          "Allow"
        )}
      </Button>
    </div>
  );
}

export function DevicePermissions() {
  const [cam, setCam] = useState<State>("prompt");
  const [mic, setMic] = useState<State>("prompt");
  const [notif, setNotif] = useState<State>("prompt");
  const [busy, setBusy] = useState<string | null>(null);

  const queryPerm = async (name: "camera" | "microphone"): Promise<State> => {
    try {
      // @ts-expect-error - camera/microphone are valid PermissionName in browsers
      const r = await navigator.permissions.query({ name });
      return (r.state as State) ?? "prompt";
    } catch {
      return "prompt";
    }
  };

  const refresh = async () => {
    if (typeof navigator === "undefined") return;
    if (!navigator.mediaDevices) {
      setCam("unsupported");
      setMic("unsupported");
    } else {
      setCam(await queryPerm("camera"));
      setMic(await queryPerm("microphone"));
    }
    if (typeof Notification === "undefined") setNotif("unsupported");
    else
      setNotif(
        Notification.permission === "granted"
          ? "granted"
          : Notification.permission === "denied"
          ? "denied"
          : "prompt",
      );
  };

  useEffect(() => {
    refresh();
  }, []);

  const askMedia = async (kind: "camera" | "microphone") => {
    setBusy(kind);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "camera" ? { video: true } : { audio: true },
      );
      stream.getTracks().forEach((t) => t.stop());
      toast.success(`${kind === "camera" ? "Camera" : "Microphone"} access granted`);
    } catch {
      toast.error("Permission denied — enable it in your browser settings");
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const askNotif = async () => {
    setBusy("notif");
    try {
      const res = await Notification.requestPermission();
      if (res === "granted") toast.success("Notifications enabled");
      else toast.error("Notifications blocked");
    } finally {
      setBusy(null);
      refresh();
    }
  };

  return (
    <div className="space-y-2">
      <Row
        icon={<Camera className="h-4 w-4" />}
        title="Camera"
        desc="Snap homework so Iris can read and explain it."
        state={cam}
        busy={busy === "camera"}
        onRequest={() => askMedia("camera")}
      />
      <Row
        icon={<Mic className="h-4 w-4" />}
        title="Microphone"
        desc="Talk to Iris with voice and get spoken answers."
        state={mic}
        busy={busy === "microphone"}
        onRequest={() => askMedia("microphone")}
      />
      <Row
        icon={<Bell className="h-4 w-4" />}
        title="Notifications"
        desc="Streak reminders and upcoming-task alerts."
        state={notif}
        busy={busy === "notif"}
        onRequest={askNotif}
      />
      <p className="px-1 pt-1 text-[11px] text-muted-foreground">
        If a permission is denied, you'll need to re-enable it from your browser's site settings.
      </p>
    </div>
  );
}
