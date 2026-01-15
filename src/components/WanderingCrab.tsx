import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Clawd, type Mood, type Stats } from './ClawdGotchi'

interface WanderingCrabProps {
  id: string
  accessoryId: number
  status: 'active' | 'idle' | 'ending'
  stats: Stats
  arenaWidth: number
  arenaHeight: number
  onSelect: (id: string | null) => void
  isSelected: boolean
}

// Random thought bubbles
const THOUGHTS = [
  "🦀 clickety clack",
  "💭 thinking...",
  "✨ vibing",
  "🔧 working hard",
  "☕ need coffee",
  "🎵 ~crab rave~",
  "💤 sleepy...",
  "🌊 miss the ocean",
  "📝 reviewing code",
  "🐛 found a bug!",
  "✅ tests passing",
  "🤔 hmm...",
  "🎉 ship it!",
  "⌨️ clackity clack",
  "🍕 hungry",
]

const ACTIVE_THOUGHTS = [
  "🔧 working...",
  "⚡ processing",
  "🧠 thinking hard",
  "✨ almost done",
  "📝 writing code",
  "🔍 searching...",
]

// Calculate mood from stats
function calculateMood(stats: Stats, status: string): Mood {
  if (status === 'ending') return 'sleeping'
  if (status === 'idle') return 'okay' // Idle sessions are just chilling

  const avg = (stats.energy + stats.health + stats.happiness + stats.discipline) / 4
  if (avg >= 75) return 'happy'
  if (avg >= 50) return 'okay'
  if (avg >= 30) return 'sad'
  return 'sick'
}

const CRAB_WIDTH = 100
const CRAB_HEIGHT = 80
const MOVE_DURATION = 2000 // ms for each movement
const PAUSE_DURATION = 1500 // ms to pause between moves
const STEP_SIZE = 40 // pixels per move

export default function WanderingCrab({
  id,
  accessoryId,
  status,
  stats,
  arenaWidth,
  arenaHeight,
  onSelect,
  isSelected
}: WanderingCrabProps) {
  const controls = useAnimationControls()
  const [position, setPosition] = useState(() => ({
    x: Math.random() * (arenaWidth - CRAB_WIDTH),
    y: Math.random() * (arenaHeight - CRAB_HEIGHT - 30) + 20
  }))
  const [direction, setDirection] = useState<'left' | 'right'>(Math.random() > 0.5 ? 'left' : 'right')
  const [isWalking, setIsWalking] = useState(false)
  const [thought, setThought] = useState<string | null>(null)
  const [isPetted, setIsPetted] = useState(false)
  const mounted = useRef(true)

  const mood = calculateMood(stats, status)
  const isSleeping = mood === 'sleeping' || status === 'ending'

  // Random thought bubbles
  useEffect(() => {
    const showThought = () => {
      if (!mounted.current || isSleeping) return

      // 20% chance to show a thought
      if (Math.random() > 0.2) {
        // Schedule next check
        setTimeout(showThought, 5000 + Math.random() * 10000)
        return
      }

      // Pick a thought based on status
      const thoughts = status === 'active' ? ACTIVE_THOUGHTS : THOUGHTS
      const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)]
      setThought(randomThought)

      // Hide after 2-3 seconds
      setTimeout(() => {
        if (mounted.current) setThought(null)
      }, 2000 + Math.random() * 1000)

      // Schedule next thought
      setTimeout(showThought, 8000 + Math.random() * 15000)
    }

    // Start thought cycle after random delay
    const startDelay = setTimeout(showThought, 3000 + Math.random() * 5000)
    return () => clearTimeout(startDelay)
  }, [status, isSleeping])

  // Pet animation
  const handlePet = () => {
    setIsPetted(true)
    setThought("💕")
    setTimeout(() => {
      if (mounted.current) {
        setIsPetted(false)
        setThought(null)
      }
    }, 800)
  }

  // Random walk logic
  const doRandomMove = useCallback(() => {
    if (!mounted.current || isSleeping) return

    // Decide: walk or stay?
    const shouldWalk = Math.random() > 0.3

    if (!shouldWalk) {
      // Just pause, then try again
      setTimeout(() => {
        if (mounted.current) doRandomMove()
      }, PAUSE_DURATION)
      return
    }

    // Pick a direction (crabs walk sideways!)
    const newDirection = Math.random() > 0.5 ? 'left' : 'right'
    setDirection(newDirection)
    setIsWalking(true)

    // Calculate new position
    const deltaX = newDirection === 'left' ? -STEP_SIZE : STEP_SIZE
    const newX = Math.max(0, Math.min(arenaWidth - CRAB_WIDTH, position.x + deltaX))

    // Occasionally move up/down slightly
    const deltaY = (Math.random() - 0.5) * 20
    const newY = Math.max(20, Math.min(arenaHeight - CRAB_HEIGHT - 10, position.y + deltaY))

    // Animate to new position
    controls.start({
      x: newX,
      y: newY,
      transition: { duration: MOVE_DURATION / 1000, ease: 'linear' }
    })

    setPosition({ x: newX, y: newY })

    // After move completes, pause and do another
    setTimeout(() => {
      if (mounted.current) {
        setIsWalking(false)
        setTimeout(() => {
          if (mounted.current) doRandomMove()
        }, PAUSE_DURATION + Math.random() * 1000)
      }
    }, MOVE_DURATION)
  }, [controls, arenaWidth, arenaHeight, position, isSleeping])

  // Start wandering
  useEffect(() => {
    mounted.current = true

    // Initial position
    controls.set({ x: position.x, y: position.y })

    // Start walking after a random delay
    const startDelay = setTimeout(() => {
      if (mounted.current) doRandomMove()
    }, Math.random() * 2000)

    return () => {
      mounted.current = false
      clearTimeout(startDelay)
    }
  }, []) // Only run once on mount

  // Restart walking when mood changes from sleeping
  useEffect(() => {
    if (!isSleeping && mounted.current) {
      const delay = setTimeout(() => doRandomMove(), 1000)
      return () => clearTimeout(delay)
    }
  }, [isSleeping])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Double click to pet, single click to select
    onSelect(isSelected ? null : id)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handlePet()
  }

  return (
    <motion.div
      className="absolute cursor-pointer group"
      animate={controls}
      initial={{ x: position.x, y: position.y }}
      style={{
        width: CRAB_WIDTH,
        height: CRAB_HEIGHT,
        zIndex: isSelected ? 50 : 1
      }}
      onPointerDown={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Thought bubble */}
      <AnimatePresence>
        {thought && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.8 }}
          >
            <div className="px-2 py-1 bg-white/90 rounded-lg text-[10px] text-neutral-800 shadow-lg">
              {thought}
            </div>
            {/* Speech bubble tail */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white/90 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity sparkles for active sessions */}
      {status === 'active' && !thought && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-[10px]">✨</span>
        </motion.div>
      )}

      {/* Crab container - flips based on direction */}
      <motion.div
        className="relative"
        animate={{
          scaleX: direction === 'left' ? -1 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Pet animation + Walking animation */}
        <motion.div
          animate={
            isPetted
              ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, -5, 0] }
              : isWalking && !isSleeping
              ? { y: [0, -2, 0, -2, 0], rotate: [0, -1, 0, 1, 0] }
              : {}
          }
          transition={{
            duration: isPetted ? 0.4 : 0.3,
            repeat: isPetted ? 0 : isWalking ? Infinity : 0,
            ease: isPetted ? 'easeOut' : 'linear'
          }}
        >
          <Clawd mood={isPetted ? 'happy' : mood} scale={0.6} accessoryId={accessoryId} />
        </motion.div>
      </motion.div>

      {/* Status indicator */}
      <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
        status === 'active' ? 'bg-green-500 animate-pulse' :
        status === 'idle' ? 'bg-yellow-500' :
        'bg-neutral-500'
      }`} />
    </motion.div>
  )
}
