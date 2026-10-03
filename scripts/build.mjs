import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
import {buildPackage} from './compiler-package.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const generated = spawnSync(process.execPath, ['scripts/generate-tables.mjs'], {cwd:root, stdio:'inherit'})
if (generated.status !== 0) throw Error('Class table generation failed')
await buildPackage({root, profiles:[{name:'public', config:'lilscript.toml'}],
  aliases:{'cn.raw.js':'index.js','lite.raw.js':'lite.js'},
  assets:[{source:'types/index.d.ts',destination:'index.d.ts'},{source:'types/lite.d.ts',destination:'lite.d.ts'}]})
