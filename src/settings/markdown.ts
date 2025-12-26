/**
 * Markdown conversion settings UI sections.
 * Each function renders a collapsible section for a category of settings.
 */

import { Setting, setIcon } from "obsidian";
import type { Preset } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface SectionCallbacks {
	saveSettings: () => Promise<void>;
	refreshDisplay: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function addIconToSetting(setting: Setting, iconId: string): void {
	const nameEl = setting.settingEl.querySelector(".setting-item-name");
	if (nameEl) {
		const iconEl = createSpan({ cls: "setting-icon" });
		iconEl.style.display = "inline-flex";
		iconEl.style.marginRight = "6px";
		setIcon(iconEl, iconId);
		nameEl.insertBefore(iconEl, nameEl.firstChild);
	}
}

// =============================================================================
// Headings Section
// =============================================================================

export function renderHeadingsSection(
	containerEl: HTMLElement,
	preset: Preset,
	callbacks: SectionCallbacks,
): void {
	const container = containerEl.createDiv();

	// Section header with toggle
	const headingSetting = new Setting(container)
		.setName("Headings")
		.setHeading()
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.enableHeadings)
				.onChange(async (value) => {
					preset.settings.enableHeadings = value;
					await callbacks.saveSettings();
					callbacks.refreshDisplay();
				}),
		);
	addIconToSetting(headingSetting, "heading");

	if (!preset.settings.enableHeadings) return;

	// Heading prefix settings
	new Setting(container)
		.setName("Heading 1 prefix")
		.setDesc("Replacement for # heading")
		.addText((text) =>
			text
				.setPlaceholder("▌")
				.setValue(preset.settings.heading1Prefix)
				.onChange(async (value) => {
					preset.settings.heading1Prefix = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Heading 2 prefix")
		.setDesc("Replacement for ## heading")
		.addText((text) =>
			text
				.setPlaceholder("▍")
				.setValue(preset.settings.heading2Prefix)
				.onChange(async (value) => {
					preset.settings.heading2Prefix = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Heading 3 prefix")
		.setDesc("Replacement for ### heading")
		.addText((text) =>
			text
				.setPlaceholder("▎")
				.setValue(preset.settings.heading3Prefix)
				.onChange(async (value) => {
					preset.settings.heading3Prefix = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Heading 4 prefix")
		.setDesc("Replacement for #### heading")
		.addText((text) =>
			text
				.setPlaceholder("▏")
				.setValue(preset.settings.heading4Prefix)
				.onChange(async (value) => {
					preset.settings.heading4Prefix = value;
					await callbacks.saveSettings();
				}),
		);
}

// =============================================================================
// Lists Section
// =============================================================================

export function renderListsSection(
	containerEl: HTMLElement,
	preset: Preset,
	callbacks: SectionCallbacks,
): void {
	const container = containerEl.createDiv();

	// Section header with toggle
	const listSetting = new Setting(container)
		.setName("Lists")
		.setHeading()
		.addToggle((toggle) =>
			toggle.setValue(preset.settings.enableLists).onChange(async (value) => {
				preset.settings.enableLists = value;
				await callbacks.saveSettings();
				callbacks.refreshDisplay();
			}),
		);
	addIconToSetting(listSetting, "list");

	if (!preset.settings.enableLists) return;

	// List character settings
	new Setting(container)
		.setName("Bullet character")
		.setDesc("Replacement for - or * list items")
		.addText((text) =>
			text
				.setPlaceholder("•")
				.setValue(preset.settings.bulletChar)
				.onChange(async (value) => {
					preset.settings.bulletChar = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Checked checkbox")
		.setDesc("Replacement for [x]")
		.addText((text) =>
			text
				.setPlaceholder("☑")
				.setValue(preset.settings.checkboxChecked)
				.onChange(async (value) => {
					preset.settings.checkboxChecked = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Unchecked checkbox")
		.setDesc("Replacement for [ ]")
		.addText((text) =>
			text
				.setPlaceholder("☐")
				.setValue(preset.settings.checkboxUnchecked)
				.onChange(async (value) => {
					preset.settings.checkboxUnchecked = value;
					await callbacks.saveSettings();
				}),
		);
}

// =============================================================================
// Text Decoration Section
// =============================================================================

export function renderTextDecorationSection(
	containerEl: HTMLElement,
	preset: Preset,
	callbacks: SectionCallbacks,
): void {
	const container = containerEl.createDiv();

	// Section header with toggle
	const textSetting = new Setting(container)
		.setName("Text Decoration")
		.setHeading()
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.enableTextDecoration)
				.onChange(async (value) => {
					preset.settings.enableTextDecoration = value;
					await callbacks.saveSettings();
					callbacks.refreshDisplay();
				}),
		);
	addIconToSetting(textSetting, "bold");

	if (!preset.settings.enableTextDecoration) return;

	// Unicode conversion toggles
	new Setting(container)
		.setName("Bold to Unicode")
		.setDesc("Convert **bold** to 𝐛𝐨𝐥𝐝 (only works with ASCII)")
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.useBoldUnicode)
				.onChange(async (value) => {
					preset.settings.useBoldUnicode = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Italic to Unicode")
		.setDesc("Convert *italic* to 𝑖𝑡𝑎𝑙𝑖𝑐 (only works with ASCII)")
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.useItalicUnicode)
				.onChange(async (value) => {
					preset.settings.useItalicUnicode = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Strikethrough")
		.setDesc("Convert ~~text~~ to t̶e̶x̶t̶")
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.useStrikethrough)
				.onChange(async (value) => {
					preset.settings.useStrikethrough = value;
					await callbacks.saveSettings();
				}),
		);
}

// =============================================================================
// Block Elements Section
// =============================================================================

export function renderBlockElementsSection(
	containerEl: HTMLElement,
	preset: Preset,
	callbacks: SectionCallbacks,
): void {
	const container = containerEl.createDiv();

	// Section header with toggle
	const blockSetting = new Setting(container)
		.setName("Block Elements")
		.setHeading()
		.addToggle((toggle) =>
			toggle
				.setValue(preset.settings.enableBlockElements)
				.onChange(async (value) => {
					preset.settings.enableBlockElements = value;
					await callbacks.saveSettings();
					callbacks.refreshDisplay();
				}),
		);
	addIconToSetting(blockSetting, "text-quote");

	if (!preset.settings.enableBlockElements) return;

	// Block element settings
	new Setting(container)
		.setName("Horizontal rule")
		.setDesc("Replacement for --- or ***")
		.addText((text) =>
			text
				.setPlaceholder("────────────")
				.setValue(preset.settings.horizontalRule)
				.onChange(async (value) => {
					preset.settings.horizontalRule = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Blockquote prefix")
		.setDesc("Prefix for > quoted lines")
		.addText((text) =>
			text
				.setPlaceholder("│ ")
				.setValue(preset.settings.blockquotePrefix)
				.onChange(async (value) => {
					preset.settings.blockquotePrefix = value;
					await callbacks.saveSettings();
				}),
		);
}

// =============================================================================
// Code Section
// =============================================================================

export function renderCodeSection(
	containerEl: HTMLElement,
	preset: Preset,
	callbacks: SectionCallbacks,
): void {
	const container = containerEl.createDiv();

	// Section header with toggle
	const codeSetting = new Setting(container)
		.setName("Code")
		.setHeading()
		.addToggle((toggle) =>
			toggle.setValue(preset.settings.enableCode).onChange(async (value) => {
				preset.settings.enableCode = value;
				await callbacks.saveSettings();
				callbacks.refreshDisplay();
			}),
		);
	addIconToSetting(codeSetting, "code");

	if (!preset.settings.enableCode) return;

	// Code formatting settings
	new Setting(container)
		.setName("Code block prefix")
		.setDesc("Prefix for each line in code blocks")
		.addText((text) =>
			text
				.setPlaceholder("  ")
				.setValue(preset.settings.codeBlockPrefix)
				.onChange(async (value) => {
					preset.settings.codeBlockPrefix = value;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Inline code wrapper")
		.setDesc("Wrapper for `inline code`")
		.addText((text) =>
			text
				.setPlaceholder("`")
				.setValue(preset.settings.inlineCodeWrapper)
				.onChange(async (value) => {
					preset.settings.inlineCodeWrapper = value;
					await callbacks.saveSettings();
				}),
		);
}
