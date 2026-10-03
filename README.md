# @itslil/cn

The default class-merging runtime from cn 0.2.4 implemented in LilScript, including its generated tables. Upstream is pinned by the vendor/cn submodule.

[Live comparison and examples](https://yeargun.github.io/cnlil/) · [Checked repository package](https://yeargun.github.io/cnlil/downloads/package.tgz) · [Package build evidence](https://yeargun.github.io/cnlil/package-build.json)

```sh
npm install https://yeargun.github.io/cnlil/downloads/package.tgz
```

```js
import {cn, clsx, twJoin, twMerge} from "@itslil/cn"
cn("px-2 py-1", false, "px-4")
```

The repository download contains the checked build of this checkout. npm publication is independent; an npm install can resolve a different published snapshot.

## Comparison with the original

[Current raw, gzip and Brotli results and build times](COMPARISON.md) compare three independently targeted LilScript compilations with the smallest recorded original result for each codec from Terser, esbuild and Oxc. Exact bytes, configuration hashes, source inputs and commands are downloadable from the comparison page. Package formats and browser application bundles have different boundaries from the standalone comparison entries.

## Compatibility and scope

The upstream custom-config compiler, cn/config, cn/compiler, CLI and public createEngine API are outside this runtime. The checked package runs upstream correctness, seeded grammar fuzzing and joining tests. These checks cover the default-runtime boundary.

## Rebuild and verify

Set `LILSCRIPT_COMPILER` to the current LilScript executable. Builds use one compiler job at a time.

```sh
npm ci
npm run build
npm test
npm run check:site
```

See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md) for licensing and upstream attribution.
