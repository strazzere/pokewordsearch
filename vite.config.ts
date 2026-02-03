import { defineConfig } from "vite";

export default defineConfig({
  base: "/poke-search/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
