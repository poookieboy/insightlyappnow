import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/payments.server";
import { initiateStkPush, normalizeMsisdn } from "@/lib/lipalink.server";
import { PLANS } from "@/lib/plans";
import { SPONSOR_TIERS } from "@/lib/plans";

const schema = z.object({
  type: z.enum(["subscription", "sponsorship"]),
  plan: z.enum(["monthly", "sixmonth", "yearly"]).optional(),
  amount: z.number().int().min(10).max(100000).optional(),
  phone: z.string().min(9).max(15),
  message: z.string().max(300).optional(),
});

export const Route = createFileRoute("/api/payments/initiate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserFromRequest(request);
        if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid payment details." }, { status: 400 });
        const input = parsed.data;

        const msisdn = normalizeMsisdn(input.phone);
        if (!msisdn) return Response.json({ error: "Enter a valid Safaricom number, e.g. 07XX XXX XXX." }, { status: 400 });

        let amount: number;
        let sponsorLevel: string | null = null;
        if (input.type === "subscription") {
          const plan = input.plan ? PLANS[input.plan] : null;
          if (!plan) return Response.json({ error: "Choose a plan." }, { status: 400 });
          amount = plan.price;
        } else {
          amount = input.amount ?? 0;
          if (amount < 10) return Response.json({ error: "Minimum sponsorship is KES 10." }, { status: 400 });
          sponsorLevel = SPONSOR_TIERS.find((t) => t.amount === amount)?.level ?? "custom";
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: payment, error: insertError } = await supabaseAdmin
          .from("payments")
          .insert({
            user_id: user.id,
            amount,
            type: input.type,
            plan: input.type === "subscription" ? input.plan! : null,
            sponsor_level: sponsorLevel,
            provider: "lipalink",
            phone: msisdn,
            status: "pending",
          })
          .select()
          .single();

        if (insertError || !payment) {
          return Response.json({ error: "Could not start the payment. Try again." }, { status: 500 });
        }

        const reference = `INS-${payment.id.slice(0, 8).toUpperCase()}`;
        const result = await initiateStkPush({ amount, msisdn, reference });

        if (!result.ok) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", failure_reason: result.error ?? "STK push failed" })
            .eq("id", payment.id);
          return Response.json({ error: result.error ?? "Could not send the M-Pesa prompt." }, { status: 502 });
        }

        await supabaseAdmin
          .from("payments")
          .update({ transaction_id: result.transactionId!, provider_reference: reference })
          .eq("id", payment.id);

        if (input.type === "sponsorship") {
          await supabaseAdmin.from("sponsors").insert({
            user_id: user.id,
            amount,
            sponsor_level: sponsorLevel ?? "custom",
            payment_status: "pending",
            transaction_id: result.transactionId!,
            payment_id: payment.id,
            message: input.message ?? null,
          });
        }

        return Response.json({ paymentId: payment.id, reference });
      },
    },
  },
});
