import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const before = readFileSync(resolve(root, "src/tables.lil"), "utf8")
const result = spawnSync(process.execPath, [resolve(root, "scripts/generate-tables.mjs")], { cwd: root, stdio: "inherit" })
if (result.status !== 0) process.exit(result.status ?? 1)
const after = readFileSync(resolve(root, "src/tables.lil"), "utf8")
if (before !== after) throw new Error("src/tables.lil was stale")
console.log("generated table source is current")
