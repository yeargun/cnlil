import {
  accessSync,
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const lilscriptRoot = process.env.LILSCRIPT_ROOT ?? resolve(root, "..", "lilscript")
const dist = resolve(root, "dist")
// No in-file banner: the MIT notice ships as LICENSE and NOTICE.md in the package
// `files` list, and 65 bytes of unique comment text costs 36 Brotli in the artifact.

function compilerPath() {
  const candidates = [
    process.env.LILSCRIPT_COMPILER,
    resolve(lilscriptRoot, "target/release/lilscript"),
    resolve(lilscriptRoot, "target/debug/lilscript"),
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {}
  }
  return null
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (process.argv.includes("--compile") || !existsSync(resolve(dist, "cn.raw.js"))) {
  const compiler = compilerPath()
  if (!compiler) throw new Error("LilScript compiler not found; set LILSCRIPT_COMPILER")
  run(process.execPath, [resolve(root, "scripts/generate-tables.mjs")])
  mkdirSync(dist, { recursive: true })
  run(compiler, [
    resolve(root, "src/index.lil"),
    "--target", "js-module",
    "--config", resolve(root, "lilscript.toml"),
    "-o", resolve(dist, "cn.raw.js"),
  ])
  run(compiler, [
    resolve(root, "src/lite.lil"),
    "--target", "js-module",
    "--config", resolve(root, "lilscript.toml"),
    "-o", resolve(dist, "lite.raw.js"),
  ])
}

writeFileSync(resolve(dist, "index.js"), readFileSync(resolve(dist, "cn.raw.js"), "utf8").trimEnd() + "\n")
writeFileSync(resolve(dist, "lite.js"), readFileSync(resolve(dist, "lite.raw.js"), "utf8").trimEnd() + "\n")

// The CommonJS entry is the ESM output with its export clause rewritten, not an esbuild
// re-bundle. esbuild emits getter-based live bindings (__export/__copyProps/__toCommonJS),
// which is 2371 raw bytes and 524 Brotli of scaffolding this package cannot use: the compiler
// assigns each exported binding exactly once inside its own IIFE and never rebinds it, so plain
// property assignment is observably identical. The guard below keeps that assumption honest --
// if the compiler ever emits a real import, or anything but the single trailing export clause,
// the build fails instead of silently producing a broken .cjs.
for (const entry of ["index", "lite"]) {
  const source = readFileSync(resolve(dist, `${entry}.js`), "utf8").trimEnd()
  const clause = source.match(/export\s*\{([^}]*)\}\s*;?\s*$/)
  if (!clause) throw new Error(`${entry}.js: no trailing export clause to rewrite for CommonJS`)
  const body = source.slice(0, clause.index)
  if (/(^|[;}\s])(?:import\s*[({*'"`]|export\s)/.test(body)) {
    throw new Error(`${entry}.js: module syntax before the export clause; restore the esbuild CJS step`)
  }
  const assignments = clause[1]
    .split(",")
    .map((pair) => pair.trim().split(/\s+as\s+/))
    .map(([local, exported = local]) => `exports.${exported}=${local};`)
    .join("")
  writeFileSync(
    resolve(dist, `${entry}.cjs`),
    `${body}Object.defineProperty(exports,"__esModule",{value:!0});${assignments}\n`,
  )
}

copyFileSync(resolve(root, "types/index.d.ts"), resolve(dist, "index.d.ts"))
copyFileSync(resolve(root, "types/lite.d.ts"), resolve(dist, "lite.d.ts"))
console.log("wrote dist/index.js, dist/index.cjs, dist/lite.js, and dist/lite.cjs")
