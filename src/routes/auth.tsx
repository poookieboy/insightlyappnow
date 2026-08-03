import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, ShieldCheck, Gift } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { PENDING_REFERRAL_KEY } from "@/hooks/useReferrals";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referral, setReferral] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill an invite code arriving via /auth?ref=CODE
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref)
      setReferral(
        ref
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 12),
      );
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: user.email_confirmed_at ? "/" : "/verify-email" });
  }, [loading, user, navigate]);

  const friendlyError = (msg: string) => {
    if (/failed to fetch|network/i.test(msg))
      return "Can't reach the server. Check your connection and try again.";
    if (/invalid login|invalid credentials/i.test(msg)) return "Wrong email or password.";
    if (/already registered|already exists/i.test(msg))
      return "That email is already registered. Try signing in instead.";
    if (/email not confirmed/i.test(msg))
      return "Please verify your email first — check your inbox.";
    return msg;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));
    if (!data.user?.email_confirmed_at) {
      toast.info("Please verify your email to finish setting up your account.");
      return navigate({ to: "/verify-email" });
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);

    const code = referral.trim().toUpperCase();
    if (code) {
      if (!/^[A-Z0-9]{5,12}$/.test(code)) {
        setBusy(false);
        return toast.error("That referral code doesn't look right. Check it and try again.");
      }
      const { data: valid, error: refErr } = await supabase.rpc("referral_code_valid", {
        p_code: code,
      });
      if (refErr || !valid) {
        setBusy(false);
        return toast.error("We couldn't find that referral code. Remove it or enter a valid one.");
      }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name },
      },
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));

    // Redeemed only after the account is email-verified (server-enforced).
    if (code) window.localStorage.setItem(PENDING_REFERRAL_KEY, code);
    toast.success("Account created — check your email to verify ✉️");
    navigate({ to: "/verify-email" });
  };

  const handleForgot = async () => {
    if (!email) return toast.error("Enter your email above first");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));
    toast.success("Password reset link sent — check your email");
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        // The popup may have closed after the session was already set — verify before failing.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/" });
          return;
        }
        setBusy(false);
        const raw = result.error.message || "";
        if (/cancel|closed|popup/i.test(raw)) {
          return toast.error(
            "Sign-in window closed before finishing. Allow pop-ups for this site and try again.",
          );
        }
        return toast.error(friendlyError(raw || "Google sign-in failed"));
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/" });
        return;
      }
      setBusy(false);
      const raw = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(
        /cancel|closed|popup/i.test(raw)
          ? "Sign-in window closed before finishing. Allow pop-ups for this site and try again."
          : friendlyError(raw),
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      {/* subtle background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-card border shadow-lg">
            <img src={insightlyIcon} alt="Insightly" className="h-14 w-14" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Welcome to Insightly</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to start your{" "}
            <span className="font-medium text-foreground">7-day free trial</span>
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-7 shadow-xl">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground">or use email</span>
            </div>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-5">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="si-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="si-pass"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 font-medium" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="w-full text-center text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-5">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-pass"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-ref" className="flex items-center gap-1.5">
                    Referral code{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-ref"
                      value={referral}
                      onChange={(e) =>
                        setReferral(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 12),
                        )
                      }
                      className="pl-9 h-11 tracking-[0.2em] uppercase"
                      placeholder="ABC1234"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Applied once you verify your email — your friend earns Premium time.
                  </p>
                </div>

                <Button type="submit" className="w-full h-11 font-medium" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> 7-day free trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure sign-in
          </span>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
