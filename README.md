# Markdown to Plain Text for Obsidian

Convert Markdown to plain text with Unicode formatting and custom regex rules.

## Features

- **Markdown Conversion**: <br>
Convert markdown syntax to Unicode-formatted plain text.<br>
Headings become prefixed with `▌▍▎▏`, bold/italic text uses mathematical Unicode characters, and more.

- **Multiple Presets**: <br>
Create and manage multiple conversion presets for different use cases.<br>
Each preset has its own copy and save commands accessible via command palette.

- **Custom Regex Rules**: <br>
Define your own regex replacement rules to customize the conversion output.<br>
Rules can be applied before or after the markdown conversion.

- **Flexible Output**: <br>
Copy converted text to clipboard or save directly to a file.

## Commands

| Command | Description |
| ------- | ----------- |
| `Save selection as file...` | Save raw markdown to file (no conversion) |
| `{Preset Name} (copy)` | Convert with preset and copy to clipboard |
| `{Preset Name} (save)` | Convert with preset and save to file |

Preset commands are dynamically generated for each preset you create in settings.

## Conversion Options

### Headings
- Custom prefix characters for h1-h4 (default: `▌▍▎▏`)

### Lists
- Bullet character customization (default: `•`)
- Checkbox symbols for checked/unchecked states (default: `☑☐`)

### Text Decoration
- Bold text → Mathematical Bold Unicode (𝐁𝐨𝐥𝐝)
- Italic text → Mathematical Italic Unicode (𝐼𝑡𝑎𝑙𝑖𝑐)
- Strikethrough → Combining strikethrough character (S̶t̶r̶i̶k̶e̶)

### Block Elements
- Horizontal rule replacement (default: `────────────`)
- Blockquote prefix (default: `│ `)

### Code
- Code block line prefix (default: `  `)
- Inline code wrapper (default: `` ` ``)

## Installation

### From Community Plugins (Coming Soon)
1. Open Settings → Community plugins
2. Search for "Markdown to Plain Text"
3. Click Install and Enable

### Manual Installation
1. Create a `markdown-to-plain-text` folder inside your `.obsidian/plugins` directory
2. Download `main.js` and `manifest.json` from the [latest release](https://github.com/o02c/obsidian-markdown-to-plain-text/releases)
3. Place the files inside the folder
4. Restart Obsidian and enable the plugin in Settings → Community plugins

## Usage

1. Select text in the editor (or leave empty to use entire file without frontmatter)
2. Open command palette (`Cmd/Ctrl + P`)
3. Search for your preset name and choose copy or save

## Privacy and Security

This plugin does not transmit any user data externally. All data is kept locally.

## Support

For questions or issues, please use the [GitHub Issues](https://github.com/o02c/obsidian-markdown-to-plain-text/issues) page. Feedback and feature requests are welcome.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/o02c?style=social)](https://github.com/sponsors/o02c)

[![PayPal](https://img.shields.io/badge/paypal-o02c-yellow?style=social&logo=paypal)](https://paypal.me/o02c)

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/_o2c)

## License

This plugin is released under the MIT License. For more details, please refer to the LICENSE file.
