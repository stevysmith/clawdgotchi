import { useState, useEffect, useCallback } from 'react'
import ClawdGotchi from './components/ClawdGotchi'
import MultiPetView, { type Session } from './components/MultiPetView'

interface RepoHealth {
  hasGit: boolean
  hasClaudeMd: boolean
  gitStatus: string
  uncommittedChanges: number
  branch: string
  lastCommitAge: number
  testsExist: boolean
}

interface ElectronAPI {
  getHealth: () => Promise<RepoHealth>
  updateTrayIcon: (mood: 'happy' | 'okay' | 'sad' | 'sick') => Promise<void>
  getSessions: () => Promise<Session[]>
  onSessionsUpdate: (callback: (sessions: Session[]) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

type Stage = 'egg' | 'baby' | 'child' | 'adult'
type Mood = 'happy' | 'okay' | 'sad' | 'sick' | 'sleeping'

function calculateStats(health: RepoHealth) {
  // Energy: Based on recent activity (commits)
  let energy = 50
  if (health.lastCommitAge < 1) energy = 100 // Committed in last hour
  else if (health.lastCommitAge < 4) energy = 85
  else if (health.lastCommitAge < 24) energy = 70
  else if (health.lastCommitAge < 72) energy = 40
  else energy = 20

  // Health: Based on git status cleanliness
  let healthStat = 100
  if (health.uncommittedChanges > 20) healthStat = 30
  else if (health.uncommittedChanges > 10) healthStat = 50
  else if (health.uncommittedChanges > 5) healthStat = 70
  else if (health.uncommittedChanges > 0) healthStat = 85

  // Happiness: Based on having good developer practices
  let happiness = 50
  if (health.hasClaudeMd) happiness += 25
  if (health.testsExist) happiness += 25
  if (health.uncommittedChanges < 5) happiness += 10
  if (health.lastCommitAge < 24) happiness += 15
  happiness = Math.min(100, happiness)

  // Discipline: Based on code organization
  let discipline = 60
  if (health.hasClaudeMd) discipline += 20
  if (health.testsExist) discipline += 20
  if (health.uncommittedChanges < 3) discipline += 10
  discipline = Math.min(100, discipline)

  return { energy, health: healthStat, happiness, discipline }
}

function calculateMood(stats: { energy: number; health: number; happiness: number; discipline: number }): Mood {
  const avg = (stats.energy + stats.health + stats.happiness + stats.discipline) / 4

  // Check if it's late night (sleeping)
  const hour = new Date().getHours()
  if (hour >= 23 || hour < 6) {
    return 'sleeping'
  }

  if (avg >= 75) return 'happy'
  if (avg >= 50) return 'okay'
  if (avg >= 30) return 'sad'
  return 'sick'
}

function calculateStage(stats: { energy: number; health: number; happiness: number; discipline: number }): Stage {
  const total = stats.energy + stats.health + stats.happiness + stats.discipline

  // Stage is based on cumulative "care" over time
  // In a real app, this would be persisted and accumulated
  if (total >= 320) return 'adult' // 80+ avg
  if (total >= 240) return 'child' // 60+ avg
  if (total >= 160) return 'baby'  // 40+ avg
  return 'egg'
}

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({
    energy: 50,
    health: 50,
    happiness: 50,
    discipline: 50,
  })
  const [mood, setMood] = useState<Mood>('okay')
  const [stage, setStage] = useState<Stage>('baby')
  const [isLoading, setIsLoading] = useState(true)
  const [useMultiMode, setUseMultiMode] = useState(false)

  // Session tracking for multi-pet mode
  useEffect(() => {
    if (!window.electronAPI?.getSessions) {
      setUseMultiMode(false)
      return
    }

    setUseMultiMode(true)

    // Get initial sessions
    window.electronAPI.getSessions().then((initialSessions) => {
      setSessions(initialSessions)
      setIsLoading(false)
    }).catch((err) => {
      console.error('Failed to get sessions:', err)
      setUseMultiMode(false)
    })

    // Subscribe to session updates
    const unsubscribe = window.electronAPI.onSessionsUpdate((updatedSessions) => {
      setSessions(updatedSessions)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  // Legacy single-repo health tracking (fallback mode)
  const refreshHealth = useCallback(async () => {
    if (useMultiMode) return // Skip if using multi-session mode

    if (!window.electronAPI) {
      // Demo mode for development
      setStats({
        energy: 75,
        health: 85,
        happiness: 90,
        discipline: 70,
      })
      setMood('happy')
      setStage('child')
      setIsLoading(false)
      return
    }

    try {
      const health = await window.electronAPI.getHealth()
      const newStats = calculateStats(health)
      const newMood = calculateMood(newStats)
      const newStage = calculateStage(newStats)

      setStats(newStats)
      setMood(newMood)
      setStage(newStage)

      // Update tray icon based on mood
      if (newMood !== 'sleeping') {
        await window.electronAPI.updateTrayIcon(newMood)
      }
    } catch (err) {
      console.error('Failed to get health:', err)
    } finally {
      setIsLoading(false)
    }
  }, [useMultiMode])

  useEffect(() => {
    if (useMultiMode) return // Skip if using multi-session mode

    refreshHealth()

    // Refresh every 30 seconds
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [refreshHealth, useMultiMode])

  if (isLoading) {
    return (
      <div className="w-80 h-[400px] bg-neutral-900 rounded-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-claude-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-400">Waking up...</span>
        </div>
      </div>
    )
  }

  // Multi-session mode: show all active Claude sessions
  if (useMultiMode) {
    return <MultiPetView sessions={sessions} />
  }

  // Legacy single-pet mode (fallback for demo/development)
  return <ClawdGotchi stage={stage} mood={mood} stats={stats} />
}
