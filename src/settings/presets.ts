/**
 * Preset management UI.
 * Provides list view and editor view for conversion presets.
 */

import { type App, Setting, setIcon } from "obsidian";
import {
	DEFAULT_SETTINGS,
	generatePresetId,
	type PluginSettings,
	type Preset,
} from "../types";
import { renderCustomRulesSection } from "./custom-rules";
import {
	renderBlockElementsSection,
	renderCodeSection,
	renderHeadingsSection,
	renderListsSection,
	renderTextDecorationSection,
	type SectionCallbacks,
} from "./markdown";
import { ConfirmModal } from "./modals";

// =============================================================================
// Types
// =============================================================================

export interface PresetCallbacks {
	getSettings: () => PluginSettings;
	saveSettings: () => Promise<void>;
	registerCommands: () => void;
	refreshDisplay: () => void;
	setEditingPresetId: (id: string | null) => void;
	getEditingPresetId: () => string | null;
}

// =============================================================================
// Preset List View
// =============================================================================

export function renderPresetList(
	containerEl: HTMLElement,
	app: App,
	callbacks: PresetCallbacks,
): void {
	// Header
	new Setting(containerEl).setName("Presets").setHeading();
	containerEl.createEl("p", {
		text: "Create multiple conversion presets. Each preset appears as a separate command.",
		cls: "setting-item-description",
	});

	// Add preset button
	new Setting(containerEl).addButton((button) =>
		button.setButtonText("Add Preset").onClick(async () => {
			const newPreset: Preset = {
				id: generatePresetId(),
				name: "New Preset",
				settings: { ...DEFAULT_SETTINGS },
			};
			callbacks.getSettings().presets.push(newPreset);
			await callbacks.saveSettings();
			callbacks.registerCommands();
			callbacks.refreshDisplay();
		}),
	);

	// Preset list
	const presetsContainer = containerEl.createDiv("presets-container");
	callbacks.getSettings().presets.forEach((preset, index) => {
		renderPresetItem(presetsContainer, app, preset, index, callbacks);
	});
}

// =============================================================================
// Preset Item Rendering
// =============================================================================

function renderPresetItem(
	container: HTMLElement,
	app: App,
	preset: Preset,
	index: number,
	callbacks: PresetCallbacks,
): void {
	const presetEl = container.createDiv("preset-item");
	applyPresetItemStyles(presetEl);
	presetEl.draggable = true;
	presetEl.dataset.index = String(index);

	// Drag handle
	renderDragHandle(presetEl);

	// Drag events
	setupPresetDragEvents(presetEl, index, callbacks);

	// Preset controls
	renderPresetControls(presetEl, app, preset, index, callbacks);
}

function applyPresetItemStyles(element: HTMLElement): void {
	element.style.border = "1px solid var(--background-modifier-border)";
	element.style.padding = "10px";
	element.style.marginBottom = "10px";
	element.style.borderRadius = "5px";
	element.style.display = "flex";
	element.style.alignItems = "flex-start";
	element.style.gap = "10px";
}

function renderDragHandle(container: HTMLElement): void {
	const dragHandle = container.createDiv("drag-handle");
	dragHandle.style.cursor = "grab";
	dragHandle.style.opacity = "0.5";
	dragHandle.style.display = "flex";
	dragHandle.style.alignItems = "center";
	dragHandle.style.flexShrink = "0";
	dragHandle.style.height = "26px";
	setIcon(dragHandle, "grip-vertical");

	const iconEl = dragHandle.querySelector("svg");
	if (iconEl) {
		iconEl.setAttribute("width", "12");
		iconEl.setAttribute("height", "12");
	}
}

// =============================================================================
// Drag and Drop
// =============================================================================

// Track the currently dragged item index
let draggedPresetIndex: number | null = null;

function setupPresetDragEvents(
	presetEl: HTMLElement,
	index: number,
	callbacks: PresetCallbacks,
): void {
	presetEl.addEventListener("dragstart", (e) => {
		presetEl.style.opacity = "0.5";
		draggedPresetIndex = index;
		e.dataTransfer?.setData("text/plain", String(index));
	});

	presetEl.addEventListener("dragend", () => {
		presetEl.style.opacity = "1";
		draggedPresetIndex = null;
		// Clear all highlights
		const container = presetEl.parentElement;
		if (container) {
			container.querySelectorAll(".preset-item").forEach((el) => {
				(el as HTMLElement).style.borderTop = "";
				(el as HTMLElement).style.borderBottom = "";
			});
		}
	});

	presetEl.addEventListener("dragover", (e) => {
		e.preventDefault();
		if (draggedPresetIndex === null || draggedPresetIndex === index) {
			presetEl.style.borderTop = "";
			presetEl.style.borderBottom = "";
			return;
		}

		// Determine if mouse is in upper or lower half of element
		const rect = presetEl.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isUpperHalf = e.clientY < midY;

		// Show appropriate border
		if (isUpperHalf) {
			presetEl.style.borderTop = "2px solid var(--interactive-accent)";
			presetEl.style.borderBottom = "";
		} else {
			presetEl.style.borderTop = "";
			presetEl.style.borderBottom = "2px solid var(--interactive-accent)";
		}
	});

	presetEl.addEventListener("dragleave", () => {
		presetEl.style.borderTop = "";
		presetEl.style.borderBottom = "";
	});

	presetEl.addEventListener("drop", async (e) => {
		e.preventDefault();
		presetEl.style.borderTop = "";
		presetEl.style.borderBottom = "";

		const fromIndex = Number(e.dataTransfer?.getData("text/plain"));
		if (fromIndex === index) return;

		// Determine drop position based on mouse location
		const rect = presetEl.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const dropAfter = e.clientY >= midY;

		// Calculate target index
		let toIndex: number;
		if (dropAfter) {
			// Drop after this element
			toIndex = fromIndex < index ? index : index + 1;
		} else {
			// Drop before this element
			toIndex = fromIndex < index ? index - 1 : index;
		}

		// Reorder presets
		const presets = callbacks.getSettings().presets;
		const [moved] = presets.splice(fromIndex, 1);
		presets.splice(toIndex, 0, moved);

		await callbacks.saveSettings();
		callbacks.refreshDisplay();
	});
}

// =============================================================================
// Preset Controls
// =============================================================================

function renderPresetControls(
	presetEl: HTMLElement,
	app: App,
	preset: Preset,
	index: number,
	callbacks: PresetCallbacks,
): void {
	const settingContainer = presetEl.createDiv();
	settingContainer.style.flex = "1";

	const setting = new Setting(settingContainer)
		.setName(preset.name)
		// Edit button
		.addExtraButton((button) =>
			button
				.setIcon("settings")
				.setTooltip("Edit")
				.onClick(() => {
					callbacks.setEditingPresetId(preset.id);
					callbacks.refreshDisplay();
				}),
		)
		// Duplicate button
		.addExtraButton((button) =>
			button
				.setIcon("copy")
				.setTooltip("Duplicate")
				.onClick(async () => {
					const duplicate: Preset = {
						id: generatePresetId(),
						name: `${preset.name} (copy)`,
						settings: JSON.parse(JSON.stringify(preset.settings)),
					};
					callbacks.getSettings().presets.splice(index + 1, 0, duplicate);
					await callbacks.saveSettings();
					callbacks.registerCommands();
					callbacks.refreshDisplay();
				}),
		)
		// Delete button
		.addExtraButton((button) =>
			button
				.setIcon("trash")
				.setTooltip("Delete")
				.onClick(() => {
					const modal = new ConfirmModal(
						app,
						`Delete preset "${preset.name}"?`,
						async () => {
							callbacks.getSettings().presets.splice(index, 1);
							await callbacks.saveSettings();
							callbacks.registerCommands();
							callbacks.refreshDisplay();
						},
					);
					modal.open();
				}),
		);

	// Remove default styling
	setting.settingEl.style.border = "none";
	setting.settingEl.style.padding = "0";
	setting.settingEl.style.width = "100%";
}

// =============================================================================
// Preset Editor View
// =============================================================================

export function renderPresetEditor(
	containerEl: HTMLElement,
	app: App,
	callbacks: PresetCallbacks,
): void {
	const editingPresetId = callbacks.getEditingPresetId();
	const preset = callbacks
		.getSettings()
		.presets.find((p) => p.id === editingPresetId);

	if (!preset) {
		callbacks.setEditingPresetId(null);
		callbacks.refreshDisplay();
		return;
	}

	// Back button
	new Setting(containerEl).addButton((button) =>
		button.setButtonText("<- Back to Presets").onClick(() => {
			callbacks.setEditingPresetId(null);
			callbacks.refreshDisplay();
		}),
	);

	// Preset name
	new Setting(containerEl)
		.setName("Preset Name")
		.setHeading()
		.addText((text) =>
			text.setValue(preset.name).onChange(async (value) => {
				preset.name = value;
				await callbacks.saveSettings();
				callbacks.registerCommands();
			}),
		);

	// Custom rules section
	renderCustomRulesSection(containerEl, app, preset, {
		saveSettings: () => callbacks.saveSettings(),
		refreshDisplay: () => callbacks.refreshDisplay(),
	});

	// Separator
	containerEl.createEl("hr", { cls: "setting-separator" });

	// Markdown settings master toggle
	new Setting(containerEl)
		.setName("Markdown Settings")
		.setHeading()
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.enableMarkdownConversion)
				.onChange(async (value) => {
					preset.settings.enableMarkdownConversion = value;
					await callbacks.saveSettings();
					callbacks.refreshDisplay();
				}),
		);

	if (!preset.settings.enableMarkdownConversion) {
		return;
	}

	// Markdown setting sections
	const sectionCallbacks: SectionCallbacks = {
		saveSettings: () => callbacks.saveSettings(),
		refreshDisplay: () => callbacks.refreshDisplay(),
	};

	renderHeadingsSection(containerEl, preset, sectionCallbacks);
	renderListsSection(containerEl, preset, sectionCallbacks);
	renderTextDecorationSection(containerEl, preset, sectionCallbacks);
	renderBlockElementsSection(containerEl, preset, sectionCallbacks);
	renderCodeSection(containerEl, preset, sectionCallbacks);
}
