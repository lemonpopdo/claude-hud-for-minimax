---
description: Setup MiniMax Claude HUD - configure API key and statusline
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# Setup MiniMax Claude HUD

This plugin sets up a real-time statusline HUD for Claude Code, optimized for MiniMax API users.

---

## Step 0: Ask for MiniMax API Key

**FIRST**: Ask the user for their MiniMax API Key using AskUserQuestion:
- header: "API Key"
- question: "Enter your MiniMax API Key (ANTHROPIC_AUTH_TOKEN):"
- multiSelect: false
- options:
  - "I have my API Key" - Proceed to input
  - "I don't have one" - Show instructions to get one from MiniMax platform

If user selects "I don't have one", tell them:
> Please get your API Key from the MiniMax platform first, then come back and run `/minimax-hud:setup` again.
> You can find it at: https://platform.minimaxi.com/

**IMPORTANT**: Store the API key the user provides as `apiKey`.

---

## Step 1: Detect Platform, Shell, and Runtime

**IMPORTANT**: Use the environment context values (`Platform:` and `Shell:`), not `uname -s` or ad-hoc checks.

| Platform | Shell | Command Format |
|----------|-------|----------------|
| `darwin` | any | bash (macOS instructions) |
| `linux` | any | bash (Linux instructions) |
| `win32` | `bash` (Git Bash, MSYS2) | bash - use macOS/Linux instructions. Never use PowerShell commands with bash. |
| `win32` | `powershell`, `pwsh`, or `cmd` | PowerShell (use Windows + PowerShell instructions) |

---

**macOS/Linux** (Platform: `darwin` or `linux`):

1. Get plugin path (sorted by dotted numeric version, not modification time):
   ```bash
   ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/minimax-claude-hud/minimax-claude-hud/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $(0) }' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-
   ```
   If empty, the plugin is not installed. Ask the user to install via `/plugin install https://github.com/lemonpopdo/claude-hud-for-minimax` first.

2. Get runtime absolute path (prefer bun for performance, fallback to node):
   ```bash
   command -v bun 2>/dev/null || command -v node 2>/dev/null
   ```

   If empty, stop and explain that the current shell cannot find `bun` or `node`.
   - Recommend installing via: `winget install OpenJS.NodeJS.LTS` (or bun from https://bun.sh/)
   - After installation, restart shell and re-run `/minimax-hud:setup`.

3. Verify the runtime exists:
   ```bash
   ls -la {RUNTIME_PATH}
   ```

4. Determine source file based on runtime:
   ```bash
   basename {RUNTIME_PATH}
   ```
   If result is "bun", use `src/index.ts`. Otherwise use `dist/index.js`.

5. Generate command:

   **When runtime is bun** - add `--env-file /dev/null`:
   ```
   bash -c 'plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/minimax-claude-hud/minimax-claude-hud/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $0 }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{RUNTIME_PATH}" --env-file /dev/null "${plugin_dir}{SOURCE}"'
   ```

   **When runtime is node**:
   ```
   bash -c 'plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/minimax-claude-hud/minimax-claude-hud/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $0 }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{RUNTIME_PATH}" "${plugin_dir}{SOURCE}"'
   ```

**Windows + Git Bash** (Platform: `win32`, Shell: `bash`):

Use the macOS/Linux bash instructions above - same detection commands and format.

**Windows + PowerShell** (Platform: `win32`, Shell: `powershell`, `pwsh`, or `cmd`):

1. Get plugin path:
   ```powershell
   $claudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
   (Get-ChildItem (Join-Path $claudeDir "plugins\cache\minimax-claude-hud\minimax-claude-hud") -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName
   ```
   If empty or errors, ask user to install via `/plugin install https://github.com/lemonpopdo/claude-hud-for-minimax`.

2. Get runtime absolute path (prefer bun, fallback to node):
   ```powershell
   if (Get-Command bun -ErrorAction SilentlyContinue) { (Get-Command bun).Source } elseif (Get-Command node -ErrorAction SilentlyContinue) { (Get-Command node).Source } else { Write-Error "Neither bun nor node found" }
   ```

   If neither found, stop and explain to install Node.js or Bun.

3. Check if runtime is bun (by filename). If bun, use `src\index.ts`. Otherwise use `dist\index.js`.

4. Generate command:

   **When runtime is bun** - add `--env-file NUL`:
   ```
   powershell -Command "& {$claudeDir=if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME '.claude' }; $p=(Get-ChildItem (Join-Path $claudeDir 'plugins\cache\minimax-claude-hud\minimax-claude-hud') -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName; & '{RUNTIME_PATH}' '--env-file' 'NUL' (Join-Path $p '{SOURCE}')}"
   ```

   **When runtime is node**:
   ```
   powershell -Command "& {$claudeDir=if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME '.claude' }; $p=(Get-ChildItem (Join-Path $claudeDir 'plugins\cache\minimax-claude-hud\minimax-claude-hud') -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName; & '{RUNTIME_PATH}' (Join-Path $p '{SOURCE}')}"
   ```

---

## Step 2: Write MiniMax API Config

**FIRST**: Read the current settings file:
- **bash**: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json`
- **PowerShell**: `Join-Path $HOME ".claude/settings.json"`

Merge the MiniMax environment config into existing settings. Write the following fields:
- `env.ANTHROPIC_AUTH_TOKEN` = the API Key from Step 0
- `env.ANTHROPIC_BASE_URL` = `https://api.minimaxi.com/anthropic` (default, ask if user wants to change)
- `env.ANTHROPIC_MODEL` = `MiniMax-M2.5-highspeed` (default, ask if user wants to change)

**Before writing**, ask the user:
- header: "API Config"
- question: "Use default MiniMax API settings? (BASE_URL: https://api.minimaxi.com/anthropic, MODEL: MiniMax-M2.5-highspeed)"
- multiSelect: false
- options:
  - "Yes, use defaults" - Use the defaults above
  - "Customize" - Ask for custom BASE_URL and MODEL values via AskUserQuestion

Merge with existing settings (preserve all other fields). If the file doesn't exist, create it with only the env fields.

---

## Step 3: Test HUD Command

Run the generated command. It should produce output within a few seconds.

- If it errors, do not proceed to Step 4.
- If it hangs for more than a few seconds, cancel and debug.

---

## Step 4: Apply StatusLine Config

Read the settings file and merge in the statusLine config, preserving all existing settings:
- **bash**: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json`
- **PowerShell**: `Join-Path $HOME ".claude/settings.json"`

Merge:
```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

If the file doesn't exist, create it. If it contains invalid JSON, report the error and do not overwrite.
If a write fails with "File has been unexpectedly modified", re-read the file and retry the merge once.

After successfully writing:

> **Config written successfully!**
> - MiniMax API key has been saved to settings.json
> - StatusLine command has been configured
>
> **Please restart Claude Code now** — quit and run `claude` again in your terminal.
> Once restarted, run `/minimax-hud:setup` again to complete Step 5.

---

## Step 5: Optional Features

After the statusLine is applied and user has restarted, ask:

Use AskUserQuestion:
- header: "Extras"
- question: "Enable any optional HUD features? (all hidden by default)"
- multiSelect: true
- options:
  - "Tools activity" — Shows running/completed tools (◐ Edit: file.ts | ✓ Read ×3)
  - "Agents & Todos" — Shows subagent status and todo progress
  - "Session info" — Shows session duration and config counts (CLAUDE.md, rules, MCPs)
  - "Session name" — Shows session slug or custom title from /rename
  - "Custom line" — Display a custom phrase in the HUD

**If user selects any options**, write `plugins/minimax-claude-hud/config.json` inside the Claude config directory. Create directories if needed:

| Selection | Config keys |
|-----------|------------|
| Tools activity | `display.showTools: true` |
| Agents & Todos | `display.showAgents: true, display.showTodos: true` |
| Session info | `display.showDuration: true, display.showConfigCounts: true` |
| Session name | `display.showSessionName: true` |
| Custom line | `display.customLine: "<user's text>"` — ask user for the text (max 80 chars) |

Merge with existing config if the file already exists. Only write keys the user selected.

**If user selects nothing**, do not create a config file. Defaults are fine.

---

## Step 6: Verify & Finish

**Confirm the user has restarted Claude Code** since Step 4 wrote the config.

Use AskUserQuestion:
- Question: "Setup complete! The HUD should appear below your input field. Is it working?"
- Options: "Yes, it's working" / "No, something's wrong"

**If yes**: Tell the user to push their changes to GitHub and consider submitting a PR or starring the repo.

**If no**: Debug systematically:
1. Restart Claude Code completely
2. Verify config was applied by reading settings.json
3. Test the command manually and capture error output
4. Check common issues (runtime path, permission, plugin not installed)
5. Show the exact command generated and error if still stuck
