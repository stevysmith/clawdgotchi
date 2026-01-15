#!/usr/bin/env python3
"""
ClawdGotchi hook - sends Claude Code session events to the desktop app.
Installed to ~/.claude/hooks/ by the ClawdGotchi app.
"""

import json
import os
import socket
import subprocess
import sys

SOCKET_PATH = "/tmp/claudegotchi.sock"
TIMEOUT_SECONDS = 2


def get_tty():
    """Get the TTY of the parent Claude process."""
    try:
        ppid = os.getppid()
        result = subprocess.run(
            ["ps", "-p", str(ppid), "-o", "tty="],
            capture_output=True,
            text=True,
            timeout=1
        )
        tty = result.stdout.strip()
        if tty and tty != "??":
            return tty
    except Exception:
        pass

    # Fallback to checking stdin/stdout
    for fd in [sys.stdin, sys.stdout]:
        try:
            if hasattr(fd, 'fileno') and os.isatty(fd.fileno()):
                return os.ttyname(fd.fileno())
        except Exception:
            pass

    return None


def send_to_app(state):
    """Send state to ClawdGotchi app via Unix socket."""
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(TIMEOUT_SECONDS)
        sock.connect(SOCKET_PATH)
        sock.sendall(json.dumps(state).encode() + b'\n')
        sock.close()
        return True
    except (socket.error, OSError):
        # App may not be running - fail silently
        return False


def main():
    try:
        # Read hook event from stdin
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    # Extract key fields from hook payload
    session_id = data.get("session_id", "unknown")
    event = data.get("hook_event_name", "")
    cwd = data.get("cwd", "")
    tool_name = data.get("tool_name")
    tool_input = data.get("tool_input")

    # Get process info
    claude_pid = os.getppid()
    tty = get_tty()

    # Build state object
    state = {
        "session_id": session_id,
        "cwd": cwd,
        "event": event,
        "pid": claude_pid,
        "tty": tty,
    }

    # Add event-specific fields
    if event == "SessionStart":
        state["status"] = "started"

    elif event == "SessionEnd":
        state["status"] = "ended"

    elif event == "PreToolUse":
        state["status"] = "running_tool"
        state["tool"] = tool_name
        if tool_input:
            state["tool_input"] = tool_input

    elif event == "PostToolUse":
        state["status"] = "tool_complete"
        state["tool"] = tool_name

    elif event == "UserPromptSubmit":
        state["status"] = "processing"

    elif event == "Stop":
        state["status"] = "idle"

    elif event == "SubagentStop":
        state["status"] = "subagent_complete"

    else:
        # Unknown event - still send it
        state["status"] = "unknown"

    # Send to app
    send_to_app(state)

    # Always allow Claude to continue
    sys.exit(0)


if __name__ == "__main__":
    main()
