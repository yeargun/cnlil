const data = await fetch("./results.json").then((response) => response.json())
const lil = await import("./cn.js")
const official = await import("./official.js")
const format = new Intl.NumberFormat("en-US")
const ratio = (value) => `${value.toFixed(2)}×`
const ns = (value) => value >= 1000 ? `${(value / 1000).toFixed(2)} µs` : `${value.toFixed(1)} ns`

const warm = data.benchmark.rows.find((row) => row.kind === "merge" && row.workload === "short")
const component = data.benchmark.rows.find((row) => row.kind === "component" && row.workload === "single")
document.querySelector("#hero-tests").innerHTML = `${format.format(data.tests.total)}<span>matching</span>`
document.querySelector("#hero-status").textContent = `${format.format(data.tests.fail)} differential mismatches`
document.querySelector("#hero-warm").textContent = ratio(warm.ratio)
document.querySelector("#hero-component").textContent = ratio(component.ratio)
document.querySelector("#hero-brotli").textContent = ratio(data.sizes.ratio.brotli11)

const cards = [
  ["warm recurring strings", warm],
  ["component call", component],
  ["cold arbitrary values", data.benchmark.rows.find((row) => row.workload === "arb")],
  ["differential cases", { ratio: 1, lilNs: data.tests.total }],
]
document.querySelector("#perf-cards").innerHTML = cards.map(([label, row], index) =>
  `<article class="perf-card ${row.ratio <= 1 ? "win" : ""} ${index === 3 ? "geo" : ""}"><strong>${index === 3 ? format.format(row.lilNs) : ratio(row.ratio)}</strong><span>${label}</span></article>`
).join("")
document.querySelector("#perf-body").innerHTML = data.benchmark.rows.map((row) =>
  `<tr><th>${row.kind}: ${row.workload}</th><td>${ns(row.lilNs)}</td><td>${ns(row.officialNs)}</td><td class="verdict ${row.ratio <= 1 ? "win" : "loss"}"><strong>${ratio(row.ratio)}</strong></td></tr>`
).join("")
document.querySelector("#perf-note").textContent = `${data.benchmark.node} · ${data.benchmark.platform}. ${data.benchmark.methodology}.`

document.querySelector("#size-note").textContent = data.sizes.boundary
document.querySelector("#size-body").innerHTML = [
  ["@itslil/cn", data.sizes.lil, data.sizes.ratio.brotli11],
  ["official cn", data.sizes.official, 1],
].map(([name, size, r]) => `<tr><th>${name}</th><td>${format.format(size.raw)}</td><td>${format.format(size.gzip9)}</td><td>${format.format(size.brotli11)}</td><td class="verdict ${r <= 1 ? "win" : "loss"}"><strong>${ratio(r)}</strong></td></tr>`).join("")

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
