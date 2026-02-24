import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: 2026,
  },
  assetsInclude: ["**/*.jpg", "**/*.png", "**/*.jpeg", "**/*.gif", "**/*.gltf", "**/*.svg"],
  build: {
    assetsDir: "assets",
    outDir: "build",
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
