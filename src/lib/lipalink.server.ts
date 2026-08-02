// Server-only LipaLink (M-Pesa STK Push) helpers. Never import from client code.

const STK_URL = "https://lipalink.co.ke/api/stk_push.php";
const STATUS_URL = "https://lipalink.co.ke/api/status.php";

export function normalizeMsisdn(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

interface StkResult {
  ok: boolean;
  transactionId?: string;
  error?: string;
  raw?: unknown;
}

export async function initiateStkPush(params: {
  amount: number;
  msisdn: string;
  reference: string;
}): Promise<StkResult> {
  const apiKey = process.env["LIPALINK_API_KEY"];
  const businessId = process.env["LIPALINK_BUSINESS_ID"];
  if (!apiKey || !businessId) return { ok: false, error: "Payment provider is not configured." };

  try {
    const res = await fetch(STK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({
        amount: Math.round(params.amount),
        msisdn: params.msisdn,
        reference: params.reference,
        business_id: isNaN(Number(businessId)) ? businessId : Number(businessId),
      }),
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "Unexpected response from payment provider.", raw: text };
    }

    const success = json["success"] === true || json["status"] === "success";
    const txn =
      (json["transaction_id"] as string | undefined) ??
      (json["transactionId"] as string | undefined) ??
      (json["id"] as string | undefined);

    if (!res.ok || !success || !txn) {
      return {
        ok: false,
        error: (json["message"] as string) || (json["error"] as string) || "Could not start the M-Pesa prompt.",
        raw: json,
      };
    }
    return { ok: true, transactionId: String(txn), raw: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error contacting payment provider." };
  }
}

export type ProviderStatus = "pending" | "success" | "failed" | "cancelled" | "unknown";

export function mapStatus(value: unknown): ProviderStatus {
  const s = String(value ?? "").toLowerCase();
  if (["success", "completed", "complete", "paid", "confirmed", "1"].includes(s)) return "success";
  if (["failed", "error", "declined", "insufficient"].includes(s)) return "failed";
  if (["cancelled", "canceled", "timeout", "expired"].includes(s)) return "cancelled";
  if (["pending", "processing", "initiated", "0"].includes(s)) return "pending";
  return "unknown";
}

export async function fetchProviderStatus(transactionId: string): Promise<ProviderStatus> {
  const apiKey = process.env["LIPALINK_API_KEY"];
  if (!apiKey) return "unknown";
  try {
    const res = await fetch(`${STATUS_URL}?transaction_id=${encodeURIComponent(transactionId)}`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!res.ok) return "unknown";
    const json = (await res.json()) as Record<string, unknown>;
    return mapStatus(json["status"] ?? json["payment_status"] ?? json["state"]);
  } catch {
    return "unknown";
  }
}
