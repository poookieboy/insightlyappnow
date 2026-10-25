import { supabase } from "@/integrations/supabase/client";
import { SERVICE_CONFIG } from "./service-config";

export async function aiRequestHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    apikey: SERVICE_CONFIG.publishableKey,
    ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}