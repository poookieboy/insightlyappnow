import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Coffee, Smartphone, ChevronLeft, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
});

// Replace these with the creator's real handles when ready.
const LINKS = {
  bmac: "https://buymeacoffee.com/studentsync",
  paypal: "https://paypal.me/studentsync",
  mpesaTill: "5204228",
  mpesaName: "StudentSync",
};

function DonatePage() {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <AppShell>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <Heart className="mx-auto h-10 w-10" />
        <h1 className="mt-2 text-2xl font-bold">Support the creator</h1>
        <p className="mt-1 text-sm opacity-90">
          StudentSync is free. If it helps you study, a small gift keeps it growing 💜
        </p>
      </Card>

      <div className="space-y-3">
        <a href={LINKS.bmac} target="_blank" rel="noreferrer">
          <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Buy me a coffee</p>
              <p className="text-xs text-muted-foreground">Quick one-time tip</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Card>
        </a>

        <a href={LINKS.paypal} target="_blank" rel="noreferrer">
          <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600">
              <Heart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">PayPal</p>
              <p className="text-xs text-muted-foreground">Pay any amount</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Card>
        </a>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">M-Pesa (Kenya)</p>
              <p className="text-xs text-muted-foreground">Pay to Buy Goods (Till)</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => copy(LINKS.mpesaTill, "Till number")}
              className="rounded-xl border bg-muted/40 p-3 text-left text-xs hover:bg-muted"
            >
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Till No.</p>
              <p className="font-mono text-sm font-bold">{LINKS.mpesaTill}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Tap to copy</p>
            </button>
            <button
              onClick={() => copy(LINKS.mpesaName, "Business name")}
              className="rounded-xl border bg-muted/40 p-3 text-left text-xs hover:bg-muted"
            >
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Business</p>
              <p className="text-sm font-bold">{LINKS.mpesaName}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Tap to copy</p>
            </button>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Thank you for supporting independent learners 🙏
      </p>
    </AppShell>
  );
}
