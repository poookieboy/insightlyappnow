import { createFileRoute } from "@tanstack/react-router";
import { finalizePayment } from "@/lib/payments.server";
import { mapStatus } from "@/lib/lipalink.server";

/**
 * LipaLink payment callback. Secured with a shared secret the provider must send
 * either as `?token=` on the callback URL or in the `X-Webhook-Secret` header.
 */
export const Route = createFileRoute("/api/public/webhooks/lipalink")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LIPALINK_WEBHOOK_SECRET"];
        const provided =
          request.headers.get("x-webhook-secret") ?? new URL(request.url).searchParams.get("token") ?? "";
        if (!secret || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const transactionId = String(
          payload["transaction_id"] ?? payload["transactionId"] ?? payload["id"] ?? "",
        );
        if (!transactionId) return new Response("Missing transaction_id", { status: 400 });

        const status = mapStatus(payload["status"] ?? payload["payment_status"] ?? payload["state"]);
        if (status === "unknown" || status === "pending") return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("transaction_id", transactionId)
          .maybeSingle();

        if (!payment) return new Response("ok");

        await finalizePayment(payment.id, status, status === "success" ? undefined : "Reported by provider");
        return new Response("ok");
      },
    },
  },
});
