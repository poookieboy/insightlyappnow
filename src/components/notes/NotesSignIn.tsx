import { useState, type FormEvent } from "react";
import { Loader2, LogIn } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function NotesSignIn({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error: failure } = await externalSupabase.auth.signInWithPassword({ email: email.trim(), password });
      if (failure) {
        setError(failure.code === "invalid_credentials" ? "The email or password is incorrect." : failure.code === "email_not_confirmed" ? "Verify your email before signing in." : "We couldn’t sign you in. Check your Notes account and connection.");
        return;
      }
      setPassword(""); onOpenChange(false);
    } catch { setError("We couldn’t connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="max-w-md rounded-lg">
      <DialogHeader><DialogTitle>Sign in to Notes</DialogTitle><DialogDescription>Use your Insightly account to access your personal notes and submissions.</DialogDescription></DialogHeader>
      <form onSubmit={signIn} className="space-y-4">
        <div><Label htmlFor="notes-email">Email</Label><Input id="notes-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className="mt-1.5" /></div>
        <div><Label htmlFor="notes-password">Password</Label><Input id="notes-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} className="mt-1.5" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : <LogIn />}Sign in</Button>
      </form>
    </DialogContent>
  </Dialog>;
}