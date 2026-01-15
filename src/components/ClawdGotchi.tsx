import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Accessory } from './accessories'

export type Stage = 'egg' | 'baby' | 'child' | 'adult'
export type Mood = 'happy' | 'okay' | 'sad' | 'sick' | 'sleeping'

export interface Stats {
  energy: number
  health: number
  happiness: number
  discipline: number
}

interface ClawdGotchiProps {
  stage: Stage
  mood: Mood
  stats: Stats
  accessoryId?: number
}

// Colors - exact from Claude Code
const CLAWD_BODY = '#C27C5C' // The main orange body color from the image
const CLAWD_DARK = '#8B5A42' // Darker shade for nose band and feet
const CLAWD_SICK = '#7CB97C' // Green when sick

// Sparkle for happy mood
const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute text-sm font-bold text-yellow-300 pointer-events-none"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
    transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 1.5 }}
  >
    ✦
  </motion.div>
)

// Sweat drop for sick mood
const SweatDrop = ({ x }: { x: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: x, top: 10 }}
    initial={{ y: 0, opacity: 1 }}
    animate={{ y: [0, 25, 50], opacity: [1, 0.7, 0] }}
    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
  >
    <svg width="8" height="12" viewBox="0 0 8 12">
      <ellipse cx="4" cy="8" rx="4" ry="4" fill="#60A5FA" />
      <ellipse cx="4" cy="4" rx="2" ry="4" fill="#60A5FA" />
    </svg>
  </motion.div>
)

// ZZZ for sleeping
const SleepingZs = () => (
  <div className="absolute pointer-events-none -right-6 -top-4">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="absolute font-bold text-indigo-400"
        style={{ fontSize: 16 - i * 3, right: i * 10, top: i * -12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0], y: [0, -15, -30], x: [0, 5, 10] }}
        transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity }}
      >
        z
      </motion.span>
    ))}
  </div>
)

// Heart burst for happy
const HeartBurst = () => (
  <motion.div
    className="absolute text-xl text-red-400 -translate-x-1/2 pointer-events-none -top-8 left-1/2"
    initial={{ opacity: 0, scale: 0, y: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.8], y: [0, -20, -35] }}
    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3 }}
  >
    ♥
  </motion.div>
)

/*
  CLAWD - The exact Claude Code mascot from the image

  Structure (pixel grid):
  - Two ears on top (separated)
  - Rectangular body
  - Two black rectangular eyes
  - Darker horizontal band (nose/mouth)
  - Two darker feet at bottom
*/
export const Clawd = ({
  mood,
  scale = 1,
  accessoryId
}: {
  mood: Mood
  scale?: number
  accessoryId?: number
}) => {
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (mood === 'sleeping') return
    const blink = () => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }
    const interval = setInterval(blink, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [mood])

  const bodyColor = mood === 'sick' ? CLAWD_SICK : CLAWD_BODY
  const darkColor = mood === 'sick' ? '#5A8B5A' : CLAWD_DARK

  // Base unit size (each "pixel" in the design)
  const u = 8 * scale

  // Clawd structure from reference:
  // - Simple flat rectangle body
  // - Arm nubs on sides
  // - 4 legs in 2 pairs
  const armExtend = 1.5 * u
  const width = 14 * u + armExtend * 2  // Extra space for arms
  const height = 12 * u

  return (
    <motion.div
      className="relative"
      animate={
        mood === 'happy'
          ? { y: [0, -10 * scale, 0], scale: [1, 1.02, 1] }
          : mood === 'sad'
          ? { y: [0, 3 * scale, 0], scale: [1, 0.98, 1] }
          : mood === 'sleeping'
          ? { y: [0, 2 * scale, 0] }
          : { y: [0, -3 * scale, 0] }
      }
      transition={{
        duration: mood === 'happy' ? 0.5 : 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg width={width} height={height} viewBox={`${-armExtend} 0 ${width} ${height}`}>
        {/* Shadow */}
        <ellipse
          cx={width / 2}
          cy={height - 0.5 * u}
          rx={4 * u}
          ry={0.5 * u}
          fill="rgba(0,0,0,0.15)"
        />

        {/* BODY - simple flat rectangle, NO ears, NO notch */}
        <rect
          x={1 * u}
          y={0}
          width={12 * u}
          height={7 * u}
          fill={bodyColor}
        />

        {/* ARM NUBS */}
        <rect x={-0.5 * u} y={3.2 * u} width={1.5 * u} height={1.8 * u} fill={bodyColor} />
        <rect x={13 * u} y={3.2 * u} width={1.5 * u} height={1.8 * u} fill={bodyColor} />

        {/* EYES - vertically rectangular, moved up, positioned wider apart */}
        {mood === 'sleeping' ? (
          <>
            {/* Closed eyes - horizontal lines */}
            <rect x={3.5 * u} y={2 * u} width={1.2 * u} height={0.3 * u} fill="#1a1a1a" />
            <rect x={9.3 * u} y={2 * u} width={1.2 * u} height={0.3 * u} fill="#1a1a1a" />
          </>
        ) : (
          <>
            {/* Left eye - tall vertical rectangle */}
            <rect
              x={3.5 * u}
              y={1.5 * u}
              width={1 * u}
              height={isBlinking ? 0.3 * u : 2 * u}
              fill="#1a1a1a"
            />
            {/* Right eye - tall vertical rectangle */}
            <rect
              x={9.5 * u}
              y={1.5 * u}
              width={1 * u}
              height={isBlinking ? 0.3 * u : 2 * u}
              fill="#1a1a1a"
            />
          </>
        )}

        {/* Expression overlays based on mood */}
        {mood === 'sad' && (
          <>
            {/* Sad eyebrows */}
            <rect x={3 * u} y={1 * u} width={1.5 * u} height={0.3 * u} fill="#1a1a1a" transform={`rotate(-15 ${3.75 * u} ${1.15 * u})`} />
            <rect x={9.5 * u} y={1 * u} width={1.5 * u} height={0.3 * u} fill="#1a1a1a" transform={`rotate(15 ${10.25 * u} ${1.15 * u})`} />
          </>
        )}

        {mood === 'sick' && (
          <>
            {/* X eyes for sick */}
            <line x1={3.5 * u} y1={1.5 * u} x2={4.5 * u} y2={3.5 * u} stroke="#1a1a1a" strokeWidth={0.3 * u} />
            <line x1={4.5 * u} y1={1.5 * u} x2={3.5 * u} y2={3.5 * u} stroke="#1a1a1a" strokeWidth={0.3 * u} />
            <line x1={9.5 * u} y1={1.5 * u} x2={10.5 * u} y2={3.5 * u} stroke="#1a1a1a" strokeWidth={0.3 * u} />
            <line x1={10.5 * u} y1={1.5 * u} x2={9.5 * u} y2={3.5 * u} stroke="#1a1a1a" strokeWidth={0.3 * u} />
          </>
        )}

        {/* Accessory - rendered above body/eyes */}
        {accessoryId !== undefined && <Accessory id={accessoryId} u={u} />}

        {/* 4 LEGS in 2 pairs - matching reference image */}
        {/* Left pair of legs */}
        <motion.rect
          x={2 * u}
          y={7 * u}
          width={1.2 * u}
          height={2.5 * u}
          fill={darkColor}
          animate={mood === 'happy' ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.rect
          x={3.8 * u}
          y={7 * u}
          width={1.2 * u}
          height={2.5 * u}
          fill={darkColor}
          animate={mood === 'happy' ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse', delay: 0.1 }}
        />
        {/* Right pair of legs */}
        <motion.rect
          x={9 * u}
          y={7 * u}
          width={1.2 * u}
          height={2.5 * u}
          fill={darkColor}
          animate={mood === 'happy' ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse', delay: 0.2 }}
        />
        <motion.rect
          x={10.8 * u}
          y={7 * u}
          width={1.2 * u}
          height={2.5 * u}
          fill={darkColor}
          animate={mood === 'happy' ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse', delay: 0.3 }}
        />
      </svg>

      {/* Effects based on mood */}
      {mood === 'happy' && (
        <>
          <Sparkle delay={0} x={-15} y={10} />
          <Sparkle delay={0.4} x={scale * 112 + 5} y={5} />
          <Sparkle delay={0.8} x={scale * 56} y={-10} />
          <HeartBurst />
        </>
      )}
      {mood === 'sleeping' && <SleepingZs />}
      {mood === 'sick' && (
        <>
          <SweatDrop x={-5} />
          <SweatDrop x={scale * 112} />
        </>
      )}
    </motion.div>
  )
}

// Egg stage - simple pixel egg
const EggCreature = ({ mood }: { mood: Mood }) => {
  const [crackLevel, setCrackLevel] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCrackLevel((prev) => (prev + 1) % 4)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const color = mood === 'sick' ? CLAWD_SICK : CLAWD_BODY

  return (
    <motion.div
      className="relative"
      animate={
        mood === 'happy'
          ? { rotate: [-8, 8, -8], y: [0, -8, 0] }
          : { rotate: [-3, 3, -3], y: [0, -2, 0] }
      }
      transition={{
        duration: mood === 'happy' ? 0.4 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg width="64" height="80" viewBox="0 0 64 80">
        {/* Shadow */}
        <ellipse cx="32" cy="76" rx="20" ry="4" fill="rgba(0,0,0,0.25)" />

        {/* Egg shape using rects for pixel look */}
        <rect x="20" y="8" width="24" height="8" fill={color} />
        <rect x="12" y="16" width="40" height="8" fill={color} />
        <rect x="8" y="24" width="48" height="32" fill={color} />
        <rect x="12" y="56" width="40" height="8" fill={color} />
        <rect x="20" y="64" width="24" height="8" fill={color} />

        {/* Cracks */}
        {crackLevel > 0 && (
          <path d="M 44 24 L 40 32 L 46 40" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        )}
        {crackLevel > 1 && (
          <path d="M 20 28 L 24 36 L 18 42" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        )}
        {crackLevel > 2 && (
          <>
            {/* Eyes peeking through */}
            <rect x="24" y="44" width="6" height="8" fill="#1a1a1a" />
            <rect x="34" y="44" width="6" height="8" fill="#1a1a1a" />
          </>
        )}
      </svg>

      {mood === 'sleeping' && <SleepingZs />}
      {mood === 'sick' && <SweatDrop x={50} />}
    </motion.div>
  )
}

// Baby Clawd - smaller version
const BabyCreature = ({ mood, accessoryId }: { mood: Mood; accessoryId?: number }) => (
  <div className="relative">
    <Clawd mood={mood} scale={0.7} accessoryId={accessoryId} />
  </div>
)

// Child Clawd - medium version
const ChildCreature = ({ mood, accessoryId }: { mood: Mood; accessoryId?: number }) => (
  <div className="relative">
    <Clawd mood={mood} scale={1} accessoryId={accessoryId} />
  </div>
)

// Adult Clawd - full size
const AdultCreature = ({ mood, accessoryId }: { mood: Mood; accessoryId?: number }) => (
  <div className="relative">
    <Clawd mood={mood} scale={1.4} accessoryId={accessoryId} />
  </div>
)

// Health meter component
const StatMeter = ({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: string
  color: string
}) => (
  <div className="flex items-center gap-3 sm:gap-2">
    <span className="w-6 sm:w-5 text-lg sm:text-sm">{icon}</span>
    <div className="flex-1">
      <div className="flex justify-between mb-1 sm:mb-0.5">
        <span className="text-sm sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        <span className="text-sm sm:text-[10px] font-bold text-neutral-300 font-mono">{value}%</span>
      </div>
      <div className="h-3 sm:h-2.5 bg-neutral-800 border border-neutral-700 rounded-sm">
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  </div>
)

// Main component
export default function ClawdGotchi({ stage, mood, stats, accessoryId }: ClawdGotchiProps) {
  const stageNames = {
    egg: 'Egg',
    baby: 'Hatchling',
    child: 'Sprout',
    adult: 'Clawd',
  }

  const moodEmoji = {
    happy: '✨',
    okay: '🦀',
    sad: '😢',
    sick: '🤒',
    sleeping: '💤',
  }

  return (
    <div className="w-full h-full min-h-screen sm:w-80 sm:h-[400px] sm:min-h-0 bg-[#2D2D2D] sm:rounded-xl overflow-hidden flex flex-col font-mono sm:border sm:border-neutral-700">
      {/* Header */}
      <div className="px-5 sm:px-4 pt-4 sm:pt-3 pb-3 sm:pb-2 flex items-center justify-between border-b border-neutral-700 bg-[#252525] pt-safe-top">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-lg">🦀</span>
          <span className="text-lg sm:text-sm font-bold tracking-tight text-neutral-200">ClawdGotchi</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-1.5 px-3 sm:px-2 py-1.5 sm:py-0.5 bg-neutral-800 border border-neutral-600 rounded-lg sm:rounded">
          <span className="text-base sm:text-xs">{moodEmoji[mood]}</span>
          <span className="text-sm sm:text-[10px] font-bold text-neutral-400">{stageNames[stage]}</span>
        </div>
      </div>

      {/* Creature display area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#1E1E1E]">
        {/* Background atmosphere */}
        <div className="absolute inset-0 overflow-hidden">
          {mood === 'happy' &&
            [...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-yellow-400/20"
                style={{
                  left: `${25 + i * 25}%`,
                  top: `${30 + (i % 2) * 25}%`,
                }}
                animate={{ y: [-8, 8], opacity: [0.2, 0.5, 0.2] }}
                transition={{
                  duration: 2 + i * 0.4,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.3,
                }}
              />
            ))}
          {mood === 'sleeping' && <div className="absolute inset-0 bg-indigo-950/20" />}
          {mood === 'sick' && <div className="absolute inset-0 bg-green-950/15" />}
        </div>

        {/* The creature */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {stage === 'egg' && <EggCreature mood={mood} />}
            {stage === 'baby' && <BabyCreature mood={mood} accessoryId={accessoryId} />}
            {stage === 'child' && <ChildCreature mood={mood} accessoryId={accessoryId} />}
            {stage === 'adult' && <AdultCreature mood={mood} accessoryId={accessoryId} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stats panel */}
      <div className="px-5 sm:px-4 py-4 sm:py-3 bg-[#252525] border-t border-neutral-700 space-y-3 sm:space-y-2 pb-safe-bottom">
        <StatMeter
          label="Energy"
          value={stats.energy}
          icon="⚡"
          color={stats.energy > 60 ? '#22C55E' : stats.energy > 30 ? '#EAB308' : '#EF4444'}
        />
        <StatMeter
          label="Health"
          value={stats.health}
          icon="❤️"
          color={stats.health > 60 ? '#22C55E' : stats.health > 30 ? '#EAB308' : '#EF4444'}
        />
        <StatMeter
          label="Happiness"
          value={stats.happiness}
          icon="😊"
          color={stats.happiness > 60 ? '#22C55E' : stats.happiness > 30 ? '#EAB308' : '#EF4444'}
        />
        <StatMeter
          label="Discipline"
          value={stats.discipline}
          icon="📏"
          color={stats.discipline > 60 ? '#22C55E' : stats.discipline > 30 ? '#EAB308' : '#EF4444'}
        />
      </div>
    </div>
  )
}
