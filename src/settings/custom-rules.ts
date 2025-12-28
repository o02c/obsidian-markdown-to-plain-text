/**
 * Custom regex rules settings UI.
 * Provides a list of user-defined replacement rules with drag-and-drop reordering.
 */

import { type App, Setting, setIcon } from "obsidian";
import type { CustomRule, Preset } from "../types";
import { ConfirmModal, RuleEditorModal } from "./modals";

// =============================================================================
// Types
// =============================================================================

export interface CustomRuleCallbacks {
	saveSettings: () => Promise<void>;
	refreshDisplay: () => void;
}

// =============================================================================
// Main Section Renderer
// =============================================================================

export function renderCustomRulesSection(
	containerEl: HTMLElement,
	app: App,
	preset: Preset,
	callbacks: CustomRuleCallbacks,
): void {
	// Section header with Add button
	new Setting(containerEl)
		.setName("Custom Rules")
		.setDesc("Regex replacement rules applied after markdown conversion")
		.addButton((button) =>
			button.setButtonText("Add Rule").onClick(async () => {
			preset.settings.customRules.push({
				name: "",
				pattern: "",
				replacement: "",
				caseInsensitive: true,
				enabled: true,
				applyBeforeConversion: false,
			});
			await callbacks.saveSettings();
			callbacks.refreshDisplay();
		}),
	);

	// Rules list
	const rulesContainer = containerEl.createDiv("custom-rules-container");
	preset.settings.customRules.forEach((rule, index) => {
		renderCustomRuleItem(rulesContainer, app, preset, rule, index, callbacks);
	});
}

// =============================================================================
// Individual Rule Item Renderer
// =============================================================================

function renderCustomRuleItem(
	container: HTMLElement,
	app: App,
	preset: Preset,
	rule: CustomRule,
	index: number,
	callbacks: CustomRuleCallbacks,
): void {
	const ruleEl = container.createDiv("custom-rule-item");
	applyRuleItemStyles(ruleEl);
	ruleEl.draggable = true;
	ruleEl.dataset.index = String(index);

	// Drag handle
	renderDragHandle(ruleEl);

	// Drag events
	setupDragEvents(ruleEl, index, preset, callbacks);

	// Rule settings
	renderRuleSettings(ruleEl, app, preset, rule, index, callbacks);
}

// =============================================================================
// Rule Item Styling
// =============================================================================

function applyRuleItemStyles(element: HTMLElement): void {
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
let draggedRuleIndex: number | null = null;

function setupDragEvents(
	ruleEl: HTMLElement,
	index: number,
	preset: Preset,
	callbacks: CustomRuleCallbacks,
): void {
	ruleEl.addEventListener("dragstart", (e) => {
		ruleEl.style.opacity = "0.5";
		draggedRuleIndex = index;
		e.dataTransfer?.setData("text/plain", String(index));
	});

	ruleEl.addEventListener("dragend", () => {
		ruleEl.style.opacity = "1";
		draggedRuleIndex = null;
		// Clear all highlights
		const container = ruleEl.parentElement;
		if (container) {
			container.querySelectorAll(".custom-rule-item").forEach((el) => {
				(el as HTMLElement).style.borderTop = "";
				(el as HTMLElement).style.borderBottom = "";
			});
		}
	});

	ruleEl.addEventListener("dragover", (e) => {
		e.preventDefault();
		if (draggedRuleIndex === null || draggedRuleIndex === index) {
			ruleEl.style.borderTop = "";
			ruleEl.style.borderBottom = "";
			return;
		}

		// Determine if mouse is in upper or lower half of element
		const rect = ruleEl.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isUpperHalf = e.clientY < midY;

		// Show appropriate border
		if (isUpperHalf) {
			ruleEl.style.borderTop = "2px solid var(--interactive-accent)";
			ruleEl.style.borderBottom = "";
		} else {
			ruleEl.style.borderTop = "";
			ruleEl.style.borderBottom = "2px solid var(--interactive-accent)";
		}
	});

	ruleEl.addEventListener("dragleave", () => {
		ruleEl.style.borderTop = "";
		ruleEl.style.borderBottom = "";
	});

	ruleEl.addEventListener("drop", async (e) => {
		e.preventDefault();
		ruleEl.style.borderTop = "";
		ruleEl.style.borderBottom = "";

		const fromIndex = Number(e.dataTransfer?.getData("text/plain"));
		if (fromIndex === index) return;

		// Determine drop position based on mouse location
		const rect = ruleEl.getBoundingClientRect();
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

		// Reorder rules
		const rules = preset.settings.customRules;
		const [moved] = rules.splice(fromIndex, 1);
		rules.splice(toIndex, 0, moved);

		await callbacks.saveSettings();
		callbacks.refreshDisplay();
	});
}

// =============================================================================
// Rule Settings Controls
// =============================================================================

function renderRuleSettings(
	ruleEl: HTMLElement,
	app: App,
	preset: Preset,
	rule: CustomRule,
	index: number,
	callbacks: CustomRuleCallbacks,
): void {
	const settingContainer = ruleEl.createDiv();
	settingContainer.style.flex = "1";

	const ruleName = rule.name || `Rule ${index + 1}`;
	const setting = new Setting(settingContainer)
		.setName(ruleName)
		// Enable/disable toggle
		.addToggle((toggle) =>
			toggle.setValue(rule.enabled).onChange(async (value) => {
				preset.settings.customRules[index].enabled = value;
				await callbacks.saveSettings();
			}),
		)
		// Edit button
		.addExtraButton((button) =>
			button
				.setIcon("settings")
				.setTooltip("Edit")
				.onClick(() => {
					const modal = new RuleEditorModal(
						app,
						rule,
						`Rule ${index + 1}`,
						async () => {
							await callbacks.saveSettings();
						},
						() => {
							callbacks.refreshDisplay();
						},
					);
					modal.open();
				}),
		)
		// Duplicate button
		.addExtraButton((button) =>
			button
				.setIcon("copy")
				.setTooltip("Duplicate")
				.onClick(async () => {
					const duplicate: CustomRule = {
						name: rule.name ? `${rule.name} (copy)` : "",
						pattern: rule.pattern,
						replacement: rule.replacement,
						caseInsensitive: rule.caseInsensitive,
						enabled: rule.enabled,
					};
					preset.settings.customRules.splice(index + 1, 0, duplicate);
					await callbacks.saveSettings();
					callbacks.refreshDisplay();
				}),
		)
		// Delete button
		.addExtraButton((button) =>
			button
				.setIcon("trash")
				.setTooltip("Delete")
				.onClick(() => {
					const confirmRuleName = rule.name || `Rule ${index + 1}`;
					const modal = new ConfirmModal(
						app,
						`Delete rule "${confirmRuleName}"?`,
						async () => {
							preset.settings.customRules.splice(index, 1);
							await callbacks.saveSettings();
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
