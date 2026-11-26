// main.ts — entry point. Copies the rendered front page (entry.png)
// into the output directory. Stdlib only, no network, no assets.
// Run: MAKEFUN_OUTPUT_DIR=out node main.ts
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || join(dir, "out");
mkdirSync(out, { recursive: true });
const src = join(dir, "entry.png");
if (!existsSync(src)) {
  console.error("entry.png missing; build it first: node render.mjs");
  process.exit(1);
}
copyFileSync(src, join(out, "entry.png"));
const bytes = statSync(join(out, "entry.png")).size;
console.log("wrote " + join(out, "entry.png") + " (" + bytes + " bytes)");
