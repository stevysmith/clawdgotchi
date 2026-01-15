import { app, BrowserWindow, Tray, nativeImage, ipcMain, screen } from 'electron'
import * as path from 'path'
import { execSync } from 'child_process'
import * as fs from 'fs'
import { SocketServer } from './socketServer'
import { SessionManager, Session } from './sessionManager'
import { installHooks, uninstallHooks } from './hookInstaller'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let socketServer: SocketServer | null = null
let sessionManager: SessionManager | null = null

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

// Get the path to the menubar icon (Template version for auto dark/light mode)
function getTrayIconPath(): string {
  if (isDev) {
    // In development, use the assets folder directly
    return path.join(__dirname, '../assets/icons/build/menubar-iconTemplate.png')
  } else {
    // In production, use the extraResources folder
    return path.join(process.resourcesPath, 'menubar-iconTemplate.png')
  }
}

// Create tray icon from file (macOS Template icons auto-adapt to dark/light mode)
function createTrayIcon() {
  const iconPath = getTrayIconPath()
  const icon = nativeImage.createFromPath(iconPath)
  // Mark as template for macOS dark/light mode support
  icon.setTemplateImage(true)
  return icon
}

function createWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 320,
    height: 400,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide()
    }
  })
}

function toggleWindow() {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    const trayBounds = tray?.getBounds()
    if (trayBounds) {
      const windowBounds = mainWindow.getBounds()
      const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
      const y = trayBounds.y + trayBounds.height + 4
      mainWindow.setPosition(x, y)
    }
    mainWindow.show()
    mainWindow.focus()
  }
}

function getRepoHealth(): {
  hasGit: boolean
  hasClaudeMd: boolean
  gitStatus: string
  uncommittedChanges: number
  branch: string
  lastCommitAge: number
  testsExist: boolean
} {
  const cwd = process.cwd()

  try {
    // Check if in a git repo
    const hasGit = fs.existsSync(path.join(cwd, '.git'))
    if (!hasGit) {
      return {
        hasGit: false,
        hasClaudeMd: false,
        gitStatus: '',
        uncommittedChanges: 0,
        branch: '',
        lastCommitAge: Infinity,
        testsExist: false
      }
    }

    // Check for CLAUDE.md
    const hasClaudeMd = fs.existsSync(path.join(cwd, 'CLAUDE.md'))

    // Get git status
    const gitStatus = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
    const uncommittedChanges = gitStatus.split('\n').filter(Boolean).length

    // Get current branch
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim()

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

    return { hasGit, hasClaudeMd, gitStatus, uncommittedChanges, branch, lastCommitAge, testsExist }
  } catch {
    return {
      hasGit: false,
      hasClaudeMd: false,
      gitStatus: '',
      uncommittedChanges: 0,
      branch: '',
      lastCommitAge: Infinity,
      testsExist: false
    }
  }
}

app.whenReady().then(async () => {
  // Install Claude Code hooks
  await installHooks(isDev)

  // Create session manager
  sessionManager = new SessionManager()
  sessionManager.on('update', (sessions: Session[]) => {
    // Send update to renderer
    mainWindow?.webContents.send('sessions-updated', sessions)

    // Resize window based on session count
    resizeWindowForSessions(sessions.length)
  })

  // Create socket server and connect to session manager
  socketServer = new SocketServer()
  socketServer.on('event', (event) => {
    sessionManager?.handleEvent(event)
  })
  socketServer.start()

  // Create tray icon
  tray = new Tray(createTrayIcon())
  tray.setToolTip('ClaudeGotchi')
  tray.on('click', toggleWindow)

  createWindow()

  // IPC handlers
  ipcMain.handle('get-health', () => {
    return getRepoHealth()
  })

  ipcMain.handle('get-sessions', () => {
    return sessionManager?.getSessions() || []
  })

  ipcMain.handle('update-tray-icon', () => {
    // Template icons auto-adapt to system theme, no mood-based updates needed
    tray?.setImage(createTrayIcon())
  })
})

function resizeWindowForSessions(count: number): void {
  if (!mainWindow) return

  if (count <= 0) {
    // No sessions - compact size
    mainWindow.setSize(320, 300)
  } else if (count === 1) {
    // Single crab - medium arena
    mainWindow.setSize(320, 350)
  } else if (count <= 3) {
    // A few crabs - larger arena
    mainWindow.setSize(380, 400)
  } else {
    // Many crabs - big arena
    mainWindow.setSize(420, 450)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Clean up socket server
  socketServer?.stop()
  sessionManager?.stop()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
