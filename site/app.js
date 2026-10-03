import {renderComparison} from './objective-comparison.js';
const comparison=await fetch('./comparison.json').then(r=>{if(!r.ok)throw Error('Comparison failed to load');return r.json()});
renderComparison(comparison);
const lil=await import('./cn.js'),official=await import('./official.js');
const ratio=value=>value.toFixed(2)+'×';
const samples = [
  "px-2 py-1 px-4",
  "hover:md:p-2 md:hover:p-4 focus:p-3",
  "text-sm/6 leading-8 text-lg/7",
  "[color:red] [color:blue] p-[3px] p-4",
]
const source = document.querySelector("#source")
const output = document.querySelector("#output")
document.querySelector("#samples").innerHTML = samples.map((sample, i) => `<button type="button" data-sample="${i}">case ${i + 1}</button>`).join("")

function render() {
  const input = source.value
  const a = lil.cn(input)
  const b = official.cn(input)
  output.textContent = `LilScript\n${a}\n\nofficial cn\n${b}\n\n${a === b ? "✓ byte-for-byte match" : "✗ mismatch"}`
}
source.value = samples[0]
source.addEventListener("input", render)
document.querySelector("#samples").addEventListener("click", (event) => {
  const button = event.target.closest("[data-sample]")
  if (!button) return
  source.value = samples[Number(button.dataset.sample)]
  render()
})
document.querySelector("#race").addEventListener("click", () => {
  const input = source.value
  for (let i = 0; i < 10_000; i++) { lil.cn(input); official.cn(input) }
  const run = (fn) => { const start = performance.now(); for (let i = 0; i < 100_000; i++) fn(input); return performance.now() - start }
  const l = run(lil.cn)
  const o = run(official.cn)
  document.querySelector("#race-out").textContent = `Lil ${l.toFixed(1)} ms · official ${o.toFixed(1)} ms · ${ratio(l / o)}`
})
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]")
  if (!button) return
  await navigator.clipboard.writeText(button.dataset.copy)
  button.textContent = "copied"
  setTimeout(() => { button.textContent = "copy" }, 1200)
})
const progress = document.querySelector(".progress")
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
}, { passive: true })
render()
