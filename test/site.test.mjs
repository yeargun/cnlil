import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"

const root = resolve(import.meta.dirname, "..")
test("site follows the sibling evidence-lab contract", () => {
  for (const file of ["index.html", "app.js", "styles.css", "results.json", "cn.js", "official.js", ".nojekyll"]) assert.equal(existsSync(resolve(root, "_site", file)), true, file)
  const html = readFileSync(resolve(root, "_site/index.html"), "utf8")
  assert.match(html, /class="scoreboard"/)
  assert.match(html, /id="performance"/)
  assert.match(html, /id="lab"/)
  assert.match(html, /id="evidence"/)
})
