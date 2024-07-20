import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: Infinity,
    outDir: "node_modules/.vite",
    target: "esnext",
  },
  plugins: [tailwindcss(), react()],
  assetsInclude: ["**/*.tmx", "assets/**/*.tsx"],
  resolve: {
    alias: {
      "~": import.meta.dirname,
    },
  },
});
