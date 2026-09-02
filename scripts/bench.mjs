import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const worker = resolve(root, "vendor/cn/packages/conformance/bench/worker-ab.mjs")
const componentSource = resolve(root, "vendor/cn/packages/conformance/bench/component-worker.mjs")
const componentWorker = resolve(root, "vendor/cn/packages/conformance/bench/.cnlil-component-worker.mjs")
const workloads = ["short", "long", "arb", "repeat", "ssr", "workset"]
const modes = ["single", "loop", "dup-loop"]

const component = readFileSync(componentSource, "utf8").replace(
  'if (implName === "cn") return (await import("cn")).cn',
  'if (implName === "cn") return (await import("cn")).cn\n  if (implName === "cnlil") return (await import("../../../../../dist/index.js")).cn'
)
writeFileSync(componentWorker, component)

function run(script, args) {
  const output = execFileSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" })
  return JSON.parse(output.trim().split("\n").at(-1))
}

const rows = []
try {
  for (const workload of workloads) {
    const lil = run(worker, [`cn:${resolve(root, "dist")}`, workload])
    const official = run(worker, ["cn", workload])
    rows.push({ kind: "merge", workload, lilNs: lil.nsPerOp, officialNs: official.nsPerOp, ratio: lil.nsPerOp / official.nsPerOp })
  }
  for (const workload of modes) {
    const lil = run(componentWorker, ["cnlil", workload])
    const official = run(componentWorker, ["cn", workload])
    rows.push({ kind: "component", workload, lilNs: lil.nsPerOp, officialNs: official.nsPerOp, ratio: lil.nsPerOp / official.nsPerOp })
  }
} finally {
  rmSync(componentWorker, { force: true })
}

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  upstreamCommit: "c003999e2456266c1b0e9d8ed4e2ca855d5eb38f",
  methodology: "upstream isolated-process harness; per row 25% warmup and best of five measured blocks",
  rows,
}

console.table(rows.map((row) => ({ lane: `${row.kind}:${row.workload}`, lil_ns: row.lilNs.toFixed(1), official_ns: row.officialNs.toFixed(1), ratio: row.ratio.toFixed(2) })))
if (process.argv.includes("--write")) {
  mkdirSync(resolve(root, "reports"), { recursive: true })
  writeFileSync(resolve(root, "reports/benchmark.json"), JSON.stringify(report, null, 2) + "\n")
}
