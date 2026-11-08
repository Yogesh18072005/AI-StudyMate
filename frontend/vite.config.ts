import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "VITE_");
  return {
    plugins: [react()],
    server: {
      host: env.VITE_FRONTEND_HOST || "localhost",
      port: Number(env.VITE_FRONTEND_PORT) || 5173,
    },
    preview: {
      host: env.VITE_FRONTEND_HOST || "localhost",
      port: Number(env.VITE_FRONTEND_PORT) || 4173,
    },
    envDir: path.resolve(__dirname, ".."),
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("/node_modules/")) return;

            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("/react-markdown/") ||
              id.includes("/rehype-") ||
              id.includes("/remark-") ||
              id.includes("/highlight.js/") ||
              id.includes("/katex/")
            ) {
              return "markdown-vendor";
            }

            if (id.includes("/d3-force/")) {
              return "visualization-vendor";
            }

            if (id.includes("/@cognicatch/")) {
              return "cognicatch-vendor";
            }
          },
        },
      },
    },
  };
});
