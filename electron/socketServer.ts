import * as net from 'net'
import * as fs from 'fs'
import { EventEmitter } from 'events'

const SOCKET_PATH = '/tmp/claudegotchi.sock'

export interface HookEvent {
  session_id: string
  cwd: string
  event: string
  status: string
  pid?: number
  tty?: string
  tool?: string
  tool_input?: Record<string, unknown>
}

export class SocketServer extends EventEmitter {
  private server: net.Server | null = null

  start(): void {
    // Remove stale socket file
    try {
      if (fs.existsSync(SOCKET_PATH)) {
        fs.unlinkSync(SOCKET_PATH)
      }
    } catch {
      // Ignore errors
    }

    this.server = net.createServer((socket) => {
      let buffer = ''

      socket.on('data', (data) => {
        buffer += data.toString()

        // Process complete JSON messages (newline-delimited)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line) as HookEvent
              this.emit('event', event)
            } catch {
              console.error('Failed to parse hook event:', line)
            }
          }
        }
      })

      socket.on('error', () => {
        // Client disconnected - ignore
      })
    })

    this.server.listen(SOCKET_PATH, () => {
      // Set permissions so any user can connect
      try {
        fs.chmodSync(SOCKET_PATH, 0o777)
      } catch {
        // Ignore
      }
      console.log('ClawdGotchi socket server listening on', SOCKET_PATH)
    })

    this.server.on('error', (err) => {
      console.error('Socket server error:', err)
    })
  }

  stop(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }

    // Clean up socket file
    try {
      if (fs.existsSync(SOCKET_PATH)) {
        fs.unlinkSync(SOCKET_PATH)
      }
    } catch {
      // Ignore
    }
  }
}
