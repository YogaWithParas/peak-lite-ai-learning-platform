import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // No @vitejs/plugin-react needed -- Vitest 4's built-in oxc transform
  // handles JSX automatically (the app itself still builds via Next/Turbopack).
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
})
