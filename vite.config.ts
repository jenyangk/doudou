import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@client": resolve(__dirname, "src/client"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  root: ".",
  build: {
    outDir: "dist/client",
    emptyDirFirst: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
