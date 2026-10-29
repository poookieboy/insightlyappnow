import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { SERVICE_CONFIG } from "./src/lib/service-config";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

// Preserve the existing external Supabase configuration.
const externalConnection = {
  envDefine: false,
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_PROJECT_ID":
        JSON.stringify(SERVICE_CONFIG.projectId),
      "import.meta.env.VITE_SUPABASE_URL":
        JSON.stringify(SERVICE_CONFIG.url),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
        JSON.stringify(SERVICE_CONFIG.publishableKey),
    },
  },
};

// Use SPA mode for both web and Capacitor builds.
const tanstackStart = {
  spa: {
    enabled: true,
    prerender: {
      outputPath: "/index.html",
      crawlLinks: false,
      retryCount: 0,
    },
  },
};

export default defineConfig(
  isCapacitorBuild
    ? {
        ...externalConnection,
        nitro: false,
        tanstackStart,
      }
    : {
        ...externalConnection,
        tanstackStart,
      },
);
