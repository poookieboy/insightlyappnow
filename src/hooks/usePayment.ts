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

const PAYMENT_FUNCTION = "lipawin-payment";

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
          "You're offline. Connect to the internet to complete your payment.",
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
         * The payment request was accepted by the
         * Edge Function.
         *
         * This does NOT mean the M-Pesa payment has
         * been completed yet.
         */
        setStage("waiting");

        /*
         * Both subscriptions and Sponsor Scholar payments
         * must be confirmed by the backend before the UI
         * reports a completed payment.
         *
         * The backend/webhook should update the payment
         * record after Lipawin confirms the transaction.
         */

        const paymentId = data.paymentId;

        if (!paymentId) {
          setError(
            "Payment request was sent, but we couldn't track the transaction.",
          );
          setStage("failed");
          return false;
        }

        const deadline =
          Date.now() + 3 * 60 * 1000;

        return await new Promise<boolean>(
          (resolve) => {
            const poll = async () => {
              try {
                /*
                 * Check the payment record for provider
                 * confirmation.
                 */
                const {
                  data: payment,
                  error: paymentError,
                } = await supabase
                  .from("payments")
                  .select(
                    "status, provider_transaction_id, transaction_id",
                  )
                  .eq("id", paymentId)
                  .maybeSingle();

                if (!paymentError && payment) {
                  const status =
                    String(payment.status || "").toLowerCase();

                  if (
                    status === "success" ||
                    status === "completed" ||
                    status === "paid"
                  ) {
                    setStage("success");

                    if (timer.current) {
                      clearTimeout(timer.current);
                      timer.current = null;
                    }

                    return resolve(true);
                  }

                  if (
                    status === "failed" ||
                    status === "cancelled" ||
                    status === "canceled"
                  ) {
                    setError(
                      "The payment was not completed.",
                    );

                    setStage("failed");

                    if (timer.current) {
                      clearTimeout(timer.current);
                      timer.current = null;
                    }

                    return resolve(false);
                  }
                }

                /*
                 * For subscriptions, also check whether
                 * Pro access has been activated.
                 */
                if (kind === "subscription") {
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
                }
              } catch (pollError) {
                console.error(
                  "Payment status check failed:",
                  pollError,
                );
              }

              if (Date.now() > deadline) {
                setError(
                  "We haven't received payment confirmation yet. If you completed the M-Pesa payment, it will be updated after confirmation.",
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
