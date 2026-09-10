import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  // GitHub Actions only needs a static web bundle for Capacitor.
  // Keep Lovable's normal Nitro setup outside GitHub Actions.
  nitro: isGitHubActions ? false : undefined,

  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        crawlLinks: false,
        retryCount: 0,
      },
    },
  },
});
