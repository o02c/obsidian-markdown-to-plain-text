import { type Editor, Notice, Plugin } from "obsidian";
import { convertMarkdownToPlainText } from "./src/markdown-converter";
import {
	DEFAULT_SETTINGS,
	generatePresetId,
	type PluginSettings,
	type Preset,
	SettingTab,
} from "./src/settings";

const { remote } = require("electron");
// biome-ignore lint/style/useNodejsImportProtocol: Obsidian plugin bundler doesn't support node: protocol
const fs = require("fs");

export default class SelectionToFilePlugin extends Plugin {
	pluginSettings: PluginSettings;
	private presetCommandIds: string[] = [];

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		// Original command: Save as file (raw markdown)
		this.addCommand({
			id: "save-selection-to-file",
			name: "Save selection as file...",
			editorCallback: async (editor: Editor) => {
				const selection = editor.getSelection();
				const content = selection || this.getContentWithoutFrontmatter(editor);

				const defaultFileName = this.generateDefaultFileName(content);

				const result = await remote.dialog.showSaveDialog({
					title: "Save selection to file",
					defaultPath: defaultFileName,
					filters: [
						{ name: "Markdown", extensions: ["md"] },
						{ name: "Text", extensions: ["txt"] },
						{ name: "All Files", extensions: ["*"] },
					],
				});

				if (result.canceled || !result.filePath) {
					return;
				}

				fs.writeFile(
					result.filePath,
					content,
					(err: NodeJS.ErrnoException | null) => {
						if (err) {
							new Notice(`Error: ${err.message}`);
						} else {
							new Notice(`Saved: ${result.filePath}`);
						}
					},
				);
			},
		});

		// Register preset-based commands
		this.registerPresetCommands();
	}

	registerPresetCommands(): void {
		// Unregister old preset commands
		for (const id of this.presetCommandIds) {
			// @ts-expect-error - removeCommand is not in the type definitions
			this.app.commands.removeCommand(`${this.manifest.id}:${id}`);
		}
		this.presetCommandIds = [];

		// Register commands for each preset
		for (const preset of this.pluginSettings.presets) {
			// Copy command
			const copyId = `copy-plain-text-${preset.id}`;
			this.addCommand({
				id: copyId,
				name: `${preset.name} (copy)`,
				editorCallback: async (editor: Editor) => {
					const selection = editor.getSelection();
					const content =
						selection || this.getContentWithoutFrontmatter(editor);

					const converted = convertMarkdownToPlainText(
						content,
						preset.settings,
					);
					await navigator.clipboard.writeText(converted);
					new Notice(
						selection
							? `Copied with "${preset.name}"`
							: `Copied entire file with "${preset.name}"`,
					);
				},
			});
			this.presetCommandIds.push(copyId);

			// Save command
			const saveId = `save-plain-text-${preset.id}`;
			this.addCommand({
				id: saveId,
				name: `${preset.name} (save)`,
				editorCallback: async (editor: Editor) => {
					const selection = editor.getSelection();
					const content =
						selection || this.getContentWithoutFrontmatter(editor);

					const converted = convertMarkdownToPlainText(
						content,
						preset.settings,
					);
					const defaultFileName = this.generateDefaultFileName(content, "txt");

					const result = await remote.dialog.showSaveDialog({
						title: `Save as plain text (${preset.name})`,
						defaultPath: defaultFileName,
						filters: [
							{ name: "Text", extensions: ["txt"] },
							{ name: "All Files", extensions: ["*"] },
						],
					});

					if (result.canceled || !result.filePath) {
						return;
					}

					fs.writeFile(
						result.filePath,
						converted,
						(err: NodeJS.ErrnoException | null) => {
							if (err) {
								new Notice(`Error: ${err.message}`);
							} else {
								new Notice(`Saved: ${result.filePath}`);
							}
						},
					);
				},
			});
			this.presetCommandIds.push(saveId);
		}
	}

	private getContentWithoutFrontmatter(editor: Editor): string {
		const content = editor.getValue();
		const file = this.app.workspace.getActiveFile();
		if (!file) return content;

		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache?.frontmatterPosition) return content;

		const endLine = cache.frontmatterPosition.end.line;
		const lines = content.split("\n");
		return lines
			.slice(endLine + 1)
			.join("\n")
			.trimStart();
	}

	private generateDefaultFileName(content: string, ext: string = "md"): string {
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, 19);
		const firstLine = content.split("\n")[0].trim();
		const sanitized = firstLine.replace(/[<>:"/\\|?*#]/g, "").slice(0, 30);

		if (sanitized.length > 0) {
			return `${sanitized}.${ext}`;
		}
		return `export_${timestamp}.${ext}`;
	}

	async loadSettings() {
		const data = await this.loadData();
		await this.migrateSettings(data);
	}

	private async migrateSettings(data: unknown) {
		// If no data, create default preset
		if (!data) {
			this.pluginSettings = {
				presets: [
					{
						id: generatePresetId(),
						name: "Default",
						settings: { ...DEFAULT_SETTINGS },
					},
				],
			};
			await this.saveSettings();
			return;
		}

		const d = data as Record<string, unknown>;

		// If already has presets array, use it
		if (Array.isArray(d.presets)) {
			this.pluginSettings = data as PluginSettings;

			// Migrate individual preset settings
			let needsSave = false;
			for (const preset of this.pluginSettings.presets) {
				if (this.migratePresetSettings(preset)) {
					needsSave = true;
				}
			}

			if (needsSave) {
				await this.saveSettings();
			}
			return;
		}

		// Old format: single settings object -> migrate to preset
		const oldSettings = Object.assign({}, DEFAULT_SETTINGS, data);

		// Migrate old rule properties
		if (oldSettings.customRules) {
			for (const rule of oldSettings.customRules) {
				const r = rule as unknown as Record<string, unknown>;
				if ("flags" in r) {
					r.caseInsensitive = String(r.flags).includes("i");
					delete r.flags;
				}
				if ("global" in r) {
					delete r.global;
				}
				if (!("name" in r)) {
					r.name = "";
				}
			}
		}

		this.pluginSettings = {
			presets: [
				{
					id: generatePresetId(),
					name: "Default",
					settings: oldSettings,
				},
			],
		};
		await this.saveSettings();
	}

	private migratePresetSettings(preset: Preset): boolean {
		let needsSave = false;

		// Add default customRules if empty
		if (
			!preset.settings.customRules ||
			preset.settings.customRules.length === 0
		) {
			preset.settings.customRules = DEFAULT_SETTINGS.customRules;
			needsSave = true;
		}

		// Migrate old rule properties
		for (const rule of preset.settings.customRules) {
			const r = rule as unknown as Record<string, unknown>;
			if ("flags" in r) {
				r.caseInsensitive = String(r.flags).includes("i");
				delete r.flags;
				needsSave = true;
			}
			if ("global" in r) {
				delete r.global;
				needsSave = true;
			}
			if (!("name" in r)) {
				r.name = "";
				needsSave = true;
			}
		}

		return needsSave;
	}

	async saveSettings() {
		await this.saveData(this.pluginSettings);
	}

	onunload() {}
}
