import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

export default defineConfig(
  isCapacitorBuild
    ? {
        nitro: false,

        tanstackStart: {
          spa: {
            enabled: true,
            prerender: {
              outputPath: "/index.html",
              crawlLinks: false,
              retryCount: 0,
            },
          },
        },
      }
    : {
        tanstackStart: {
          spa: {
            enabled: true,
          },
        },

        nitro: {
          preset: "node-server",

          output: {
            dir: "dist",
            serverDir: "dist/server",
            publicDir: "dist/client",
          },

          noExternalDirs: true,
        },
      },
);
