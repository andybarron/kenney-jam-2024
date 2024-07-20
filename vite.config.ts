import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: Infinity,
    outDir: "node_modules/.vite",
    target: "esnext",
  },
  plugins: [
    tailwindcss(),
    react(),
    // @ts-expect-error something's grumpy
    ViteMinifyPlugin(),
  ],
  assetsInclude: ["**/*.tmx", "assets/**/*.tsx"],
  resolve: {
    alias: {
      "~": import.meta.dirname,
    },
  },
});
