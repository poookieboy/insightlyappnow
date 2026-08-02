import { createFileRoute } from "@tanstack/react-router";
import { finalizePayment } from "@/lib/payments.server";
import { fetchProviderStatus, mapStatus } from "@/lib/lipalink.server";

/**
 * LipaLink payment callback.
 * The callback body is treated as an untrusted hint: before anything is granted
 * we re-check the transaction against LipaLink's API with our server-side key,
 * so a forged callback cannot activate a subscription.
 */
export const Route = createFileRoute("/api/public/webhooks/lipalink")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id,status")
          .eq("transaction_id", transactionId)
          .maybeSingle();

        if (!payment || payment.status !== "pending") return new Response("ok");

        // Authoritative check against the provider using our secret API key.
        let status = await fetchProviderStatus(transactionId);
        if (status === "unknown") {
          // Provider status lookup unavailable: only trust an explicit failure hint,
          // never an unverified success.
          const hint = mapStatus(payload["status"] ?? payload["payment_status"] ?? payload["state"]);
          if (hint === "failed" || hint === "cancelled") status = hint;
        }

        if (status === "success" || status === "failed" || status === "cancelled") {
          await finalizePayment(payment.id, status, status === "success" ? undefined : "Reported by provider");
        }

        return new Response("ok");
      },
    },
  },
});
