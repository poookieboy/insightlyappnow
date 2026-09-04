import baseDefineConfig from "@lovable.dev/vite-tanstack-config";
import { defineConfig as viteDefineConfig } from "vite";

// Wrap the lovable wrapper's config and filter out the preview/prerender plugin during `vite build`.
// Reason: @tanstack/start-plugin-core registers a preview-server/prerender plugin that still
// runs during `vite build` and expects an older `dist/server/server.js` layout. Filtering the
// plugin at the Vite config layer prevents it from executing while preserving the Nitro build
// (which produces .output/public and .output/server/*).

function isPreviewOrPrerenderPlugin(p: any) {
  if (!p) return false;
  const name = (p.name || "").toString().toLowerCase();
  if (!name) return false;
  // match common/plugin-specific names that indicate the preview/prerender plugin
  return (
    name.includes("preview") ||
    name.includes("prerender") ||
    name.includes("preview-server") ||
    name.includes("preview-server-plugin") ||
    name.includes("start-plugin-core") ||
    name.includes("@tanstack/start-plugin-core")
  );
}

function filterPluginsInConfig(cfg: any) {
  if (!cfg) return cfg;
  const plugins = cfg.plugins || [];
  cfg.plugins = plugins.filter((p: any) => !isPreviewOrPrerenderPlugin(p));
  return cfg;
}

export default viteDefineConfig(({ command, mode }) => {
  const base = baseDefineConfig({
    tanstackStart: {
      server: {
        entry: "server",
      },
      spa: {
        enabled: true,
      },
    },
  } as any);

  // base may be a function or an object. Handle both cases.
  if (typeof base === "function") {
    return async (env: any) => {
      const res = await base(env);
      if (env?.command === "build") {
        return filterPluginsInConfig(res);
      }
      return res;
    };
  }

  if (command === "build") {
    filterPluginsInConfig(base);
  }

  return base as any;
});
