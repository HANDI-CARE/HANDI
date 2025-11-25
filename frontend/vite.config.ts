import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type UserConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const config: UserConfig = {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
    server: {
      port: 3000,
    },
  };

  // Vite Proxy를 사용할 경우 여기서 Base URL 설정
  // 아닐 경우 `httpClient.ts`에서 설정
  if (env.VITE_USE_PROXY === "1") {
    config.server!.proxy = {
      "/api": {
        target: env.VITE_API_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/mock-oauth": {
        target: env.VITE_API_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    };
  }

  return config;
});
