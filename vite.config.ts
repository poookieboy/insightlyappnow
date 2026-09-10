import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
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
