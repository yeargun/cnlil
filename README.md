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

- 56,353 upstream correctness cases
- 300,000 seeded grammar-fuzz cases
- 60,005 joining and `clsx` cases
- 416,358 total comparisons, zero mismatches
- `int`, `bool`, `Int32Array`, `Uint8Array`, typed maps, and typed classes throughout the engine
- no runtime dependencies

This is a default-runtime milestone, not yet a full package-surface replacement. The upstream custom-config compiler, `cn/config`, `cn/compiler`, CLI, and compatible public `createEngine` API are not implemented. The benchmark target is also not yet met on every workload: the committed [isolated-process report](reports/benchmark.json) is authoritative and the Pages site deliberately displays regressions.

## Reproduce

The LilScript compiler is expected at `../lilscript`.

```sh
npm ci
npm test
npm run bench
npm run measure
npm run check:site
```

`vendor/cn` is an exact git submodule pin. `scripts/generate-tables.mjs` deterministically converts its generated TypeScript tables into typed LilScript data; `scripts/check-generated.mjs` verifies drift. Production artifacts use `lilscript.toml`; the faster local compile uses `lilscript.dev.toml`.

## Layout

- `src/engine.lil` — merge engine, validators, caches, `clsx`, and `twJoin`
- `src/default.lil` — the specialized default `cn` and `twMerge` instance
- `src/tables.lil` — generated typed table representation
- `scripts/test-upstream.mjs` — upstream suite plus deterministic differential fuzzing
- `scripts/bench.mjs` — upstream isolated-process benchmark harness
- `site/` — the shared evidence-lab GitHub Pages presentation

MIT. See [NOTICE.md](NOTICE.md) for attribution.
