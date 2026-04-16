/**
 * ======================================================
 * ⚙️ STORESGO TypeScript Register — Node 22 Safe Loader
 * Enables ts-node/esm for Windows without --experimental-loader
 * ✅ Works with PM2 + Node v22.x + Fastify + Prisma
 * ✅ Handles both Windows & Linux seamlessly
 * ======================================================
 */

// register.js — Node 22-safe ts-node loader initialization
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// ✅ Register ts-node ESM loader dynamically
// This allows Node to execute TypeScript files (.ts) directly
// without the need for `--loader ts-node/esm` flags.
register("ts-node/esm", pathToFileURL("./"));

// ✅ Log once at startup (useful for debugging)
console.log("🧩 ts-node ESM loader initialized successfully via register.js");

