import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Use the regular plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "./runtimeConfig": "./runtimeConfig.browser",
    },
  },
  build: {
    outDir: "build", // Amplify expects 'build' folder
    sourcemap: true, // Optional: helps with debugging
  },
  server: {
    port: 3000,
    open: true, // Optional: opens browser automatically
  },
});
