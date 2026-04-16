/**
 * STORESGO TypeScript Register — Node 22 Safe Loader
 * Enables ts-node/esm without --experimental-loader
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("ts-node/esm", pathToFileURL("./"));
console.log("🧩 ts-node ESM loader initialized via register.mjs");
