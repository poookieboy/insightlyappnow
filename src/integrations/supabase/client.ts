
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    if (typeof window === "undefined") {
      return null as unknown as ReturnType<
        typeof createClient<Database>
      >;
    }

    throw new Error(
      "Missing Supabase environment variables. Check your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY settings."
    );
  }

  const storage = Capacitor.isNativePlatform()
    ? {
        getItem: async (key: string) => {
          const result = await Preferences.get({ key });
          return result.value;
        },

        setItem: async (key: string, value: string) => {
          await Preferences.set({ key, value });
        },

        removeItem: async (key: string) => {
          await Preferences.remove({ key });
        },
      }
    : brokeredPreviewStorage();

  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
      },
    }
  );
}

let _supabase:
  | ReturnType<typeof createSupabaseClient>
  | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createSupabaseClient>,
  {
    get(_, prop, receiver) {
      if (!_supabase) {
        _supabase = createSupabaseClient();
      }

      return Reflect.get(_supabase, prop, receiver);
    },
  }
);
