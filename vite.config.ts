import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    spa: {
      enabled: true,

      prerender: {
        enabled: false,
        crawlLinks: false,
        retryCount: 0,
      },
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
