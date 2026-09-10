import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
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
