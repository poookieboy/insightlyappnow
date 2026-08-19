import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let cancelled = false;

    const handleVerification = async () => {
      // Supabase may return a PKCE code in the URL.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (!cancelled) {
            setMessage("We couldn't complete the verification.");
          }
          return;
        }
      }

      // Make sure we have the latest authentication state.
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        if (!cancelled) {
          setMessage(
            "Verification completed, but we couldn't restore your session.",
          );
        }
        return;
      }

      if (!data.user.email_confirmed_at) {
        if (!cancelled) {
          setMessage("Your email has not been confirmed yet.");
        }
        return;
      }

      if (cancelled) return;

      setMessage("Email verified! Welcome to Insightly.");

      // Give the success message a moment to be visible.
      setTimeout(() => {
        if (!cancelled) {
          navigate({ to: "/" });
        }
      }, 1200);
    };

    handleVerification();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-xl font-bold">
          {message}
        </h1>

        <div className="mt-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          You'll be returned to Insightly automatically.
        </p>
      </Card>
    </main>
  );
}
