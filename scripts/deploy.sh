#!/bin/bash
set -e

if [ -z "$VAULT_PATH" ]; then
    echo "Error: VAULT_PATH is not set. Run 'direnv allow' or set it manually."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Get plugin ID from manifest.json and append -dev suffix
PLUGIN_ID=$(node -e "console.log(require('./manifest.json').id)" 2>/dev/null || echo "")
if [ -z "$PLUGIN_ID" ]; then
    echo "Error: Could not read plugin ID from manifest.json"
    exit 1
fi

DEV_PLUGIN_ID="${PLUGIN_ID}-dev"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/${DEV_PLUGIN_ID}"

mkdir -p "$PLUGIN_DIR"

cp "$SCRIPT_DIR/main.js" "$PLUGIN_DIR/"

# Create modified manifest with -dev suffix in ID
node -e "
const manifest = require('./manifest.json');
manifest.id = '${DEV_PLUGIN_ID}';
manifest.name = manifest.name + ' (Dev)';
console.log(JSON.stringify(manifest, null, 2));
" > "$PLUGIN_DIR/manifest.json"

echo "Deployed to: $PLUGIN_DIR"
echo "Restart Obsidian and enable the plugin in Settings > Community plugins"
