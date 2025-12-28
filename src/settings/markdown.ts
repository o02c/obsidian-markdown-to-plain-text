/**
 * Markdown conversion settings UI sections.
 * Each function renders a collapsible section for a category of settings.
 */

import { Setting, setIcon } from "obsidian";
import type { Preset, TextDecorationMode } from "../types";

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

	// Section header
	const listSetting = new Setting(container).setName("Lists").setHeading();
	addIconToSetting(listSetting, "list");

	// Bullet character subsection
	new Setting(container).setName("Bullet character").addToggle((toggle) =>
		toggle.setValue(preset.settings.enableBullet).onChange(async (value) => {
			preset.settings.enableBullet = value;
			await callbacks.saveSettings();
			callbacks.refreshDisplay();
		}),
	);

	if (preset.settings.enableBullet) {
		new Setting(container)
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
	}

	// Checkbox subsection
	new Setting(container).setName("Checkbox").addToggle((toggle) =>
		toggle.setValue(preset.settings.enableCheckbox).onChange(async (value) => {
			preset.settings.enableCheckbox = value;
			await callbacks.saveSettings();
			callbacks.refreshDisplay();
		}),
	);

	if (preset.settings.enableCheckbox) {
		new Setting(container)
			.setName("Checked")
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
			.setName("Unchecked")
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

	// Section header
	const textSetting = new Setting(container)
		.setName("Text Decoration")
		.setHeading();
	addIconToSetting(textSetting, "bold");

	// Text decoration mode dropdowns
	const modeOptions: Record<TextDecorationMode, string> = {
		keep: "Keep markdown",
		remove: "Remove markers",
		unicode: "Convert to Unicode",
	};

	new Setting(container)
		.setName("Bold")
		.setDesc("**bold** → 𝐛𝐨𝐥𝐝 (Unicode only works with ASCII)")
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(modeOptions)
				.setValue(preset.settings.boldMode)
				.onChange(async (value) => {
					preset.settings.boldMode = value as TextDecorationMode;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Italic")
		.setDesc("*italic* → 𝑖𝑡𝑎𝑙𝑖𝑐 (Unicode only works with ASCII)")
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(modeOptions)
				.setValue(preset.settings.italicMode)
				.onChange(async (value) => {
					preset.settings.italicMode = value as TextDecorationMode;
					await callbacks.saveSettings();
				}),
		);

	new Setting(container)
		.setName("Strikethrough")
		.setDesc("~~text~~ → t̶e̶x̶t̶")
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(modeOptions)
				.setValue(preset.settings.strikethroughMode)
				.onChange(async (value) => {
					preset.settings.strikethroughMode = value as TextDecorationMode;
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

	// Section header
	const blockSetting = new Setting(container)
		.setName("Block Elements")
		.setHeading();
	addIconToSetting(blockSetting, "text-quote");

	// Horizontal rule subsection
	new Setting(container).setName("Horizontal rule").addToggle((toggle) =>
		toggle
			.setValue(preset.settings.enableHorizontalRule)
			.onChange(async (value) => {
				preset.settings.enableHorizontalRule = value;
				await callbacks.saveSettings();
				callbacks.refreshDisplay();
			}),
	);

	if (preset.settings.enableHorizontalRule) {
		new Setting(container)
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
	}

	// Blockquote subsection
	new Setting(container).setName("Blockquote").addToggle((toggle) =>
		toggle
			.setValue(preset.settings.enableBlockquote)
			.onChange(async (value) => {
				preset.settings.enableBlockquote = value;
				await callbacks.saveSettings();
				callbacks.refreshDisplay();
			}),
	);

	if (preset.settings.enableBlockquote) {
		new Setting(container)
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

	// Section header
	const codeSetting = new Setting(container).setName("Code").setHeading();
	addIconToSetting(codeSetting, "code");

	// Code block subsection
	new Setting(container).setName("Code block").addToggle((toggle) =>
		toggle.setValue(preset.settings.enableCodeBlock).onChange(async (value) => {
			preset.settings.enableCodeBlock = value;
			await callbacks.saveSettings();
			callbacks.refreshDisplay();
		}),
	);

	if (preset.settings.enableCodeBlock) {
		new Setting(container)
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
	}

	// Inline code subsection
	new Setting(container).setName("Inline code").addToggle((toggle) =>
		toggle
			.setValue(preset.settings.enableInlineCode)
			.onChange(async (value) => {
				preset.settings.enableInlineCode = value;
				await callbacks.saveSettings();
				callbacks.refreshDisplay();
			}),
	);

	if (preset.settings.enableInlineCode) {
		new Setting(container)
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
}
