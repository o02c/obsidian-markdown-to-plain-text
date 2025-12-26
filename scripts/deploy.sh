#!/bin/bash
set -e

if [ -z "$VAULT_PATH" ]; then
    echo "Error: VAULT_PATH is not set. Run 'direnv allow' or set it manually."
    exit 1
fi

PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/selection-to-file"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$PLUGIN_DIR"

cp "$SCRIPT_DIR/main.js" "$PLUGIN_DIR/"
cp "$SCRIPT_DIR/manifest.json" "$PLUGIN_DIR/"

echo "Deployed to: $PLUGIN_DIR"
echo "Restart Obsidian and enable the plugin in Settings > Community plugins"
