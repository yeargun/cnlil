import { mkdirSync, writeFileSync } from "node:fs"
import { brotliCompressSync, constants, gzipSync } from "node:zlib"
import { resolve } from "node:path"
import { build } from "esbuild"

const root = resolve(import.meta.dirname, "..")

async function bundle(path) {
  const result = await build({
    entryPoints: [path],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: true,
    legalComments: "none",
    write: false,
  })
  return result.outputFiles[0].contents
}

function sizes(bytes) {
  return {
    raw: bytes.length,
    gzip9: gzipSync(bytes, { level: 9 }).length,
    brotli11: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  }
}

const lil = await bundle(resolve(root, "dist/index.js"))
const official = await bundle(resolve(root, "node_modules/cn/dist/index.js"))
const report = {
  generatedAt: new Date().toISOString(),
  boundary: "browser ESM bundle of the default entry, esbuild 0.25.12 minify, ES2022",
  upstreamCommit: "c003999e2456266c1b0e9d8ed4e2ca855d5eb38f",
  lil: sizes(lil),
  official: sizes(official),
}
report.ratio = {
  raw: report.lil.raw / report.official.raw,
  gzip9: report.lil.gzip9 / report.official.gzip9,
  brotli11: report.lil.brotli11 / report.official.brotli11,
}
console.table({ lil: report.lil, official: report.official, ratio: report.ratio })
if (process.argv.includes("--write")) {
  mkdirSync(resolve(root, "reports"), { recursive: true })
  writeFileSync(resolve(root, "reports/sizes.json"), JSON.stringify(report, null, 2) + "\n")
}
