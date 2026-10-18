// One-off codemod: replaces arbitrary pixel font sizes (text-[15px]) with the
// central type-scale utilities defined in src/styles/index.css (@theme --text-*).
// Usage: node scripts/typography-codemod.mjs   (idempotent)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MAP = {
  '11px': 'caption',
  '12px': 'caption',
  '12.5px': 'caption',
  '13px': 'footnote',
  '14px': 'secondary',
  '15px': 'callout',
  '16px': 'body',
  '17px': 'button',
  '18px': 'card',
  '19px': 'card',
  '20px': 'card',
  '21px': 'card',
  '22px': 'card',
  '24px': 'section',
  '40px': 'numeral',
  '56px': 'numeral',
  '64px': 'numeral',
}

const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
let changed = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(name)) {
      const src = readFileSync(p, 'utf8')
      const out = src.replace(/\btext-\[(\d+(?:\.\d+)?px)\]/g, (m, px) => (MAP[px] ? `text-${MAP[px]}` : m))
      if (out !== src) {
        writeFileSync(p, out)
        changed++
        console.log('updated', p.slice(root.length))
      }
    }
  }
}
walk(root)
console.log(`${changed} files updated`)
