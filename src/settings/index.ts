/**
 * Main settings tab for the plugin.
 * Delegates to preset UI components for list and editor views.
 */

import { type App, PluginSettingTab } from "obsidian";
import type SelectionToFilePlugin from "../../main";
import {
	type PresetCallbacks,
	renderPresetEditor,
	renderPresetList,
} from "./presets";

// =============================================================================
// Re-exports
// =============================================================================

export type {
	MarkdownConversionSettings,
	PluginSettings,
	Preset,
} from "../types";
export { DEFAULT_SETTINGS, generatePresetId } from "../types";

// =============================================================================
// Settings Tab
// =============================================================================

export class SettingTab extends PluginSettingTab {
	plugin: SelectionToFilePlugin;
	private editingPresetId: string | null = null;

	constructor(app: App, plugin: SelectionToFilePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const callbacks: PresetCallbacks = {
			getSettings: () => this.plugin.pluginSettings,
			saveSettings: () => this.plugin.saveSettings(),
			registerCommands: () => this.plugin.registerPresetCommands(),
			refreshDisplay: () => this.display(),
			setEditingPresetId: (id) => {
				this.editingPresetId = id;
			},
			getEditingPresetId: () => this.editingPresetId,
		};

		if (this.editingPresetId) {
			renderPresetEditor(containerEl, this.app, callbacks);
		} else {
			renderPresetList(containerEl, this.app, callbacks);
		}
	}
}
