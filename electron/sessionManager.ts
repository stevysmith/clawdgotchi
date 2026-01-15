import { EventEmitter } from 'events'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { HookEvent } from './socketServer'

export interface Session {
  id: string
  cwd: string
  repoName: string
  accessoryId: number
  startTime: number
  lastActivity: number
  status: 'active' | 'idle' | 'ending'
  stats: {
    energy: number
    health: number
    happiness: number
    discipline: number
  }
}

const ACCESSORY_COUNT = 10
const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const ENDING_DURATION = 3000 // 3 seconds before removal

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit int
  }
  return Math.abs(hash)
}

function getAccessoryId(cwd: string): number {
  // Use cwd for deterministic accessory assignment
  // Same repo always gets the same accessory
  return simpleHash(cwd) % ACCESSORY_COUNT
}

function getRepoName(cwd: string): string {
  return path.basename(cwd) || cwd
}

function getRepoHealth(cwd: string): Session['stats'] {
  try {
    const hasGit = fs.existsSync(path.join(cwd, '.git'))
    if (!hasGit) {
      return { energy: 50, health: 50, happiness: 50, discipline: 50 }
    }

    // Check for CLAUDE.md
    const hasClaudeMd = fs.existsSync(path.join(cwd, 'CLAUDE.md'))

    // Get uncommitted changes count
    let uncommittedChanges = 0
    try {
      const gitStatus = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
      uncommittedChanges = gitStatus.split('\n').filter(Boolean).length
    } catch {
      // Ignore
    }

    // Get last commit age in hours
    let lastCommitAge = Infinity
    try {
      const lastCommitTime = execSync('git log -1 --format=%ct', { cwd, encoding: 'utf8' }).trim()
      lastCommitAge = (Date.now() / 1000 - parseInt(lastCommitTime)) / 3600
    } catch {
      // No commits yet
    }

    // Check if tests exist
    const testsExist = fs.existsSync(path.join(cwd, 'test')) ||
                       fs.existsSync(path.join(cwd, 'tests')) ||
                       fs.existsSync(path.join(cwd, '__tests__')) ||
                       fs.existsSync(path.join(cwd, 'spec'))

    // Calculate stats (similar to original App.tsx logic)
    let energy = 100
    if (lastCommitAge > 72) energy = 20
    else if (lastCommitAge > 24) energy = 50
    else if (lastCommitAge > 8) energy = 70
    else if (lastCommitAge > 1) energy = 85

    let health = 100
    if (uncommittedChanges > 20) health = 30
    else if (uncommittedChanges > 10) health = 50
    else if (uncommittedChanges > 5) health = 70
    else if (uncommittedChanges > 0) health = 85

    let happiness = 25
    if (hasClaudeMd) happiness += 25
    if (testsExist) happiness += 25
    if (lastCommitAge < 24) happiness += 15
    if (uncommittedChanges < 5) happiness += 10

    let discipline = 50
    if (hasClaudeMd) discipline += 20
    if (testsExist) discipline += 20
    if (uncommittedChanges < 5) discipline += 10

    return {
      energy: Math.min(100, Math.max(0, energy)),
      health: Math.min(100, Math.max(0, health)),
      happiness: Math.min(100, Math.max(0, happiness)),
      discipline: Math.min(100, Math.max(0, discipline))
    }
  } catch {
    return { energy: 50, health: 50, happiness: 50, discipline: 50 }
  }
}

export class SessionManager extends EventEmitter {
  private sessions: Map<string, Session> = new Map()
  private idleCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    // Check for idle sessions periodically
    this.idleCheckInterval = setInterval(() => this.checkIdleSessions(), 30000)
  }

  handleEvent(event: HookEvent): void {
    const { session_id, cwd, status } = event

    if (!session_id || !cwd) return

    switch (event.event) {
      case 'SessionStart':
        this.createSession(session_id, cwd)
        break

      case 'SessionEnd':
        this.endSession(session_id)
        break

      case 'PreToolUse':
      case 'PostToolUse':
      case 'UserPromptSubmit':
        this.updateActivity(session_id, cwd)
        break

      case 'Stop':
        this.setIdle(session_id)
        break

      default:
        // Update activity for any event
        if (this.sessions.has(session_id)) {
          this.updateActivity(session_id, cwd)
        }
    }
  }

  private createSession(id: string, cwd: string): void {
    if (this.sessions.has(id)) {
      // Session already exists, just update activity
      this.updateActivity(id, cwd)
      return
    }

    const session: Session = {
      id,
      cwd,
      repoName: getRepoName(cwd),
      accessoryId: getAccessoryId(cwd),
      startTime: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      stats: getRepoHealth(cwd)
    }

    this.sessions.set(id, session)
    this.emitUpdate()
  }

  private updateActivity(id: string, cwd: string): void {
    let session = this.sessions.get(id)

    if (!session) {
      // Session doesn't exist, create it
      this.createSession(id, cwd)
      return
    }

    // Update session
    session.lastActivity = Date.now()
    session.status = 'active'
    session.stats = getRepoHealth(cwd)

    this.emitUpdate()
  }

  private setIdle(id: string): void {
    const session = this.sessions.get(id)
    if (session && session.status !== 'ending') {
      session.status = 'idle'
      this.emitUpdate()
    }
  }

  private endSession(id: string): void {
    const session = this.sessions.get(id)
    if (!session) return

    session.status = 'ending'
    this.emitUpdate()

    // Remove after animation duration
    setTimeout(() => {
      this.sessions.delete(id)
      this.emitUpdate()
    }, ENDING_DURATION)
  }

  private checkIdleSessions(): void {
    const now = Date.now()
    let changed = false

    for (const session of this.sessions.values()) {
      if (session.status === 'active' && now - session.lastActivity > IDLE_TIMEOUT) {
        session.status = 'idle'
        changed = true
      }
    }

    if (changed) {
      this.emitUpdate()
    }
  }

  private emitUpdate(): void {
    this.emit('update', this.getSessions())
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => {
      // Sort by status (active first), then by last activity
      if (a.status !== b.status) {
        if (a.status === 'active') return -1
        if (b.status === 'active') return 1
        if (a.status === 'idle') return -1
        return 1
      }
      return b.lastActivity - a.lastActivity
    })
  }

  stop(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval)
      this.idleCheckInterval = null
    }
  }
}
