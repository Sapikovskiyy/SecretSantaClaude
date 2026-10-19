import type { CSSProperties } from 'react'
import { Img, staticFile } from 'remotion'

/** A 3D render (transparent WebP from public/assets/3d). Flat image — only 2D transforms, never warped. */
export function Art({ name, height, style }: { name: string; height: number; style?: CSSProperties }) {
  return <Img src={staticFile(`assets/3d/${name}.webp`)} style={{ height, width: 'auto', display: 'block', ...style }} />
}

/** Soft contact shadow under an object. */
export function ContactShadow({ width, opacity = 0.55, style }: { width: number; opacity?: number; style?: CSSProperties }) {
  return (
    <div style={{ width, height: width * 0.16, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(0,0,0,${opacity}), rgba(0,0,0,0))`, ...style }} />
  )
}
