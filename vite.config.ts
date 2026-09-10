import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    prerender: {
      enabled: true,
      crawlLinks: false,
      retryCount: 0,
    },
    pages: [
      {
        path: "/",
        prerender: {
          enabled: true,
          outputPath: "/index.html",
        },
      },
    ],
  },
});
