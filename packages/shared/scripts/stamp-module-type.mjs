// Both builds emit plain .js, and Node reads their format from the nearest
// package.json. This package declares no "type", so everything under dist/
// would be taken for CommonJS and the ESM build would fail to load. A one-line
// package.json in each output directory says which is which.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

for (const [dir, type] of [
  ["cjs", "commonjs"],
  ["esm", "module"],
]) {
  writeFileSync(join(dist, dir, "package.json"), `{ "type": "${type}" }\n`);
}
