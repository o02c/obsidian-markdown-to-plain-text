#!/bin/bash
set -e

if [ -z "$VAULT_PATH" ]; then
    echo "Error: VAULT_PATH is not set. Run 'direnv allow' or set it manually."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Get plugin ID from manifest.json and append -dev suffix
PLUGIN_ID=$(node -e "console.log(require('$SCRIPT_DIR/manifest.json').id)" 2>/dev/null || echo "")
if [ -z "$PLUGIN_ID" ]; then
    echo "Error: Could not read plugin ID from manifest.json"
    exit 1
fi

PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/${PLUGIN_ID}-dev"

if [ -d "$PLUGIN_DIR" ]; then
    rm -rf "$PLUGIN_DIR"
    echo "Removed: $PLUGIN_DIR"
else
    echo "Plugin not found: $PLUGIN_DIR"
fi
