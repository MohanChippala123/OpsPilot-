import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("frontend", "dist");
const target = resolve("dist");

if (!existsSync(source)) {
  throw new Error("Expected frontend/dist to exist after frontend build.");
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log("Synced frontend/dist to root dist for Vercel.");
