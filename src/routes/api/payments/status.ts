import { createFileRoute } from "@tanstack/react-router";
import { getUserFromRequest, finalizePayment } from "@/lib/payments.server";
import { fetchProviderStatus } from "@/lib/lipalink.server";

export const Route = createFileRoute("/api/payments/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });

        const paymentId = new URL(request.url).searchParams.get("id");
        if (!paymentId) return Response.json({ error: "Missing payment id." }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id,user_id,status,amount,type,plan,transaction_id,created_at")
          .eq("id", paymentId)
          .maybeSingle();

        if (!payment || payment.user_id !== user.id) {
          return Response.json({ error: "Payment not found." }, { status: 404 });
        }

        if (payment.status === "pending" && payment.transaction_id) {
          const providerStatus = await fetchProviderStatus(payment.transaction_id);
          if (providerStatus === "success" || providerStatus === "failed" || providerStatus === "cancelled") {
            await finalizePayment(payment.id, providerStatus);
            return Response.json({ status: providerStatus });
          }
          // Give up on very old prompts so the UI never hangs forever.
          const ageMs = Date.now() - new Date(payment.created_at).getTime();
          if (ageMs > 5 * 60 * 1000) {
            await finalizePayment(payment.id, "cancelled", "Timed out waiting for M-Pesa confirmation");
            return Response.json({ status: "cancelled" });
          }
        }

        return Response.json({ status: payment.status });
      },
    },
  },
});
