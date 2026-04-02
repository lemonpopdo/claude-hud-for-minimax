---
description: Set or update your MiniMax API Key for the HUD quota display
allowed-tools: Read, Write, Bash, AskUserQuestion
---

# Set MiniMax API Key

Quickly configure your MiniMax API Key without running the full setup wizard.

---

## Step 1: Check Current State

Read `~/.claude/settings.json` (or `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json` on bash).

Check if `env.ANTHROPIC_AUTH_TOKEN` is already set.

---

## Step 2: Ask User

### If API key is already set:

Use AskUserQuestion:
- header: "API Key"
- question: "An API Key is already configured. What would you like to do?"
- multiSelect: false
- options:
  - "Keep it" - Do nothing, say "No changes made."
  - "Update it" - Proceed to Step 3 to enter a new key
  - "Remove it" - Remove ANTHROPIC_AUTH_TOKEN from settings.json, say "API Key removed."

### If API key is NOT set:

Use AskUserQuestion:
- header: "API Key"
- question: "Enter your MiniMax API Key (ANTHROPIC_AUTH_TOKEN):"
- multiSelect: false
- options:
  - "I have my API Key" - Proceed to Step 3
  - "I don't have one" - Show instructions: "Get your API Key from https://platform.minimaxi.com/ → API Keys, then run /minimax-hud:set-apikey again."

---

## Step 3: Input & Validate

**If user chose "Update it" or "I have my API Key":**

Use AskUserQuestion to prompt for the actual key value (free text input). Validate:
- Must start with `sk-`
- Must be at least 20 characters long

If validation fails, say: "Invalid API Key format. It should start with `sk-` and be at least 20 characters. Please try again." and re-prompt (loop up to 3 times).

---

## Step 4: Write to settings.json

Read current `~/.claude/settings.json`.

Merge in the new token:
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<user's key>",
    "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
    "ANTHROPIC_MODEL": "MiniMax-M2.5-highspeed"
  }
}
```

**IMPORTANT**: Preserve ALL existing fields in the settings file. Only update/overwrite the `env` section. If `env` already has other keys (e.g. from other plugins), preserve them too.

If the file doesn't exist, create it with the `env` block only.

If JSON is invalid, report the error and stop without overwriting.

---

## Step 5: Test

Find the plugin path and test the HUD command:

**bash**:
```bash
plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/minimax-claude-hud/minimax-claude-hud/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-)
echo "Plugin dir: $plugin_dir"

# Detect runtime
runtime=$(command -v bun 2>/dev/null || command -v node 2>/dev/null)
echo "Runtime: $runtime"

# Detect source
source_file="src/index.ts"
if basename "$runtime" | grep -qv "^bun$"; then
  source_file="dist/index.js"
fi
echo "Source: $source_file"

# Build command
if basename "$runtime" | grep -q "^bun$"; then
  cmd="exec \"$runtime\" --env-file /dev/null \"${plugin_dir}${source_file}\""
else
  cmd="exec \"$runtime\" \"${plugin_dir}${source_file}\""
fi
echo "Testing HUD..."
timeout 8 bash -c "$cmd" 2>&1 | head -5
echo "Exit code: $?"
```

Run this and capture output. A successful test should show HUD output lines.

If the output contains "MiniMax" quota data, the API key works.
If it says "No ANTHROPIC_AUTH_TOKEN" or times out with no output, there's an issue.

---

## Step 6: Report

**If test succeeded (shows MiniMax quota)**:
> API Key saved and verified!
> - MiniMax quota should now appear in your HUD
> - If the HUD doesn't update immediately, restart Claude Code

**If test failed**:
> API Key saved, but couldn't verify it yet.
> - The HUD requires a restart to pick up the new key: **quit Claude Code and run `claude` again**
> - If quota still doesn't appear after restart, check your API Key at https://platform.minimaxi.com/
