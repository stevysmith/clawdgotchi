import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks')
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json')
const HOOK_SCRIPT_NAME = 'claudegotchi_hook.py'

// Hook events we want to listen to
const HOOK_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Stop',
  'SubagentStop'
]

interface HookConfig {
  type: string
  command: string
}

interface HookMatcher {
  matcher?: string
  hooks: HookConfig[]
}

interface Settings {
  hooks?: Record<string, HookMatcher[]>
  [key: string]: unknown
}

function getHookCommand(): string {
  const hookPath = path.join(HOOKS_DIR, HOOK_SCRIPT_NAME)
  return `python3 "${hookPath}"`
}

function createHookConfig(): HookMatcher {
  return {
    hooks: [
      {
        type: 'command',
        command: getHookCommand()
      }
    ]
  }
}

function createToolHookConfig(): HookMatcher {
  return {
    matcher: '*',
    hooks: [
      {
        type: 'command',
        command: getHookCommand()
      }
    ]
  }
}

export async function installHooks(isDev: boolean): Promise<void> {
  try {
    // Ensure directories exist
    await fs.promises.mkdir(HOOKS_DIR, { recursive: true })

    // Get path to bundled hook script
    let hookSourcePath: string
    if (isDev) {
      hookSourcePath = path.join(__dirname, '../assets/hooks', HOOK_SCRIPT_NAME)
    } else {
      hookSourcePath = path.join(process.resourcesPath, 'hooks', HOOK_SCRIPT_NAME)
    }

    // Copy hook script
    const hookDestPath = path.join(HOOKS_DIR, HOOK_SCRIPT_NAME)

    // Check if source exists
    if (!fs.existsSync(hookSourcePath)) {
      console.error('Hook script not found at:', hookSourcePath)
      return
    }

    await fs.promises.copyFile(hookSourcePath, hookDestPath)
    await fs.promises.chmod(hookDestPath, 0o755)

    console.log('Installed hook script to:', hookDestPath)

    // Update settings.json
    let settings: Settings = {}
    try {
      const content = await fs.promises.readFile(SETTINGS_PATH, 'utf8')
      settings = JSON.parse(content)
    } catch {
      // File doesn't exist or is invalid - start fresh
    }

    // Ensure hooks object exists
    if (!settings.hooks) {
      settings.hooks = {}
    }

    // Add our hook configurations
    const ourHookCommand = getHookCommand()

    for (const eventName of HOOK_EVENTS) {
      const needsMatcher = ['PreToolUse', 'PostToolUse'].includes(eventName)
      const newConfig = needsMatcher ? createToolHookConfig() : createHookConfig()

      if (!settings.hooks[eventName]) {
        settings.hooks[eventName] = []
      }

      // Check if our hook is already installed
      const hasOurHook = settings.hooks[eventName].some(matcher =>
        matcher.hooks?.some(hook => hook.command === ourHookCommand)
      )

      if (!hasOurHook) {
        settings.hooks[eventName].push(newConfig)
      }
    }

    // Write updated settings
    await fs.promises.writeFile(
      SETTINGS_PATH,
      JSON.stringify(settings, null, 2),
      'utf8'
    )

    console.log('Updated Claude settings with ClawdGotchi hooks')
  } catch (error) {
    console.error('Failed to install hooks:', error)
  }
}

export async function uninstallHooks(): Promise<void> {
  try {
    // Remove hook script
    const hookPath = path.join(HOOKS_DIR, HOOK_SCRIPT_NAME)
    try {
      await fs.promises.unlink(hookPath)
    } catch {
      // File may not exist
    }

    // Remove our hooks from settings.json
    try {
      const content = await fs.promises.readFile(SETTINGS_PATH, 'utf8')
      const settings: Settings = JSON.parse(content)

      if (settings.hooks) {
        const ourHookCommand = getHookCommand()

        for (const eventName of Object.keys(settings.hooks)) {
          settings.hooks[eventName] = settings.hooks[eventName].filter(matcher =>
            !matcher.hooks?.some(hook => hook.command === ourHookCommand)
          )

          // Remove empty arrays
          if (settings.hooks[eventName].length === 0) {
            delete settings.hooks[eventName]
          }
        }

        // Remove empty hooks object
        if (Object.keys(settings.hooks).length === 0) {
          delete settings.hooks
        }

        await fs.promises.writeFile(
          SETTINGS_PATH,
          JSON.stringify(settings, null, 2),
          'utf8'
        )
      }
    } catch {
      // Settings file may not exist or be invalid
    }

    console.log('Uninstalled ClawdGotchi hooks')
  } catch (error) {
    console.error('Failed to uninstall hooks:', error)
  }
}
