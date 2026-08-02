// Server-only payment helpers: verification of the caller and activation of paid benefits.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PLANS, type PlanDef } from "@/lib/plans";

export async function getUserFromRequest(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Marks a payment successful (idempotent) and grants the benefit it paid for. */
export async function finalizePayment(paymentId: string, status: "success" | "failed" | "cancelled", reason?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) return { ok: false, error: "Payment not found" };
  if (payment.status === "success") return { ok: true, alreadyDone: true };

  await supabaseAdmin
    .from("payments")
    .update({ status, failure_reason: reason ?? null })
    .eq("id", paymentId);

  if (status !== "success") return { ok: true };

  if (payment.type === "sponsorship") {
    await supabaseAdmin
      .from("sponsors")
      .update({ payment_status: "success" })
      .eq("payment_id", paymentId);
    return { ok: true };
  }

  const plan = PLANS[(payment.plan ?? "monthly") as PlanDef["key"]] ?? PLANS.monthly;

  const { data: current } = await supabaseAdmin
    .from("user_subscription_status")
    .select("pro_until")
    .eq("user_id", payment.user_id!)
    .maybeSingle();

  const now = Date.now();
  const base = current?.pro_until ? Math.max(new Date(current.pro_until).getTime(), now) : now;
  const expiresAt = new Date(base + plan.days * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin.from("subscriptions").insert({
    user_id: payment.user_id!,
    plan: plan.key,
    amount: payment.amount,
    status: "approved",
    payment_status: "success",
    payment_provider: "lipalink",
    transaction_id: payment.transaction_id,
    payment_id: payment.id,
    expires_at: expiresAt,
    reviewed_at: new Date().toISOString(),
  });

  await supabaseAdmin
    .from("user_subscription_status")
    .update({ tier: "pro", pro_until: expiresAt, provider: "lipalink", updated_at: new Date().toISOString() })
    .eq("user_id", payment.user_id!);

  return { ok: true, expiresAt };
}
