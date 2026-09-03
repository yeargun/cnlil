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
import { build as esbuild } from "esbuild"

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

for (const entry of ["index", "lite"]) {
  await esbuild({
    entryPoints: [resolve(dist, `${entry}.js`)],
    outfile: resolve(dist, `${entry}.cjs`),
    bundle: true,
    format: "cjs",
    platform: "neutral",
    target: "es2022",
    legalComments: "none",
    minifyWhitespace: true,
    minifyIdentifiers: false,
    minifySyntax: false,
    logLevel: "error",
  })
}

copyFileSync(resolve(root, "types/index.d.ts"), resolve(dist, "index.d.ts"))
copyFileSync(resolve(root, "types/lite.d.ts"), resolve(dist, "lite.d.ts"))
console.log("wrote dist/index.js, dist/index.cjs, dist/lite.js, and dist/lite.cjs")
