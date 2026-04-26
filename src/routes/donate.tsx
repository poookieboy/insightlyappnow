import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Coffee, Smartphone, ChevronLeft, ExternalLink, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
});

const LINKS = {
  bmac: "https://buymeacoffee.com/studentsync",
  mpesaPaybill: "852648",
  mpesaAccount: "95408",
  mpesaName: "Fortune Sacco",
};

function DonatePage() {
  const [mpesaOpen, setMpesaOpen] = useState(false);

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
        <button onClick={() => setMpesaOpen(true)} className="w-full text-left">
          <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Pay with M-Pesa</p>
              <p className="text-xs text-muted-foreground">Lipa na M-Pesa Paybill — Kenya</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Recommended
            </span>
          </Card>
        </button>

        <a href={LINKS.bmac} target="_blank" rel="noreferrer" className="block">
          <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Buy me a coffee ☕</p>
              <p className="text-xs text-muted-foreground">One-time tip in any currency</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Card>
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Thank you for supporting independent learners 🙏
      </p>

      <MpesaDialog open={mpesaOpen} onClose={() => setMpesaOpen(false)} />
    </AppShell>
  );
}

function MpesaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("100");
  const [step, setStep] = useState<"form" | "instructions">("form");

  const handleSubmit = () => {
    const cleaned = phone.replace(/\s+/g, "");
    if (!/^(?:\+?254|0)?[71]\d{8}$/.test(cleaned)) {
      toast.error("Enter a valid Kenyan phone number");
      return;
    }
    if (!amount || Number(amount) < 1) {
      toast.error("Enter an amount");
      return;
    }
    setStep("instructions");
  };

  const reset = () => {
    setStep("form");
    setPhone("");
    setAmount("100");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && reset()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            Pay with M-Pesa
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter your phone and amount. We'll show you the steps to complete payment on your phone.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium">Phone number</label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Amount (KES)</label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[50, 100, 200, 500, 1000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] hover:bg-muted"
                  >
                    KES {v}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-emerald-600 text-white hover:bg-emerald-700">
                Continue
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border bg-emerald-500/5 p-3">
              <p className="text-[11px] font-semibold uppercase text-emerald-700">Payment summary</p>
              <div className="mt-1 grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Paybill</span>
                <span className="text-right font-mono font-bold">{LINKS.mpesaPaybill}</span>
                <span className="text-muted-foreground">Account</span>
                <span className="text-right font-mono font-bold">{LINKS.mpesaAccount}</span>
                <span className="text-muted-foreground">Amount</span>
                <span className="text-right font-bold">KES {amount}</span>
                <span className="text-muted-foreground">Phone</span>
                <span className="text-right font-mono">{phone}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold">On your phone:</p>
              <ol className="space-y-1.5 text-xs">
                <Step n={1}>Open M-Pesa → <strong>Lipa na M-Pesa</strong></Step>
                <Step n={2}>Choose <strong>Pay Bill</strong></Step>
                <Step n={3}>Business no.: <strong className="font-mono">{LINKS.mpesaPaybill}</strong></Step>
                <Step n={4}>Account no.: <strong className="font-mono">{LINKS.mpesaAccount}</strong></Step>
                <Step n={5}>Amount: <strong>KES {amount}</strong> → enter PIN → confirm</Step>
              </ol>
            </div>

            <p className="rounded-md bg-muted/40 p-2 text-[10px] text-muted-foreground">
              💡 An automatic STK Push (popup on your phone) will be available soon — it requires Safaricom Daraja API setup.
            </p>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setStep("form")}>Back</Button>
              <Button onClick={reset} className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Check className="mr-1 h-4 w-4" /> Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
