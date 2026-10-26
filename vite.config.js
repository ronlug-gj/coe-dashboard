import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = (path) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Relative asset paths so the build works when hosted from a subfolder.
  base: "./",
  // `--mode demo` swaps in the dummy พ.ค. 2573 dataset; each build bundles only one dataset.
  resolve: {
    alias: mode === "demo"
      ? { "@data": src("demo/data.js"), "@works": src("demo/works.js") }
      : { "@data": src("data.js"), "@works": src("works.js") },
  },
}));
