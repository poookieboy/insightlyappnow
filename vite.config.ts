import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },

    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
      },
    },

    prerender: {
      enabled: false,
    },
  },
});
