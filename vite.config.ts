import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },

    spa: {
      enabled: true,
    },

    prerender: {
      enabled: false,
    },
  },

  nitro: {
    preset: "node-server",
    prerender: {
      enabled: false,
      crawlLinks: false,
      routes: [],
    },
    output: {
      dir: "dist",
      serverDir: "dist/server",
      publicDir: "dist/client",
    },
    noExternalDirs: true,
  },
});
