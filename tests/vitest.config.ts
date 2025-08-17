import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
