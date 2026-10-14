import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "back-chat",
    },
    outDir: "../wwwroot/App_Plugins/BackChat",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Umbraco and our own packages are provided by the backoffice at runtime
      external: [/^@umbraco/, /^@jumoo/],
    },
  },
});
