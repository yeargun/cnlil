# @itslil/cn

The default runtime from [`cn@0.2.4`](https://github.com/shadcn-ui/cn) rewritten in LilScript, pinned to upstream commit `c003999e2456266c1b0e9d8ed4e2ca855d5eb38f`. It preserves the upstream radix trie, span validators, conflict pass, doorkeeper, two-generation string cache, argument cache, and joining behavior. Not affiliated with upstream.

**Evidence site:** [yeargun.github.io/cnlil](https://yeargun.github.io/cnlil/)

```sh
npm install github:yeargun/cnlil
```

```js
import { cn, clsx, twJoin, twMerge } from "@itslil/cn"

cn("px-2 py-1", false, "px-4") // "py-1 px-4"
```

## Current result

- 56,353 upstream correctness cases, 300,000 seeded grammar-fuzz cases, 60,005 joining and
  `clsx` cases: 416,358 comparisons, zero mismatches
- benchmarked against upstream in seven interleaved rounds on an idle machine, reported as the
  median of the per-round ratios with its range: `arb` 0.96, `long` 0.97, `ssr` 0.99, `short`
  1.00, `repeat` and `workset` 1.01, `single` 1.04, `loop` and `dup-loop` 1.06
- smaller than upstream's own esbuild-minified bundle under raw, gzip and Brotli at the same
  boundary ([sizes report](reports/sizes.json); the canonical `lilscript-codec` numbers are
  26,696 / 10,509 / 9,401 against 27,459 / 10,835 / 9,783)
- `int`, `bool`, `Int32Array`, `Uint8Array`, `Float64Array`, typed maps and typed records
  throughout the engine; the engine state is module bindings, the shape upstream's closure has,
  and the hashes are `Math.imul` like upstream's
- no runtime dependencies

This is a default-runtime milestone, not yet a full package-surface replacement. The upstream
custom-config compiler, `cn/config`, `cn/compiler`, CLI, and compatible public `createEngine` API
are not implemented. The runtime target is not met on every lane: the committed
[isolated-process report](reports/benchmark.json) is authoritative, the Pages site deliberately
displays regressions, and the remaining gap is attributed in the LilScript workstream
(`finer/hypotheses/048-*` and `049-*` in the compiler repository). The two component lanes are the
ones left above parity. The recurring-working-set lane is bimodal on this port: about half its runs
are at parity and half are 30% slower, because the merged output string is a rope until something
forces it flat; that is understood and unfixed.

## Reproduce

The LilScript compiler is expected at `../lilscript`.

```sh
npm ci
npm run test:build
npm run bench
npm run measure
npm run check:site
```

`vendor/cn` is an exact git submodule pin. `scripts/generate-tables.mjs` deterministically converts its generated TypeScript tables into typed LilScript data; `scripts/check-generated.mjs` verifies drift. Production artifacts use `lilscript.toml` (level 13, production candidate search, about 25 s on a 16-thread machine); the faster local compile uses `lilscript.dev.toml`.

## Layout

- `src/engine.lil` — merge engine, validators and the whole-string cache, as module state
- `src/default.lil` — `cn` with its argument cache, `twMerge`, `clsx`, `twJoin`
- `src/tables.lil` — generated typed tables, one binding per table
- `scripts/test-upstream.mjs` — upstream suite plus deterministic differential fuzzing
- `scripts/bench.mjs` — upstream isolated-process benchmark harness
- `site/` — the shared evidence-lab GitHub Pages presentation

MIT. See [NOTICE.md](NOTICE.md) for attribution.

### Running the checks

`npm run test:build` builds the package and runs its tests. After an explicit
`npm run build`, use `npm test` to test those artifacts without rebuilding them.
This also keeps the development and production files available to the same suite.
