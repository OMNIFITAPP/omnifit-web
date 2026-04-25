import type { Dimension } from '../../types'

// Outline-stroke ambient icons. Quiet by design — represent natural time of day
// for each dimension (sunrise → sun → sunset → moon).

interface Props {
  dim: Dimension
  size?: number
}

const STROKE_W = 1.5
const COMMON: React.SVGProps<SVGSVGElement> = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function TimeOfDayIcon({ dim, size = 14 }: Props) {
  const baseStyle: React.CSSProperties = {
    color: 'var(--ink2)',
    opacity: 0.4,
    flexShrink: 0,
    display: 'inline-block',
    verticalAlign: 'baseline',
  }
  const common = {
    ...COMMON,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: STROKE_W,
    style: baseStyle,
    'aria-hidden': true as const,
  }

  switch (dim) {
    case 'neuro':
      // Sunrise: half sun rising above horizon + short rays
      return (
        <svg {...common}>
          <line x1="3" y1="19" x2="21" y2="19" />
          <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
          <line x1="12" y1="6.5" x2="12" y2="9" />
          <line x1="5"  y1="12"  x2="6.5" y2="13.5" />
          <line x1="19" y1="12"  x2="17.5" y2="13.5" />
        </svg>
      )
    case 'physical':
      // Sun (midday): full circle with rays
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="3"  x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21" />
          <line x1="3"  y1="12" x2="5"  y2="12" />
          <line x1="19" y1="12" x2="21" y2="12" />
          <line x1="5.6"  y1="5.6"  x2="7"    y2="7" />
          <line x1="17"   y1="17"   x2="18.4" y2="18.4" />
          <line x1="18.4" y1="5.6"  x2="17"   y2="7" />
          <line x1="7"    y1="17"   x2="5.6"  y2="18.4" />
        </svg>
      )
    case 'cognitive':
      // Sunset: half sun setting behind horizon + down arrow feel (rays below)
      return (
        <svg {...common}>
          <line x1="3" y1="19" x2="21" y2="19" />
          <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
          <line x1="12" y1="4"   x2="12" y2="7" />
          <polyline points="9.5,6 12,4 14.5,6" />
        </svg>
      )
    case 'emotional':
      // Moon (evening): crescent
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      )
  }
}
