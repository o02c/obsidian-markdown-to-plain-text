/**
 * Obsidian plugin: Markdown to Plain Text
 * Converts markdown content to Unicode-formatted plain text with customizable presets.
 */

import { type Editor, Notice, Plugin } from "obsidian";
import {
	FILE_FILTERS,
	generateDefaultFileName,
	saveToFile,
} from "./src/file-utils";
import { convertMarkdownToPlainText } from "./src/markdown-converter";
import {
	DEFAULT_SETTINGS,
	generatePresetId,
	type PluginSettings,
	type Preset,
	SettingTab,
} from "./src/settings";

// =============================================================================
// Plugin Class
// =============================================================================

export default class SelectionToFilePlugin extends Plugin {
	pluginSettings: PluginSettings;
	private presetCommandIds: string[] = [];

	// ===========================================================================
	// Lifecycle
	// ===========================================================================

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
		this.registerCommands();
	}

	onunload() {}

	// ===========================================================================
	// Command Registration
	// ===========================================================================

	private registerCommands(): void {
		// Raw markdown save command
		this.addCommand({
			id: "save-selection-to-file",
			name: "Save selection as file...",
			editorCallback: async (editor: Editor) => {
				const content = this.getEditorContent(editor);
				await saveToFile(content, {
					title: "Save selection to file",
					defaultPath: generateDefaultFileName(content),
					filters: FILE_FILTERS.markdown,
				});
			},
		});

		// Preset-based commands
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
			this.registerPresetCopyCommand(preset);
			this.registerPresetSaveCommand(preset);
		}
	}

	private registerPresetCopyCommand(preset: Preset): void {
		const copyId = `copy-plain-text-${preset.id}`;
		this.addCommand({
			id: copyId,
			name: `${preset.name} (copy)`,
			editorCallback: async (editor: Editor) => {
				const content = this.getEditorContent(editor);
				const converted = convertMarkdownToPlainText(content, preset.settings);

				await navigator.clipboard.writeText(converted);
				new Notice(
					editor.getSelection()
						? `Copied with "${preset.name}"`
						: `Copied entire file with "${preset.name}"`,
				);
			},
		});
		this.presetCommandIds.push(copyId);
	}

	private registerPresetSaveCommand(preset: Preset): void {
		const saveId = `save-plain-text-${preset.id}`;
		this.addCommand({
			id: saveId,
			name: `${preset.name} (save)`,
			editorCallback: async (editor: Editor) => {
				const content = this.getEditorContent(editor);
				const converted = convertMarkdownToPlainText(content, preset.settings);

				await saveToFile(converted, {
					title: `Save as plain text (${preset.name})`,
					defaultPath: generateDefaultFileName(content, "txt"),
					filters: FILE_FILTERS.text,
				});
			},
		});
		this.presetCommandIds.push(saveId);
	}

	// ===========================================================================
	// Content Extraction
	// ===========================================================================

	private getEditorContent(editor: Editor): string {
		const selection = editor.getSelection();
		return selection || this.getContentWithoutFrontmatter(editor);
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

	// ===========================================================================
	// Settings Persistence
	// ===========================================================================

	async loadSettings() {
		const data = await this.loadData();
		await this.migrateSettings(data);
	}

	async saveSettings() {
		await this.saveData(this.pluginSettings);
	}

	// ===========================================================================
	// Settings Migration
	// ===========================================================================

	private async migrateSettings(data: unknown) {
		// No data - create default preset
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

		// Current format - has presets array
		if (Array.isArray(d.presets)) {
			this.pluginSettings = data as PluginSettings;

			// Migrate individual preset settings if needed
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

		// Old format - single settings object, migrate to preset
		const oldSettings = Object.assign({}, DEFAULT_SETTINGS, data);
		this.migrateOldRuleProperties(
			oldSettings as unknown as Record<string, unknown>,
		);

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

	private migrateOldRuleProperties(settings: Record<string, unknown>): void {
		if (!settings.customRules) return;

		for (const rule of settings.customRules as Record<string, unknown>[]) {
			if ("flags" in rule) {
				rule.caseInsensitive = String(rule.flags).includes("i");
				delete rule.flags;
			}
			if ("global" in rule) {
				delete rule.global;
			}
			if (!("name" in rule)) {
				rule.name = "";
			}
		}
	}
}
