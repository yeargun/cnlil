import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const tests = resolve(root, "vendor/cn/packages/conformance/tests")

function run(name, transforms, env = {}) {
  const source = readFileSync(resolve(tests, name), "utf8")
  const temporary = resolve(tests, `.cnlil-${name}`)
  let rewritten = source
    .replaceAll('from "cn/lite"', 'from "../../../../../dist/lite.js"')
    .replaceAll('from "cn"', 'from "../../../../../dist/index.js"')
  for (const [pattern, replacement] of transforms) rewritten = rewritten.replace(pattern, replacement)
  writeFileSync(temporary, rewritten)
  const result = spawnSync(process.execPath, [temporary], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  })
  rmSync(temporary, { force: true })
  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run("correctness.mjs", [
  [/import \{ createEngine \} from "cn\/engine"\n/, ""],
  [/import tables from "cn\/tables"\n/, ""],
  [/const uncached = createEngine\(tables, undefined, \{ cacheSize: 0 \}\)\.mergeUncached/, "const uncached = twMerge"],
])
run("fuzz.mjs", [], { FUZZ_ITERS: process.env.FUZZ_ITERS ?? "300000" })
run("join.mjs", [], { JOIN_ITERS: process.env.JOIN_ITERS ?? "20000" })
