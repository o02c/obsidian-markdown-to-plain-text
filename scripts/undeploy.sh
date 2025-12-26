#!/bin/bash
set -e

if [ -z "$VAULT_PATH" ]; then
    echo "Error: VAULT_PATH is not set. Run 'direnv allow' or set it manually."
    exit 1
fi

PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/selection-to-file"

if [ -d "$PLUGIN_DIR" ]; then
    rm -rf "$PLUGIN_DIR"
    echo "Removed: $PLUGIN_DIR"
else
    echo "Plugin not found: $PLUGIN_DIR"
fi
