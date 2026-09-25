#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { createJiti } from "jiti";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

if (fs.existsSync(path.join(rootDir, ".env.local"))) {
  dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
} else if (fs.existsSync(path.join(rootDir, ".env"))) {
  dotenv.config({ path: path.join(rootDir, ".env"), override: true });
}

const jiti = createJiti(import.meta.url, {
  fsCache: false,
  alias: {
    "@": path.join(rootDir, "src"),
    "server-only": path.join(rootDir, "node_modules/server-only/empty.js"),
  },
});

async function main() {
  const cliModule = await jiti.import(path.join(rootDir, "src/cli/index.ts"));
  const exitCode = await cliModule.runCli(process.argv.slice(2));
  if (typeof exitCode === "number" && exitCode !== 0) {
    process.exit(exitCode);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
