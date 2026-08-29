import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PayStage =
  | "idle"
  | "sending"
  | "waiting"
  | "success"
  | "failed";

interface StartArgs {
  type: "subscription" | "sponsorship";
  plan?: "monthly" | "sixmonth" | "yearly";
  amount?: number;
  phone: string;
  message?: string;
}

const PAYMENT_FUNCTION = "payments-initiate-v2";

export function usePayment() {
  const [stage, setStage] = useState<PayStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setStage("idle");
    setError(null);
  }, []);

  const start = useCallback(
    async (args: StartArgs): Promise<boolean> => {
      setError(null);

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        setError(
          "You're offline — connect to the internet to complete your payment.",
        );
        setStage("failed");
        return false;
      }

      setStage("sending");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          setError("Please sign in first.");
          setStage("failed");
          return false;
        }

        const kind =
          args.type === "subscription"
            ? "subscription"
            : "sponsor";

        const { data, error: functionError } =
          await supabase.functions.invoke(
            PAYMENT_FUNCTION,
            {
              body: {
                phone: args.phone,
                amount: args.amount,
                kind,
                plan: args.plan,
                message: args.message,
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            },
          );

        if (functionError) {
          console.error(
            "Payment Edge Function error:",
            functionError,
          );

          setError(
            functionError.message ||
              "Could not start the payment.",
          );

          setStage("failed");
          return false;
        }

        if (!data?.success) {
          console.error(
            "Payment initiation response:",
            data,
          );

          setError(
            data?.error ||
              data?.message ||
              "Could not start the payment.",
          );

          setStage("failed");
          return false;
        }

        /*
         * At this point the payment request was accepted
         * by the payment function.
         *
         * This does NOT mean the M-Pesa payment is complete.
         * The user should now receive the STK Push prompt.
         */
        setStage("waiting");

        /*
         * Sponsor Scholar payments don't activate Pro.
         * We still wait briefly for the provider request to
         * complete, then report that the request was accepted.
         */
        if (kind === "sponsor") {
          setStage("success");
          return true;
        }

        /*
         * Subscription:
         *
         * Wait for the LipaWin webhook to update
         * user_subscription_status.pro_until.
         */
        const deadline =
          Date.now() + 3 * 60 * 1000;

        return await new Promise<boolean>(
          (resolve) => {
            const poll = async () => {
              try {
                const {
                  data: subscription,
                  error: subscriptionError,
                } = await supabase
                  .from("user_subscription_status")
                  .select("pro_until")
                  .eq(
                    "user_id",
                    session.user.id,
                  )
                  .maybeSingle();

                if (
                  !subscriptionError &&
                  subscription?.pro_until
                ) {
                  const proUntil = new Date(
                    subscription.pro_until,
                  ).getTime();

                  if (
                    Number.isFinite(proUntil) &&
                    proUntil > Date.now()
                  ) {
                    setStage("success");

                    if (timer.current) {
                      clearTimeout(timer.current);
                      timer.current = null;
                    }

                    return resolve(true);
                  }
                }
              } catch (pollError) {
                console.error(
                  "Subscription status check failed:",
                  pollError,
                );
              }

              if (Date.now() > deadline) {
                setError(
                  "We haven't received payment confirmation yet. If you completed the M-Pesa payment, your subscription will unlock after confirmation.",
                );

                setStage("failed");

                if (timer.current) {
                  clearTimeout(timer.current);
                  timer.current = null;
                }

                return resolve(false);
              }

              timer.current = setTimeout(
                poll,
                3000,
              );
            };

            timer.current = setTimeout(
              poll,
              3000,
            );
          },
        );
      } catch (err) {
        console.error(
          "Payment request failed:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to send the payment request. Please try again.",
        );

        setStage("failed");
        return false;
      }
    },
    [],
  );

  return {
    stage,
    error,
    start,
    reset,
  };
    }
