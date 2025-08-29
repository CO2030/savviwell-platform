import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Replit-specific plugins removed for GitHub Pages build compatibility

export default defineConfig({
  // Use a conditional base so local/server hosting uses "/" while
  // GitHub Pages serves under "/savviwell-platform/".
  base: process.env.GH_PAGES === "true" ? "/savviwell-platform/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});