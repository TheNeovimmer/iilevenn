import { cn } from '@/lib/utils'

// Warm and cool palettes that look good as gradient orbs
const COLORS = [
  '#e07a5f',
  '#f2cc8f',
  '#81b29a',
  '#3d405b',
  '#f4a261',
  '#e76f51',
  '#264653',
  '#2a9d8f',
  '#e9c46a',
  '#a8dadc',
  '#457b9d',
  '#f08080',
  '#dda0dd',
  '#90be6d',
  '#f9c74f',
  '#577590',
  '#f94144',
  '#43aa8b',
  '#f8961e',
  '#b5838d',
]

/**
 * Hash a string into a number (simple djb2-like hash).
 * Deterministic — same name always produces the same result.
 */
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(h)
}

interface VoiceAvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function VoiceAvatar({ name, size = 'md', className }: VoiceAvatarProps) {
  const h = hash(name)
  const c1 = COLORS[h % COLORS.length]
  const c2 = COLORS[(h * 7 + 3) % COLORS.length]
  const c3 = COLORS[(h * 13 + 7) % COLORS.length]
  const angle = h % 360

  const sizes = {
    xs: 'size-6',
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-14',
  }

  return (
    <div
      className={cn('shrink-0 rounded-full', sizes[size], className)}
      style={{
        background: `linear-gradient(${angle}deg, ${c1}, ${c2}, ${c3})`,
        filter: 'blur(0.5px)',
      }}
    />
  )
}
