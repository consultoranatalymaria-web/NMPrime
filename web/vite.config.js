import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração para travar a porta da Web em 5175
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true, // Se a porta 5175 estiver ocupada, ele avisa em vez de criar a 5176
  },
});
