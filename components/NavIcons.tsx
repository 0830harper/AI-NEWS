import React from 'react'

type IconProps = { size?: number; className?: string }

// Sticker border effect:
// strokeWidth=3 white stroke + paintOrder="stroke fill" = white outline BEHIND the fill
// → inactive state: dark icon with white border = sticker look ✓
// → active state: white icon on dark bg = clean silhouette ✓
const S: React.SVGAttributes<SVGElement> = {
  stroke: 'white',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  style: { paintOrder: 'stroke fill' },
}

// ⚡ Latest — fat solid lightning bolt
export function LightningIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      <path d="M13.5 1L4.5 13H11L8 21L18.5 9H12L13.5 1Z" {...S} />
    </svg>
  )
}

// 📱 App — chunky phone with screen window + speaker
export function PhoneIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      {/* phone body */}
      <rect x="2.5" y="0.5" width="17" height="21" rx="4" {...S} />
      {/* screen (white cutout) */}
      <rect x="5" y="5" width="12" height="12.5" rx="1.5" fill="white" stroke="none" />
      {/* speaker slit */}
      <rect x="7.5" y="2.5" width="7" height="1.5" rx="0.75" fill="white" stroke="none" />
      {/* home bar */}
      <rect x="8" y="19.5" width="6" height="1.5" rx="0.75" fill="white" stroke="none" />
    </svg>
  )
}

// 🎨 Design / ART — bold paintbrush with big bristle blob + paint drop
export function BrushIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      {/* handle */}
      <path d="M13 1.5L20.5 9L18.5 11L11 3.5L13 1.5Z" {...S} />
      {/* brush body / shaft */}
      <path d="M11 3.5L18.5 11L14.5 14L7.5 6.5L11 3.5Z" {...S} />
      {/* bristle head — big rounded blob */}
      <path d="M14.5 14C12 16 9 18 6.5 19.5C5 20.5 3 21 2 20C1 19 1.5 17 2.5 15.5C4 13 7 10.5 9.5 8.5L14.5 14Z" {...S} />
      {/* paint drop */}
      <circle cx="2" cy="20" r="1.5" fill="currentColor" stroke="white" strokeWidth="2" style={{ paintOrder: 'stroke fill' }} />
    </svg>
  )
}

// ✦ UX / UI — 3 stacked chunky frames (like layered cards)
export function LayersIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      {/* back card */}
      <rect x="1" y="11" width="15" height="10" rx="2.5" {...S} />
      {/* middle card */}
      <rect x="3.5" y="6.5" width="15" height="10" rx="2.5" {...S} />
      {/* front card + title bar line */}
      <rect x="6" y="2" width="15" height="10" rx="2.5" {...S} />
      <rect x="8" y="4.5" width="11" height="2" rx="1" fill="white" stroke="none" />
    </svg>
  )
}

// ⚙️ Tech — solid chip body + stubby pin tabs on all sides
export function ChipIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      {/* chip body */}
      <rect x="6" y="6" width="10" height="10" rx="2" {...S} />
      {/* top pins */}
      <rect x="8" y="2" width="2.5" height="4.5" rx="1" {...S} />
      <rect x="11.5" y="2" width="2.5" height="4.5" rx="1" {...S} />
      {/* bottom pins */}
      <rect x="8" y="15.5" width="2.5" height="4.5" rx="1" {...S} />
      <rect x="11.5" y="15.5" width="2.5" height="4.5" rx="1" {...S} />
      {/* left pins */}
      <rect x="2" y="8" width="4.5" height="2.5" rx="1" {...S} />
      <rect x="2" y="11.5" width="4.5" height="2.5" rx="1" {...S} />
      {/* right pins */}
      <rect x="15.5" y="8" width="4.5" height="2.5" rx="1" {...S} />
      <rect x="15.5" y="11.5" width="4.5" height="2.5" rx="1" {...S} />
    </svg>
  )
}

// 📡 Source — antenna tower with filled signal arcs
export function SignalIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="currentColor" className={className}>
      {/* pole */}
      <rect x="9.5" y="8.5" width="3" height="11.5" rx="1.5" {...S} />
      {/* base */}
      <rect x="5.5" y="19" width="11" height="3" rx="1.5" {...S} />
      {/* signal dot */}
      <circle cx="11" cy="7" r="2" {...S} />
      {/* inner arc (filled thick band) */}
      <path
        d="M6.5 12C5 10.5 4.5 9 4.5 7.5C4.5 6 5 4.5 6.5 3"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
      <path
        d="M15.5 12C17 10.5 17.5 9 17.5 7.5C17.5 6 17 4.5 15.5 3"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
      {/* outer arc */}
      <path
        d="M3.5 14.5C1 12 0 9.8 0 7.5C0 5.2 1 3 3.5 0.5"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
      <path
        d="M18.5 14.5C21 12 22 9.8 22 7.5C22 5.2 21 3 18.5 0.5"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
    </svg>
  )
}
