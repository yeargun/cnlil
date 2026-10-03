# Current comparison with the original

Default cn class-merging runtime with its data tables. The original and candidate expose matching cn, clsx, twJoin and twMerge entry names. Custom-config compiler, CLI and public engine construction are outside this boundary.

Each compression row uses a separate LilScript compilation targeting that objective. Original results are the smallest of Terser, esbuild and Oxc for the named codec.

| Objective | LilScript bytes | Original minified bytes | Original minifier | LilScript build (s) | Original bundle + minify (s) |
|---|---:|---:|---|---:|---:|
| raw | 26,427 | 26,617 | Oxc | 14.595 | 0.181 |
| gzip | 10,431 | 10,493 | Oxc | 9.080 | 0.181 |
| brotli | 9,262 | 9,288 | Oxc | 12.989 | 0.181 |

Original version: `cn@0.2.4`. gzip level 9; Brotli quality 11/window 22. Each time is one sequential fresh-output build on the recorded shared machine. Original timing starts from installed ESM and does not include the original repository’s TypeScript compilation. Dependency installation, tests and final file compression are excluded.

Validation: 1,249,074 checks across raw, gzip and Brotli main entries. This does not cover every package format or establish complete upstream API equivalence.

[Artifacts, hashes and settings](site/comparison.json) · [Commands, source identities and timings](site/comparison-builds.json) · [Exact checked source inputs](site/comparison-artifacts/sources.tar.gz).
