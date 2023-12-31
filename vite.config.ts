import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "./vite-plugin-express";

console.log(process.env);

const base =
  process.env["GITHUB_ACTIONS"] === "true"
    ? `/${process.env["GITHUB_REPOSITORY"].split("/")[1]}/`
    : "/";
const port = 3000;

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(rootDir, "./src");
const distDir = resolve(rootDir, "./dist");
const publicDir = resolve(rootDir, "./public");
const frontendDir = resolve(srcDir, "./frontend");
const backendDir = resolve(srcDir, "./backend");

// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  root: frontendDir,
  publicDir: publicDir,
  envDir: rootDir,
  server: {
    host: true,
    port: port,
    strictPort: true,
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
  },
  plugins: [react(), express(backendDir)],
});
