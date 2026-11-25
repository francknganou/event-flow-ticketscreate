import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
<<<<<<< HEAD
=======
import { componentTagger } from "lovable-tagger";
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
<<<<<<< HEAD
  plugins: [react()],
=======
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
