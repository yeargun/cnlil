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

// A lane is measured as ROUNDS interleaved pairs, the order flipped on odd rounds, and the
// reported ratio is the median of the per-round ratios rather than a ratio of two independent
// runs. One pass of each implementation is not a comparison on a shared machine: the two runs
// see different cache and frequency states, and the spread between rounds is wider than the
// difference being measured. The range is reported beside the median so a wide lane is visible.
const ROUNDS = Number(process.env.BENCH_ROUNDS ?? 5)
const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1]

function lane(kind, workload) {
  const runLil = () => kind === "merge"
    ? run(worker, [`cn:${resolve(root, "dist")}`, workload]).nsPerOp
    : run(componentWorker, ["cnlil", workload]).nsPerOp
  const runOfficial = () => kind === "merge"
    ? run(worker, ["cn", workload]).nsPerOp
    : run(componentWorker, ["cn", workload]).nsPerOp
  const lil = []
  const official = []
  for (let round = 0; round < ROUNDS; round++) {
    if (round % 2 === 0) { lil.push(runLil()); official.push(runOfficial()) }
    else { official.push(runOfficial()); lil.push(runLil()) }
  }
  const ratios = lil.map((value, index) => value / official[index])
  return {
    kind,
    workload,
    lilNs: median(lil),
    officialNs: median(official),
    ratio: median(ratios),
    ratioLow: Math.min(...ratios),
    ratioHigh: Math.max(...ratios),
    rounds: ROUNDS,
  }
}

const rows = []
try {
  for (const workload of workloads) rows.push(lane("merge", workload))
  for (const workload of modes) rows.push(lane("component", workload))
} finally {
  rmSync(componentWorker, { force: true })
}

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  upstreamCommit: "c003999e2456266c1b0e9d8ed4e2ca855d5eb38f",
  rounds: ROUNDS,
  methodology: `upstream isolated-process harness; per run 25% warmup and best of five measured blocks; ${ROUNDS} interleaved rounds per lane, reported as the median of the per-round ratios with its range`,
  rows,
}

console.table(rows.map((row) => ({
  lane: `${row.kind}:${row.workload}`,
  lil_ns: row.lilNs.toFixed(1),
  official_ns: row.officialNs.toFixed(1),
  ratio: row.ratio.toFixed(2),
  range: `${row.ratioLow.toFixed(2)}-${row.ratioHigh.toFixed(2)}`,
})))
if (process.argv.includes("--write")) {
  mkdirSync(resolve(root, "reports"), { recursive: true })
  writeFileSync(resolve(root, "reports/benchmark.json"), JSON.stringify(report, null, 2) + "\n")
}
