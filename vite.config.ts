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
  
  // --- INÍCIO DA CORREÇÃO ---
  // Força o Vite a não pré-otimizar o 'lucide-react'.
  // Isto resolve o erro 'does not provide an export named TreasureChest'.
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // --- FIM DA CORREÇÃO ---

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));