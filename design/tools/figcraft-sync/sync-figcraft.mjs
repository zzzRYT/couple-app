#!/usr/bin/env node
/**
 * sync-figcraft.mjs — one-way VIEWING copy: Claude Design canvas boards  ->  a local FigCraft document (.figcraft)
 *
 * The canvas stays the source of truth. This script renders every static board (design/canvas/project/*.dc.html, in the order
 * of canvas.json) as an image in headless Chrome and builds ONE FigCraft document with `figcraft-cli run`:
 * one page per canvas section, one frame per board named by board id (S06-main-dday, C07-vector-version, ...), the images
 * placed inside the frame. The light/dark and ko/en/ja variants are already laid out in a grid inside each board image.
 * It is for looking at the design offline, not for editing: text and shapes are pixels. Edits made in FigCraft do NOT flow
 * back. The document is rebuilt from scratch on every run and the output file is replaced (same input -> same output).
 *
 * Needs:  Node 20+, `npm ci` in this folder (puppeteer-core), Google Chrome, the official figcraft-cli (never commit it),
 *         network access (the boards load their Google Fonts).
 * Usage:  node sync-figcraft.mjs --cli /path/to/figcraft-cli [--out ~/Documents/Aroom-design/aroom-design.figcraft]
 *             [--chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"] [--scale 2] [--quality 85]
 *             [--only S06,S28] [--work DIR]
 * Prints a JSON report (pages, frames, sizes, 3 re-exported frames). See design/figcraft/README.md.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DES = path.resolve(HERE, '..', '..')
const PROJECT = path.join(DES, 'canvas', 'project')

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const CLI = arg('cli', process.env.FIGCRAFT_CLI)
const CHROME = arg('chrome', process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
const OUT = path.resolve(arg('out', path.join(os.homedir(), 'Documents', 'Aroom-design', 'aroom-design.figcraft')).replace(/^~/, os.homedir()))
const SCALE = +arg('scale', '2')
const QUALITY = +arg('quality', '85')
const ONLY = arg('only', '') ? arg('only').split(',') : null
const WORK = path.resolve(arg('work', fs.mkdtempSync(path.join(os.tmpdir(), 'aroom-figcraft-'))))
if (!CLI || !fs.existsSync(CLI)) { console.error('give the official figcraft-cli with --cli (or FIGCRAFT_CLI); see the header of this file'); process.exit(2) }
if (!fs.existsSync(CHROME)) { console.error('Chrome not found: ' + CHROME + ' (use --chrome)'); process.exit(2) }
fs.mkdirSync(path.join(WORK, 'html'), { recursive: true })
fs.mkdirSync(path.join(WORK, 'img'), { recursive: true })

// ---------------------------------------------------------------- boards and sections
const canvas = JSON.parse(fs.readFileSync(path.join(PROJECT, 'canvas.json'), 'utf8'))
const blobs = JSON.parse(fs.readFileSync(path.join(DES, 'canvas', 'blob-map.json'), 'utf8')).blobs
const SECTIONS = [
  ['00 개요', (id) => id === 'Main' || id === 'S00-overview'],
  ['S 화면 · 참고 보드', (id) => /^S\d/.test(id)],
  ['C 캐릭터 (C01–C07)', (id) => /^C\d/.test(id)],
  ['L 기록 포함 (V1 이후)', (id) => /^L-/.test(id)],
]
const allIds = canvas.order.map((f) => f.replace(/\.dc\.html$/, ''))
const skipped = []
const boards = []
for (const id of allIds) {
  const src = fs.readFileSync(path.join(PROJECT, id + '.dc.html'), 'utf8')
  if (src.includes('{{')) { skipped.push({ id, why: 'interactive stage-1 prototype: needs the canvas runtime, not a static board' }); continue }
  if (ONLY && !ONLY.some((o) => id.startsWith(o))) continue
  const sec = SECTIONS.findIndex(([, f]) => f(id))
  if (sec < 0) { skipped.push({ id, why: 'no section' }); continue }
  boards.push({ id, src, sec })
}

// ---------------------------------------------------------------- a board as a local page (the canvas runtime is not needed for static boards)
const FREEZE_CSS = '*{animation:none!important;transition:none!important}.cpl-cycle>svg:first-child{opacity:1}body{margin:0;background:transparent}'
function localHtml(b) {
  const head = (b.src.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1]
  const body = b.src.slice(b.src.indexOf('</helmet>') + 9, b.src.lastIndexOf('</x-dc>'))
  const lang = (b.src.match(/<html lang="([^"]+)"/) || [, 'ko'])[1]
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${b.id}</title>${head}<style>${FREEZE_CSS}</style></head><body>${body}</body></html>`
    .replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => {
      if (!blobs[id]) throw new Error(`${b.id}: unknown canvas asset ${id} (add it to canvas/blob-map.json)`)
      return pathToFileURL(path.join(DES, blobs[id])).href
    })
}

// ---------------------------------------------------------------- render each board; chunks of at most 8000 px keep every image under GPU texture limits
const CHUNK = 8000
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--disable-gpu', '--force-color-profile=srgb'] })
const fontsUsed = {}
for (const b of boards) {
  const htmlPath = path.join(WORK, 'html', b.id + '.html')
  fs.writeFileSync(htmlPath, localHtml(b))
  const page = await browser.newPage()
  await page.setViewport({ width: 1760, height: 1200, deviceScaleFactor: SCALE })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 120000 })
  await page.evaluate(() => document.fonts.ready)
  const m = await page.evaluate(() => {
    const r = document.body.firstElementChild.getBoundingClientRect()
    const fam = {}
    for (const el of document.body.querySelectorAll('*')) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()
      fam[f] = true
    }
    return { w: Math.ceil(r.width), h: Math.ceil(r.height), fam }
  })
  Object.assign(fontsUsed, m.fam)
  b.w = m.w; b.h = m.h; b.chunks = []
  for (let y = 0, i = 0; y < b.h; y += CHUNK, i++) {
    const h = Math.min(CHUNK, b.h - y)
    const file = path.join(WORK, 'img', `${b.id}_${i}.webp`)
    fs.writeFileSync(file, await page.screenshot({ type: 'webp', quality: QUALITY, captureBeyondViewport: true, clip: { x: 0, y, width: b.w, height: h } }))
    b.chunks.push({ file, y, h })
  }
  await page.close()
  b.kb = Math.round(b.chunks.reduce((s, c) => s + fs.statSync(c.file).size, 0) / 1024)
  console.error(`  ${b.id}: ${b.w}x${b.h}, ${b.chunks.length} image(s), ${b.kb} KB`)
}
await browser.close()

// ---------------------------------------------------------------- one document: a page per section, boards in a 4-wide grid like the canvas
const GAP = 80, ROWGAP = 140, COLS = 4
const steps = [{ command: 'file.rename', params: { name: '아룸 디자인 (캔버스 보기용 사본)' } }]
let firstPage = true
for (let si = 0; si < SECTIONS.length; si++) {
  const list = boards.filter((b) => b.sec === si)
  if (!list.length) continue
  steps.push(firstPage ? { command: 'page.rename', params: { name: SECTIONS[si][0] } } : { command: 'page.add', params: { name: SECTIONS[si][0] } })
  firstPage = false
  let y = 0
  for (let i = 0; i < list.length; i += COLS) {
    const row = list.slice(i, i + COLS)
    let x = 0
    for (const b of row) {
      const frameStep = steps.length
      steps.push({ command: 'frame.create', params: { name: b.id, x, y, width: b.w, height: b.h } })
      for (const c of b.chunks) steps.push({ command: 'image.place', params: { path: c.file, x: 0, y: c.y, width: b.w, height: c.h, parent: { $step: frameStep } } })
      x += b.w + GAP
    }
    y += Math.max(...row.map((b) => b.h)) + ROWGAP
  }
}
const scriptPath = path.join(WORK, 'figcraft-run.json')
fs.writeFileSync(scriptPath, JSON.stringify(steps, null, 1))
fs.mkdirSync(path.dirname(OUT), { recursive: true })
const tmpOut = path.join(WORK, 'out.figcraft')
const runOut = execFileSync(CLI, ['run', scriptPath, '--out', tmpOut], { encoding: 'utf8', maxBuffer: 1 << 28 })
const failed = runOut.split('\n').filter((l) => l.includes('"ok":false'))
if (failed.length) { console.error(failed.join('\n')); process.exit(1) }
fs.copyFileSync(tmpOut, OUT + '.tmp'); fs.renameSync(OUT + '.tmp', OUT)   // replace, never append

// ---------------------------------------------------------------- verify: reopen, count, re-export three frames
const info = execFileSync(CLI, ['info', OUT], { encoding: 'utf8' })
const pages = (info.match(/^page \d+ /gm) || []).length
const frames = (info.match(/^\s+\d+ FRAME /gm) || []).length
const probe = [boards[0], boards[Math.floor(boards.length / 2)], boards[boards.length - 1]].filter(Boolean)
const exported = []
for (const b of probe) {
  const png = path.join(WORK, `check-${b.id}.png`)
  // a board lives on its section's page: export it by name from that page
  execFileSync(CLI, ['export', OUT, '-o', png, '--page', SECTIONS[b.sec][0], '--node', b.id, '--scale', '0.5'], { encoding: 'utf8' })   // 0.5x: tall boards exceed the 16384 px export limit at 1x
  exported.push({ frame: b.id, bytes: fs.statSync(png).size, png: process.env.KEEP_CHECKS ? png : undefined })
}
const report = {
  out: OUT, outMB: +(fs.statSync(OUT).size / 1048576).toFixed(2), sha256: crypto.createHash('sha256').update(fs.readFileSync(OUT)).digest('hex').slice(0, 16),
  canvasBoards: allIds.length, rendered: boards.length, pages, frames, skipped,
  perBoard: boards.map((b) => ({ id: b.id, page: SECTIONS[b.sec][0], w: b.w, h: b.h, images: b.chunks.length, KB: b.kb })),
  fontFamiliesUsed: Object.keys(fontsUsed).sort(),   // drawn by Chrome (Google Fonts); the FigCraft file holds pixels, so FigCraft needs none of them
  reexported: exported, work: WORK,
}
console.log(JSON.stringify(report, null, 1))
if (!arg('work')) fs.rmSync(WORK, { recursive: true, force: true })
