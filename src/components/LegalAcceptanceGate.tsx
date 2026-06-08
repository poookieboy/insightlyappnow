import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const TOS_VERSION = "1.0";
export const PRIVACY_VERSION = "1.0";

export function LegalAcceptanceGate() {
  const { user } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean | null>(null);
  const [tosOk, setTosOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("legal_acceptances")
        .select("tos_version,privacy_version")
        .eq("user_id", user.id)
        .eq("tos_version", TOS_VERSION)
        .eq("privacy_version", PRIVACY_VERSION)
        .maybeSingle();
      setNeedsAcceptance(!data);
    })();
  }, [user]);

  const accept = async () => {
    if (!user || !tosOk || !privacyOk) return;
    setBusy(true);
    const { error } = await supabase.from("legal_acceptances").insert({
      user_id: user.id,
      tos_version: TOS_VERSION,
      privacy_version: PRIVACY_VERSION,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks! You're all set.");
    setNeedsAcceptance(false);
  };

  if (!user || needsAcceptance !== true) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-scale-in">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">Before you continue</h2>
            <p className="text-xs text-muted-foreground">Please review and accept our policies.</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          We need your consent so we can save your study data, sync your streaks, and provide AI features.
        </p>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 p-3 transition-all hover:bg-muted/50">
            <Checkbox checked={tosOk} onCheckedChange={(v) => setTosOk(!!v)} className="mt-0.5" />
            <div className="flex-1 text-sm">
              I have read and agree to the{" "}
              <Link to="/terms" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                Terms of Service
              </Link>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 p-3 transition-all hover:bg-muted/50">
            <Checkbox checked={privacyOk} onCheckedChange={(v) => setPrivacyOk(!!v)} className="mt-0.5" />
            <div className="flex-1 text-sm">
              I have read and agree to the{" "}
              <Link to="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </label>
        </div>

        <Button
          onClick={accept}
          disabled={!tosOk || !privacyOk || busy}
          className="mt-5 w-full bg-gradient-primary text-primary-foreground"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept and continue"}
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          You're starting a 7-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
