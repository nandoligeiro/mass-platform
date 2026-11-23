import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const developmentKey = env.LOCAL_DEV_API_KEY;
  if (mode === "development" && !developmentKey) {
    throw new Error("Set LOCAL_DEV_API_KEY in frontend/.env.local (local development only)");
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (request) => {
              request.setHeader("X-API-Key", developmentKey ?? "");
            });
          }
        }
      }
    }
  };
});
