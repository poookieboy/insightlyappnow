// Modified: route OAuth sign-in through Supabase so the app doesn't open the Lovable consent flow for sign-in.
// We keep Lovable available for AI and other features, but delegate OAuth sign-ins to Supabase.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    // WARNING: This intentionally delegates sign-in to Supabase to avoid using Lovable's
    // cloud-auth-js for user sign-ins. This keeps Lovable available for AI features while
    // ensuring Google sign-in is handled by your Supabase configuration and OAuth client.
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      try {
        // Use Supabase's OAuth flow. The return shape is { data, error } and may include data.url for redirects.
        const res = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: { redirectTo: opts?.redirect_uri },
        } as any);
        return res as any;
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
