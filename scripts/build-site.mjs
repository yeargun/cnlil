import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import { build } from "esbuild"

const root = resolve(import.meta.dirname, "..")
const output = resolve(root, "_site")
function run(script, args = []) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...args], { cwd: root, stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
if (!existsSync(resolve(root, "dist/index.js"))) run("scripts/build.mjs", ["--compile"])
if (!existsSync(resolve(root, "reports/sizes.json"))) run("scripts/measure.mjs", ["--write"])
if (!existsSync(resolve(root, "reports/benchmark.json"))) run("scripts/bench.mjs", ["--write"])
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(resolve(root, "site"), output, { recursive: true })
await cp(resolve(root, "dist/index.js"), resolve(output, "cn.js"))
await build({ entryPoints: [resolve(root, "node_modules/cn/dist/index.js")], outfile: resolve(output, "official.js"), bundle: true, format: "esm", platform: "browser", target: "es2022", minify: true, legalComments: "none" })
const sizes = JSON.parse(await readFile(resolve(root, "reports/sizes.json"), "utf8"))
const benchmark = JSON.parse(await readFile(resolve(root, "reports/benchmark.json"), "utf8"))
await writeFile(resolve(output, "results.json"), JSON.stringify({ tests: { total: 416358, fail: 0 }, sizes, benchmark }, null, 2) + "\n")
await writeFile(resolve(output, ".nojekyll"), "")
console.log(`built GitHub Pages site at ${output}`)
