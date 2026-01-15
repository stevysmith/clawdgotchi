import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import WanderingCrab from './WanderingCrab'
import type { Stats } from './ClawdGotchi'

export interface Session {
  id: string
  cwd: string
  repoName: string
  accessoryId: number
  startTime: number
  lastActivity: number
  status: 'active' | 'idle' | 'ending'
  stats: Stats
}

interface MultiPetViewProps {
  sessions: Session[]
}

// Stat bar for detail panel
function StatBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-4">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-[9px] mb-0.5">
          <span className="text-neutral-400">{label}</span>
          <span className="text-neutral-300 font-bold">{value}%</span>
        </div>
        <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: value > 60 ? '#22C55E' : value > 30 ? '#EAB308' : '#EF4444'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
}

// Get tips based on stats
function getTips(stats: Stats): string[] {
  const tips: string[] = []

  if (stats.energy < 50) {
    tips.push("💡 Commit more often to boost energy")
  }
  if (stats.health < 50) {
    tips.push("💡 Commit or stash changes to improve health")
  }
  if (stats.happiness < 50) {
    tips.push("💡 Add CLAUDE.md for +25% happiness")
  }
  if (stats.happiness < 75 && stats.discipline < 75) {
    tips.push("💡 Add a test/ folder for +25% happiness & discipline")
  }
  if (stats.discipline < 50) {
    tips.push("💡 Keep uncommitted changes under 5 files")
  }

  return tips.slice(0, 2) // Max 2 tips at a time
}

export default function MultiPetView({ sessions }: MultiPetViewProps) {
  const arenaRef = useRef<HTMLDivElement>(null)
  const [arenaSize, setArenaSize] = useState({ width: 300, height: 250 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  // Get selected session
  const selectedSession = selectedId ? sessions.find(s => s.id === selectedId) : null

  // Update arena size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (arenaRef.current) {
        setArenaSize({
          width: arenaRef.current.offsetWidth,
          height: arenaRef.current.offsetHeight
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Clear selection if session is removed
  useEffect(() => {
    if (selectedId && !sessions.find(s => s.id === selectedId)) {
      setSelectedId(null)
    }
  }, [sessions, selectedId])

  if (sessions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#2D2D2D] rounded-xl border border-neutral-700 p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute text-4xl"
            style={{ top: '20%', left: '10%' }}
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🐚
          </motion.div>
          <motion.div
            className="absolute text-3xl"
            style={{ top: '60%', right: '15%' }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            🌊
          </motion.div>
          <motion.div
            className="absolute text-2xl"
            style={{ bottom: '25%', left: '20%' }}
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌿
          </motion.div>
        </div>

        <motion.div
          className="text-6xl mb-4 relative z-10"
          animate={{
            y: [0, -10, 0],
            rotate: [0, -3, 3, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🦀
        </motion.div>
        <motion.p
          className="text-neutral-400 text-sm font-mono text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No crabs yet...
        </motion.p>
        <p className="text-neutral-500 text-xs font-mono text-center mt-2 relative z-10">
          Start a Claude Code session to hatch a crab!
        </p>
        <motion.div
          className="mt-4 text-[10px] text-neutral-600 font-mono relative z-10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          waiting by the shore...
        </motion.div>
      </div>
    )
  }

  // Calculate average health across all sessions
  const avgHealth = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => {
        const avg = (s.stats.energy + s.stats.health + s.stats.happiness + s.stats.discipline) / 4
        return sum + avg
      }, 0) / sessions.length)
    : 0

  const activeCount = sessions.filter(s => s.status === 'active').length

  return (
    <div className="w-full h-full bg-[#2D2D2D] rounded-xl overflow-hidden flex flex-col font-mono border border-neutral-700">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-700 bg-[#252525] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🦀</span>
          <span className="text-xs font-bold tracking-tight text-neutral-200">ClawdGotchi</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-1 rounded transition-colors ${showHelp ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="How to play"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.93 4.94c.66 0 1.2.19 1.61.56.42.37.63.86.63 1.48 0 .42-.12.78-.36 1.08-.24.3-.52.52-.84.67-.26.12-.41.25-.45.4-.04.14-.06.3-.06.48v.39H7.9v-.47c0-.35.05-.64.16-.87.11-.23.33-.44.67-.63.28-.15.47-.3.58-.46.11-.16.17-.34.17-.55 0-.26-.09-.47-.26-.62-.17-.16-.42-.24-.74-.24-.34 0-.62.1-.82.28-.2.18-.32.44-.37.77H5.7c.06-.65.32-1.17.78-1.54.46-.38 1.06-.57 1.8-.57zM8 11.27c.28 0 .5.08.67.25.17.17.26.38.26.64 0 .25-.09.46-.26.63-.17.17-.4.26-.67.26-.28 0-.5-.09-.67-.26a.86.86 0 01-.26-.63c0-.26.09-.47.26-.64.17-.17.4-.25.67-.25z"/>
            </svg>
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800 border border-neutral-600 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-neutral-400">
              {activeCount} active
            </span>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="bg-[#1a1a1a] border-b border-neutral-700 shrink-0 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 space-y-2 text-[10px]">
              <div className="font-bold text-neutral-300 text-xs">How Stats Work</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-400">⚡ Energy:</span>
                  <span className="text-neutral-500 ml-1">Commit frequently</span>
                </div>
                <div>
                  <span className="text-neutral-400">❤️ Health:</span>
                  <span className="text-neutral-500 ml-1">Keep changes small</span>
                </div>
                <div>
                  <span className="text-neutral-400">😊 Happiness:</span>
                  <span className="text-neutral-500 ml-1">Add CLAUDE.md + tests</span>
                </div>
                <div>
                  <span className="text-neutral-400">📏 Discipline:</span>
                  <span className="text-neutral-500 ml-1">Stay organized</span>
                </div>
              </div>
              <div className="pt-1 border-t border-neutral-800 text-neutral-500 space-y-1">
                <div><span className="text-neutral-400">🎯 Click</span> a crab to see details</div>
                <div><span className="text-neutral-400">💕 Double-click</span> to pet them!</div>
                <div><span className="text-neutral-400">🎨 Accessories</span> are unique per repo</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arena - where crabs wander */}
      <div
        ref={arenaRef}
        className="flex-1 relative overflow-hidden bg-[#1a1a1a]"
        onPointerDown={(e) => {
          // Only deselect if clicking directly on the arena background
          if (e.target === e.currentTarget) {
            setSelectedId(null)
          }
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(42, 157, 143, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(230, 57, 70, 0.05) 0%, transparent 50%)
          `
        }}
      >
        {/* Subtle floor pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.03) 50%, transparent 51%),
              linear-gradient(transparent 49%, rgba(255,255,255,0.03) 50%, transparent 51%)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Ambient decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Little shell */}
          <div className="absolute bottom-4 left-[15%] text-lg opacity-30">🐚</div>
          {/* Seaweed */}
          <motion.div
            className="absolute bottom-2 right-[20%] text-xl opacity-20"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🌿
          </motion.div>
          {/* Starfish */}
          <div className="absolute bottom-6 right-[60%] text-sm opacity-25">⭐</div>
          {/* Bubbles that float up occasionally */}
          <motion.div
            className="absolute bottom-0 left-[40%] text-xs opacity-40"
            animate={{ y: [0, -100], opacity: [0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
          >
            ○
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[70%] text-[10px] opacity-30"
            animate={{ y: [0, -80], opacity: [0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 8, delay: 2 }}
          >
            ○
          </motion.div>
        </div>

        {/* Wandering crabs */}
        <AnimatePresence>
          {sessions.map((session) => (
            <WanderingCrab
              key={session.id}
              id={session.id}
              accessoryId={session.accessoryId}
              status={session.status}
              stats={session.stats}
              arenaWidth={arenaSize.width}
              arenaHeight={arenaSize.height}
              onSelect={setSelectedId}
              isSelected={selectedId === session.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Panel - shows when a crab is selected */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="bg-[#252525] border-t border-neutral-700 shrink-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-200 truncate">
                      {selectedSession.repoName}
                    </span>
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                      selectedSession.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      selectedSession.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-neutral-500/20 text-neutral-400'
                    }`}>
                      {selectedSession.status}
                    </div>
                  </div>
                  <div className="text-[9px] text-neutral-500 truncate" title={selectedSession.cwd}>
                    {selectedSession.cwd}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="ml-2 p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5 2.5 3.205 5.295 6 2.5 8.795 3.205 9.5 6 6.705 8.795 9.5 9.5 8.795 6.705 6z"/>
                  </svg>
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <StatBar label="Energy" value={selectedSession.stats.energy} icon="⚡" />
                <StatBar label="Health" value={selectedSession.stats.health} icon="❤️" />
                <StatBar label="Happiness" value={selectedSession.stats.happiness} icon="😊" />
                <StatBar label="Discipline" value={selectedSession.stats.discipline} icon="📏" />
              </div>

              {/* Tips */}
              {getTips(selectedSession.stats).length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-700 space-y-1">
                  {getTips(selectedSession.stats).map((tip, i) => (
                    <div key={i} className="text-[9px] text-amber-400/80">
                      {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - only show when no selection */}
      {!selectedSession && (
        <div className="px-3 py-1.5 bg-[#252525] border-t border-neutral-700 shrink-0">
          <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono">
            <span>{sessions.length} crab{sessions.length !== 1 ? 's' : ''} wandering</span>
            <span>{avgHealth}% avg health</span>
          </div>
        </div>
      )}
    </div>
  )
}
