import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck, Loader2, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import insightlyIcon from "@/assets/insightly-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify your email — Insightly" },
      {
        name: "description",
        content:
          "Confirm your email address to activate your Insightly account and start studying.",
      },
      { property: "og:title", content: "Verify your email — Insightly" },
      {
        property: "og:description",
        content: "Confirm your email address to activate your Insightly account.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

const COOLDOWN = 60;

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  // If the email is already verified when this page loads,
  // send the user directly into the app.
  useEffect(() => {
    if (!loading && user?.email_confirmed_at) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    if (!user?.email || cooldown > 0) return;

    setBusy(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setBusy(false);

    if (error) {
      toast.error(
        /rate|limit/i.test(error.message)
          ? "Too many emails sent. Please wait a moment and try again."
          : error.message,
      );
      return;
    }

    setCooldown(COOLDOWN);

    toast.success(
      "Verification email sent — check your inbox and spam folder",
    );
  };

  const recheck = async () => {
    setChecking(true);

    // Refresh the current Supabase session first.
    const { error: refreshError } =
      await supabase.auth.refreshSession();

    if (refreshError) {
      setChecking(false);
      toast.error(refreshError.message);
      return;
    }

    // Ask Supabase directly for the current user instead of
    // relying on the potentially stale user object from useAuth().
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    setChecking(false);

    if (userError) {
      toast.error(userError.message);
      return;
    }

    if (currentUser?.email_confirmed_at) {
      toast.success("Email verified — welcome to Insightly!");
      navigate({ to: "/" });
      return;
    }

    toast.error(
      "Not verified yet. Click the link in your email, then try again.",
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden p-0">
        <div className="relative flex flex-col items-center bg-gradient-ocean px-6 py-8 text-primary-foreground">
          <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <img
            src={insightlyIcon}
            alt="Insightly"
            className="h-14 w-14 object-contain"
          />

          <h1 className="mt-3 font-display text-xl font-bold">
            Verify your email
          </h1>

          <p className="mt-1 text-center text-xs opacity-90">
            We sent a confirmation link to
            <br />
            <span className="font-semibold">
              {user?.email ?? "your inbox"}
            </span>
          </p>
        </div>

        <div className="space-y-3 p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <p>
              Open the email and tap{" "}
              <strong className="text-foreground">
                Confirm your email
              </strong>
              . Your account — and any referral code you entered — activates
              the moment you do.
            </p>
          </div>

          <Button
            onClick={recheck}
            disabled={checking}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}

            {checking
              ? "Checking verification..."
              : "I've verified — continue"}
          </Button>

          <Button
            variant="outline"
            onClick={resend}
            disabled={busy || cooldown > 0}
            className="w-full"
          >
            {busy && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend verification email"}
          </Button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <Link
              to="/auth"
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              Use a different email
            </Link>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}
