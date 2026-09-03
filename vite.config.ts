// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Pass a minimal instruction to the wrapper to enable SPA/client-side mode.
  // This tells TanStack Start to emit a static SPA shell (typically .output/public/index.html).
  // Prefer the minimal option so we don't add duplicate plugins.
  tanstackStart: {
    spa: {
      enabled: true,
      // If your installed version supports `outputPath`, prefer it so the generated shell
      // ends up at the top-level index.html inside the public output. If the installed
      // version doesn't support `outputPath` this property will be ignored safely.
      outputPath: "/index.html",
    },
  },
});
