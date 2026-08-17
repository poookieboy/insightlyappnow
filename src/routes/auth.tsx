import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, ShieldCheck, Gift } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [phone, setPhone] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
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
    // If your useAuth hook depends on server sessions, adjust this redirect as needed.
    navigate({ to: user?.email_confirmed_at ? "/" : "/verify-email" });
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

  // Email/password sign in (calls your backend)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) return toast.error(j.error || "Login failed");
      // store access token in sessionStorage and proceed
      if (j.accessToken) window.sessionStorage.setItem("access_token", j.accessToken);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err) {
      setBusy(false);
      toast.error("Login failed");
    }
  };

  // Email/password sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);

    const code = referral.trim().toUpperCase();
    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, referral: code || undefined }),
      });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) return toast.error(j.error || "Registration failed");
      if (code) window.localStorage.setItem(PENDING_REFERRAL_KEY, code);
      if (j.accessToken) window.sessionStorage.setItem("access_token", j.accessToken);
      toast.success("Account created — welcome!");
      navigate({ to: "/" });
    } catch (err) {
      setBusy(false);
      toast.error("Registration failed");
    }
  };

  const handleForgot = async () => {
    if (!email) return toast.error("Enter your email above first");
    setBusy(true);
    try {
      const res = await fetch("/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setBusy(false);
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Failed to send magic link");
      toast.success("Magic link sent — check your email");
    } catch (err) {
      setBusy(false);
      toast.error("Failed to send magic link");
    }
  };

  // GitHub OAuth: redirect to backend start endpoint
  const handleGithub = async () => {
    setBusy(true);
    try {
      window.location.href = "/auth/github/start";
    } catch (err) {
      setBusy(false);
      toast.error("GitHub sign-in failed");
    }
  };

  // Email magic link (passwordless)
  const handleEmailMagic = async () => {
    if (!email) return toast.error("Enter your email above first");
    setBusy(true);
    try {
      const res = await fetch("/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setBusy(false);
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Failed to send magic link");
      toast.success("Magic link sent — check your email");
    } catch (err) {
      setBusy(false);
      toast.error("Failed to send magic link");
    }
  };

  // Phone OTP send (SMS or WhatsApp) - backend will return an otpId
  const handlePhoneOtpRequest = async () => {
    if (!phone) return toast.error("Enter your phone number first");
    setBusy(true);
    try {
      const res = await fetch("/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, via: "sms" }),
      });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) return toast.error(j.error || "Failed to send OTP");
      setOtpId(j.otpId || null);
      toast.success("OTP sent — check your phone");
    } catch (err) {
      setBusy(false);
      toast.error("Failed to send OTP");
    }
  };

  const handlePhoneOtpVerify = async () => {
    if (!otpId || !otpCode) return toast.error("Enter the OTP first");
    setBusy(true);
    try {
      const res = await fetch("/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpId, code: otpCode }),
      });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) return toast.error(j.error || "OTP verification failed");
      if (j.accessToken) window.sessionStorage.setItem("access_token", j.accessToken);
      toast.success("Phone verified — signed in");
      navigate({ to: "/" });
    } catch (err) {
      setBusy(false);
      toast.error("OTP verification failed");
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
            Sign in to start your {" "}
            <span className="font-medium text-foreground">7-day free trial</span>
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-7 shadow-xl">
          <div className="grid grid-cols-1 gap-3">
            <Button onClick={handleGithub} disabled={busy} variant="outline" className="w-full h-11">Continue with GitHub</Button>
            <Button onClick={handleEmailMagic} disabled={busy} variant="ghost" className="w-full h-11">Send magic link to email</Button>
            <div className="flex gap-2">
              <Input placeholder="+254700000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 h-11" />
              <Button onClick={handlePhoneOtpRequest} disabled={busy} className="h-11">Send OTP</Button>
            </div>
            {otpId && (
              <div className="flex gap-2">
                <Input placeholder="Enter OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="flex-1 h-11" />
                <Button onClick={handlePhoneOtpVerify} disabled={busy} className="h-11">Verify</Button>
              </div>
            )}
          </div>

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
                    Referral code {" "}
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
          By continuing you agree to our {" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms
          </a>{" "}
          and {" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
