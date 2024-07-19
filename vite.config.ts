import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "node_modules/.vite",
  },
  plugins: [tailwindcss(), react()],
});
