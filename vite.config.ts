// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  
  // --- CORREÇÃO ---
  // A regra 'optimizeDeps' foi removida,
  // pois não vamos mais usar a importação de ícones que causava o problema.
  // --- FIM DA CORREÇÃO ---

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));