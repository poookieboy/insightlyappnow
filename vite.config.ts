import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig((config) => {
  const isBuild = config.command === "build";

  const baseConfig = {
    tanstackStart: {
      spa: {
        enabled: true,
        outputPath: "/index.html",
      },
      prerender: {
        enabled: false,
      },
    },
  };

  if (!isBuild) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    plugins: [],
  };
});
