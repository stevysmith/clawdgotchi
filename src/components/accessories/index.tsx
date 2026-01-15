// Accessory component props
export interface AccessoryProps {
  u: number  // Unit size (8 * scale)
}

// Small colored badge/dot on the body
export const ColorBadge = ({ u }: AccessoryProps) => (
  <g className="accessory-badge">
    <circle cx={11 * u} cy={1.5 * u} r={0.8 * u} fill="#E63946" />
    <circle cx={11 * u} cy={1.5 * u} r={0.4 * u} fill="#FF6B6B" />
  </g>
)

// Tiny bow on top
export const TinyBow = ({ u }: AccessoryProps) => (
  <g className="accessory-bow">
    <ellipse cx={6 * u} cy={-0.3 * u} rx={0.8 * u} ry={0.4 * u} fill="#FF69B4" />
    <ellipse cx={8 * u} cy={-0.3 * u} rx={0.8 * u} ry={0.4 * u} fill="#FF69B4" />
    <circle cx={7 * u} cy={-0.3 * u} r={0.3 * u} fill="#FF1493" />
  </g>
)

// Small bandana/neck wrap
export const Bandana = ({ u }: AccessoryProps) => (
  <g className="accessory-bandana">
    <path
      d={`M ${3 * u} ${6.5 * u} Q ${7 * u} ${7.5 * u} ${11 * u} ${6.5 * u}`}
      fill="none"
      stroke="#2E86AB"
      strokeWidth={0.6 * u}
      strokeLinecap="round"
    />
  </g>
)

// Star mark on body
export const StarMark = ({ u }: AccessoryProps) => (
  <g className="accessory-star">
    <polygon
      points={`
        ${11 * u},${1 * u}
        ${11.3 * u},${1.8 * u}
        ${12.2 * u},${1.8 * u}
        ${11.5 * u},${2.3 * u}
        ${11.8 * u},${3.1 * u}
        ${11 * u},${2.6 * u}
        ${10.2 * u},${3.1 * u}
        ${10.5 * u},${2.3 * u}
        ${9.8 * u},${1.8 * u}
        ${10.7 * u},${1.8 * u}
      `}
      fill="#FFD700"
    />
  </g>
)

// Small flower
export const FlowerMark = ({ u }: AccessoryProps) => (
  <g className="accessory-flower">
    <circle cx={10.5 * u} cy={0.5 * u} r={0.4 * u} fill="#FF69B4" />
    <circle cx={11.3 * u} cy={0.5 * u} r={0.4 * u} fill="#FF69B4" />
    <circle cx={10.9 * u} cy={-0.1 * u} r={0.4 * u} fill="#FF69B4" />
    <circle cx={10.9 * u} cy={1.1 * u} r={0.4 * u} fill="#FF69B4" />
    <circle cx={10.9 * u} cy={0.5 * u} r={0.3 * u} fill="#FFD700" />
  </g>
)

// Tiny leaf on head
export const LeafMark = ({ u }: AccessoryProps) => (
  <g className="accessory-leaf">
    <ellipse cx={7 * u} cy={-0.5 * u} rx={0.6 * u} ry={1 * u} fill="#2A9D8F" transform={`rotate(-20 ${7 * u} ${-0.5 * u})`} />
    <line x1={7 * u} y1={0.3 * u} x2={7 * u} y2={-1.3 * u} stroke="#1D6B5F" strokeWidth={0.15 * u} />
  </g>
)

// Heart mark
export const HeartMark = ({ u }: AccessoryProps) => (
  <g className="accessory-heart">
    <path
      d={`M ${11 * u} ${2.2 * u}
         C ${10.2 * u} ${1.4 * u} ${10.2 * u} ${2.2 * u} ${11 * u} ${3 * u}
         C ${11.8 * u} ${2.2 * u} ${11.8 * u} ${1.4 * u} ${11 * u} ${2.2 * u}`}
      fill="#E63946"
    />
  </g>
)

// Small ribbon/tuft
export const Ribbon = ({ u }: AccessoryProps) => (
  <g className="accessory-ribbon">
    <path
      d={`M ${6.5 * u} ${-0.2 * u} Q ${7 * u} ${-1 * u} ${7.5 * u} ${-0.2 * u}`}
      fill="none"
      stroke="#9B5DE5"
      strokeWidth={0.5 * u}
      strokeLinecap="round"
    />
  </g>
)

// Blush marks (cheeks)
export const BlushMarks = ({ u }: AccessoryProps) => (
  <g className="accessory-blush">
    <ellipse cx={2.5 * u} cy={3.5 * u} rx={0.8 * u} ry={0.4 * u} fill="#FFB4B4" opacity={0.6} />
    <ellipse cx={11.5 * u} cy={3.5 * u} rx={0.8 * u} ry={0.4 * u} fill="#FFB4B4" opacity={0.6} />
  </g>
)

// Small antenna/hair tuft
export const Antenna = ({ u }: AccessoryProps) => (
  <g className="accessory-antenna">
    <path
      d={`M ${7 * u} ${0} Q ${6.5 * u} ${-1.5 * u} ${7.5 * u} ${-1.8 * u}`}
      fill="none"
      stroke="#C27C5C"
      strokeWidth={0.4 * u}
      strokeLinecap="round"
    />
    <circle cx={7.5 * u} cy={-1.8 * u} r={0.35 * u} fill="#FFD700" />
  </g>
)

// Accessory names for display
export const ACCESSORY_NAMES = [
  'Badge',
  'Bow',
  'Bandana',
  'Star',
  'Flower',
  'Leaf',
  'Heart',
  'Ribbon',
  'Blush',
  'Antenna'
] as const

// Accessory components indexed by ID
export const ACCESSORIES = [
  ColorBadge,
  TinyBow,
  Bandana,
  StarMark,
  FlowerMark,
  LeafMark,
  HeartMark,
  Ribbon,
  BlushMarks,
  Antenna
] as const

// Render accessory by ID
export const Accessory = ({ id, u }: { id: number; u: number }) => {
  const AccessoryComponent = ACCESSORIES[id % ACCESSORIES.length]
  return <AccessoryComponent u={u} />
}

export default Accessory
