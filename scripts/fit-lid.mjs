// Fits the CEO lid render (design/renders/gift-lid-v2.webp) onto the open box render
// (src/assets/3d/gift-base.webp) for the Reveal screen.
//
// The lid was rendered from a slightly higher camera than the box, so its top face is a steeper
// diamond. A projective warp maps the lid's bottom footprint (4 corners) onto the box rim,
// blended with the original shape (STRENGTH) so the bow keeps its natural height.
//
// Output: src/assets/3d/gift-lid.webp, on the SAME canvas width as gift-base (840 px) and with
// its placement printed as fractions of the box width for Reveal.tsx (LID constants).
//   node scripts/fit-lid.mjs
import sharp from 'sharp'

// Corner coordinates measured on a 600 px-wide grid of each source image.
// Box rim (outer top edge): left, front, right, back.
const RIM = [
  [4, 98],
  [266, 182],
  [597, 102],
  [314, 6],
]
// Lid bottom footprint: left, front, right; back is hidden by the bow (parallelogram estimate).
const LF = [10, 356]
const FR = [286, 490]
const RT = [595, 396]
const LID_FOOT = [LF, FR, RT, [LF[0] + RT[0] - FR[0], LF[1] + RT[1] - FR[1]]]
const STRENGTH = 0.85 // 1 = exact perspective match, 0 = plain scale
const OVERHANG = 1.035 // the lid is slightly wider than the box
const DROP = 0.035 // lid edge sits a little below the rim (fraction of box width)

const BASE_W = 840
const k = BASE_W / 600

// Target footprint in box pixels: rim expanded around its centre, moved down a little.
const cx = RIM.reduce((a, p) => a + p[0], 0) / 4
const cy = RIM.reduce((a, p) => a + p[1], 0) / 4
const target = RIM.map(([x, y]) => [(cx + (x - cx) * OVERHANG) * k, (cy + (y - cy) * OVERHANG + DROP * 600) * k])

// --- homography helpers -------------------------------------------------------------
function solve(A, b) {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c] / M[c][c]
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]
    }
  }
  return M.map((r, i) => r[n] / r[i])
}
/** H maps src → dst (4 point pairs). */
function homography(src, dst) {
  const A = [], b = []
  src.forEach(([x, y], i) => {
    const [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v)
  })
  const h = solve(A, b)
  return [...h, 1]
}
const apply = (H, x, y) => {
  const w = H[6] * x + H[7] * y + H[8]
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]
}
function invert(H) {
  const [a, b, c, d, e, f, g, h, i] = H
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g
  const det = a * A + b * B + c * C
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det)
}

// --- load lid at the 600-grid scale ×k --------------------------------------------------
const SRC = 'design/renders/gift-lid-v2.webp'
const meta = await sharp(SRC).metadata()
const sw = Math.round(600 * k), sh = Math.round((meta.height / meta.width) * 600 * k)
const { data: src } = await sharp(SRC).resize(sw, sh).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const srcFoot = LID_FOOT.map(([x, y]) => [x * k, y * k])

// Plain similarity fit (scale + translate by the front corner) blended with the exact warp.
const sScale = (target[2][0] - target[0][0]) / (srcFoot[2][0] - srcFoot[0][0])
const similar = srcFoot.map(([x, y]) => [target[1][0] + (x - srcFoot[1][0]) * sScale, target[1][1] + (y - srcFoot[1][1]) * sScale])
const dst = target.map(([x, y], i) => [similar[i][0] + (x - similar[i][0]) * STRENGTH, similar[i][1] + (y - similar[i][1]) * STRENGTH])
const H = homography(srcFoot, dst)
const Hi = invert(H)

// Output canvas: bounds of the warped image.
const corners = [[0, 0], [sw, 0], [sw, sh], [0, sh]].map(([x, y]) => apply(H, x, y))
const minX = Math.floor(Math.min(...corners.map((p) => p[0])))
const minY = Math.floor(Math.min(...corners.map((p) => p[1])))
const maxX = Math.ceil(Math.max(...corners.map((p) => p[0])))
const maxY = Math.ceil(Math.max(...corners.map((p) => p[1])))
const ow = maxX - minX, oh = maxY - minY
const out = Buffer.alloc(ow * oh * 4)
for (let y = 0; y < oh; y++)
  for (let x = 0; x < ow; x++) {
    const [u, v] = apply(Hi, x + minX + 0.5, y + minY + 0.5)
    const x0 = Math.floor(u - 0.5), y0 = Math.floor(v - 0.5)
    const fx = u - 0.5 - x0, fy = v - 0.5 - y0
    const o = (y * ow + x) * 4
    for (let ch = 0; ch < 4; ch++) {
      let acc = 0
      for (const [dx, dy, wgt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
        const sx = x0 + dx, sy = y0 + dy
        if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue
        acc += src[(sy * sw + sx) * 4 + ch] * wgt
      }
      out[o + ch] = Math.round(acc)
    }
  }

// Trim transparent borders and report placement relative to the box (box width = 1).
const trimmed = sharp(out, { raw: { width: ow, height: oh, channels: 4 } }).trim({ threshold: 1 })
const { info } = await trimmed.clone().raw().toBuffer({ resolveWithObject: true })
const left = minX - (info.trimOffsetLeft ?? 0)
const top = minY - (info.trimOffsetTop ?? 0)
await trimmed.webp({ quality: 86, alphaQuality: 92, effort: 6 }).toFile('src/assets/3d/gift-lid.webp')
const baseMeta = await sharp('src/assets/3d/gift-base.webp').metadata()
console.log(
  JSON.stringify({
    lidLeft: +(left / BASE_W).toFixed(4),
    lidTop: +(top / BASE_W).toFixed(4),
    lidWidth: +(info.width / BASE_W).toFixed(4),
    lidHeight: +(info.height / BASE_W).toFixed(4),
    boxHeight: +(baseMeta.height / BASE_W).toFixed(4),
  }),
)
