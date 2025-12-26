import { type App, Modal, PluginSettingTab, Setting, setIcon } from "obsidian";
import type SelectionToFilePlugin from "../main";
import {
	type CustomRule,
	DEFAULT_SETTINGS,
	generatePresetId,
	type Preset,
} from "./types";

export type {
	MarkdownConversionSettings,
	PluginSettings,
	Preset,
} from "./types";
export { DEFAULT_SETTINGS, generatePresetId } from "./types";

class ConfirmModal extends Modal {
	private message: string;
	private onConfirm: () => void;

	constructor(app: App, message: string, onConfirm: () => void) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => {
					this.close();
				}),
			)
			.addButton((button) =>
				button
					.setButtonText("Delete")
					.setWarning()
					.onClick(() => {
						this.onConfirm();
						this.close();
					}),
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}

class RuleEditorModal extends Modal {
	private rule: CustomRule;
	private defaultName: string;
	private onSaveCallback: () => Promise<void>;
	private onCloseCallback: () => void;

	constructor(
		app: App,
		rule: CustomRule,
		defaultName: string,
		onSave: () => Promise<void>,
		onCloseCallback: () => void,
	) {
		super(app);
		this.rule = rule;
		this.defaultName = defaultName;
		this.onSaveCallback = onSave;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Edit Rule" });

		new Setting(contentEl)
			.setName("Name")
			.setDesc("Optional name for this rule")
			.addText((text) =>
				text
					.setPlaceholder(this.defaultName)
					.setValue(this.rule.name)
					.onChange(async (value) => {
						this.rule.name = value;
						await this.onSaveCallback();
					}),
			);

		new Setting(contentEl)
			.setName("Pattern")
			.setDesc("Regular expression pattern")
			.addTextArea((text) => {
				text
					.setPlaceholder("(\\d{4})-(\\d{2})-(\\d{2})")
					.setValue(this.rule.pattern)
					.onChange(async (value) => {
						this.rule.pattern = value;
						await this.onSaveCallback();
					});
				text.inputEl.rows = 2;
				text.inputEl.style.width = "100%";
			});

		new Setting(contentEl)
			.setName("Replacement")
			.setDesc(
				"Replacement string (use $1, $2 for capture groups, \\n for newline)",
			)
			.addTextArea((text) => {
				text
					.setPlaceholder("$1/$2/$3")
					.setValue(this.rule.replacement)
					.onChange(async (value) => {
						this.rule.replacement = value;
						await this.onSaveCallback();
					});
				text.inputEl.rows = 2;
				text.inputEl.style.width = "100%";
			});

		new Setting(contentEl)
			.setName("Case insensitive")
			.setDesc("Ignore case when matching")
			.addToggle((toggle) =>
				toggle.setValue(this.rule.caseInsensitive).onChange(async (value) => {
					this.rule.caseInsensitive = value;
					await this.onSaveCallback();
				}),
			);

		// Documentation link
		const docLink = contentEl.createEl("p", {
			cls: "setting-item-description",
		});
		docLink.style.marginTop = "16px";
		const link = docLink.createEl("a", {
			text: "Regular expression syntax reference (MDN)",
			href: "https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions",
		});
		link.setAttr("target", "_blank");
	}

	onClose() {
		this.onCloseCallback();
	}
}

export class SettingTab extends PluginSettingTab {
	plugin: SelectionToFilePlugin;
	editingPresetId: string | null = null;

	constructor(app: App, plugin: SelectionToFilePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		if (this.editingPresetId) {
			this.displayPresetEditor(containerEl);
		} else {
			this.displayPresetList(containerEl);
		}
	}

	private displayPresetList(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Presets").setHeading();
		containerEl.createEl("p", {
			text: "Create multiple conversion presets. Each preset appears as a separate command.",
			cls: "setting-item-description",
		});

		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Add Preset").onClick(async () => {
				const newPreset: Preset = {
					id: generatePresetId(),
					name: "New Preset",
					settings: { ...DEFAULT_SETTINGS },
				};
				this.plugin.pluginSettings.presets.push(newPreset);
				await this.plugin.saveSettings();
				this.plugin.registerPresetCommands();
				this.display();
			}),
		);

		const presetsContainer = containerEl.createDiv("presets-container");
		this.plugin.pluginSettings.presets.forEach((preset, index) => {
			this.renderPresetItem(presetsContainer, preset, index);
		});
	}

	private renderPresetItem(
		container: HTMLElement,
		preset: Preset,
		index: number,
	): void {
		const presetEl = container.createDiv("preset-item");
		presetEl.style.border = "1px solid var(--background-modifier-border)";
		presetEl.style.padding = "10px";
		presetEl.style.marginBottom = "10px";
		presetEl.style.borderRadius = "5px";
		presetEl.style.display = "flex";
		presetEl.style.alignItems = "flex-start";
		presetEl.style.gap = "10px";
		presetEl.draggable = true;
		presetEl.dataset.index = String(index);

		// Drag handle
		const dragHandle = presetEl.createDiv("drag-handle");
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

		// Drag events
		presetEl.addEventListener("dragstart", (e) => {
			presetEl.style.opacity = "0.5";
			e.dataTransfer?.setData("text/plain", String(index));
		});

		presetEl.addEventListener("dragend", () => {
			presetEl.style.opacity = "1";
		});

		presetEl.addEventListener("dragover", (e) => {
			e.preventDefault();
			const fromIndex = Number(e.dataTransfer?.getData("text/plain"));
			if (fromIndex === index) {
				presetEl.style.borderTop = "";
				return;
			}
			presetEl.style.borderTop = "2px solid var(--interactive-accent)";
		});

		presetEl.addEventListener("dragleave", () => {
			presetEl.style.borderTop = "";
		});

		presetEl.addEventListener("drop", async (e) => {
			e.preventDefault();
			presetEl.style.borderTop = "";
			const fromIndex = Number(e.dataTransfer?.getData("text/plain"));

			if (fromIndex === index) return;

			const presets = this.plugin.pluginSettings.presets;
			const [moved] = presets.splice(fromIndex, 1);
			const toIndex = fromIndex < index ? index - 1 : index;
			presets.splice(toIndex, 0, moved);
			await this.plugin.saveSettings();
			this.display();
		});

		// Setting container
		const settingContainer = presetEl.createDiv();
		settingContainer.style.flex = "1";

		const setting = new Setting(settingContainer)
			.setName(preset.name)
			.addExtraButton((button) =>
				button
					.setIcon("settings")
					.setTooltip("Edit")
					.onClick(() => {
						this.editingPresetId = preset.id;
						this.display();
					}),
			)
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
						this.plugin.pluginSettings.presets.splice(index + 1, 0, duplicate);
						await this.plugin.saveSettings();
						this.plugin.registerPresetCommands();
						this.display();
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Delete")
					.onClick(() => {
						const modal = new ConfirmModal(
							this.app,
							`Delete preset "${preset.name}"?`,
							async () => {
								this.plugin.pluginSettings.presets.splice(index, 1);
								await this.plugin.saveSettings();
								this.plugin.registerPresetCommands();
								this.display();
							},
						);
						modal.open();
					}),
			);

		setting.settingEl.style.border = "none";
		setting.settingEl.style.padding = "0";
		setting.settingEl.style.width = "100%";
	}

	private displayPresetEditor(containerEl: HTMLElement): void {
		const preset = this.plugin.pluginSettings.presets.find(
			(p) => p.id === this.editingPresetId,
		);
		if (!preset) {
			this.editingPresetId = null;
			this.display();
			return;
		}

		// Back button
		new Setting(containerEl).addButton((button) =>
			button.setButtonText("<- Back to Presets").onClick(() => {
				this.editingPresetId = null;
				this.display();
			}),
		);

		// Preset name
		new Setting(containerEl)
			.setName("Preset Name")
			.setHeading()
			.addText((text) =>
				text.setValue(preset.name).onChange(async (value) => {
					preset.name = value;
					await this.plugin.saveSettings();
					this.plugin.registerPresetCommands();
				}),
			);

		// ===== Custom Rules =====
		new Setting(containerEl).setName("Custom Rules").setHeading();
		containerEl.createEl("p", {
			text: "Regex replacement rules applied after markdown conversion.",
			cls: "setting-item-description",
		});

		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Add Rule").onClick(async () => {
				preset.settings.customRules.push({
					name: "",
					pattern: "",
					replacement: "",
					caseInsensitive: true,
					enabled: true,
				});
				await this.plugin.saveSettings();
				this.display();
			}),
		);

		const rulesContainer = containerEl.createDiv("custom-rules-container");
		preset.settings.customRules.forEach((rule, index) => {
			this.renderCustomRule(rulesContainer, preset, rule, index);
		});

		// Separator
		containerEl.createEl("hr", { cls: "setting-separator" });

		// ===== Markdown Settings =====
		new Setting(containerEl)
			.setName("Markdown Settings")
			.setHeading()
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.enableMarkdownConversion)
					.onChange(async (value) => {
						preset.settings.enableMarkdownConversion = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!preset.settings.enableMarkdownConversion) {
			return;
		}

		this.renderHeadingsSection(containerEl, preset);
		this.renderListsSection(containerEl, preset);
		this.renderTextDecorationSection(containerEl, preset);
		this.renderBlockElementsSection(containerEl, preset);
		this.renderCodeSection(containerEl, preset);
	}

	private renderHeadingsSection(
		containerEl: HTMLElement,
		preset: Preset,
	): void {
		const headingsContainer = containerEl.createDiv();
		new Setting(headingsContainer)
			.setName("Headings")
			.setHeading()
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.enableHeadings)
					.onChange(async (value) => {
						preset.settings.enableHeadings = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!preset.settings.enableHeadings) return;

		new Setting(headingsContainer)
			.setName("Heading 1 prefix")
			.setDesc("Replacement for # heading")
			.addText((text) =>
				text
					.setPlaceholder("▌")
					.setValue(preset.settings.heading1Prefix)
					.onChange(async (value) => {
						preset.settings.heading1Prefix = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(headingsContainer)
			.setName("Heading 2 prefix")
			.setDesc("Replacement for ## heading")
			.addText((text) =>
				text
					.setPlaceholder("▍")
					.setValue(preset.settings.heading2Prefix)
					.onChange(async (value) => {
						preset.settings.heading2Prefix = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(headingsContainer)
			.setName("Heading 3 prefix")
			.setDesc("Replacement for ### heading")
			.addText((text) =>
				text
					.setPlaceholder("▎")
					.setValue(preset.settings.heading3Prefix)
					.onChange(async (value) => {
						preset.settings.heading3Prefix = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(headingsContainer)
			.setName("Heading 4 prefix")
			.setDesc("Replacement for #### heading")
			.addText((text) =>
				text
					.setPlaceholder("▏")
					.setValue(preset.settings.heading4Prefix)
					.onChange(async (value) => {
						preset.settings.heading4Prefix = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderListsSection(containerEl: HTMLElement, preset: Preset): void {
		const listsContainer = containerEl.createDiv();
		new Setting(listsContainer)
			.setName("Lists")
			.setHeading()
			.addToggle((toggle) =>
				toggle.setValue(preset.settings.enableLists).onChange(async (value) => {
					preset.settings.enableLists = value;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (!preset.settings.enableLists) return;

		new Setting(listsContainer)
			.setName("Bullet character")
			.setDesc("Replacement for - or * list items")
			.addText((text) =>
				text
					.setPlaceholder("•")
					.setValue(preset.settings.bulletChar)
					.onChange(async (value) => {
						preset.settings.bulletChar = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(listsContainer)
			.setName("Checked checkbox")
			.setDesc("Replacement for [x]")
			.addText((text) =>
				text
					.setPlaceholder("☑")
					.setValue(preset.settings.checkboxChecked)
					.onChange(async (value) => {
						preset.settings.checkboxChecked = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(listsContainer)
			.setName("Unchecked checkbox")
			.setDesc("Replacement for [ ]")
			.addText((text) =>
				text
					.setPlaceholder("☐")
					.setValue(preset.settings.checkboxUnchecked)
					.onChange(async (value) => {
						preset.settings.checkboxUnchecked = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderTextDecorationSection(
		containerEl: HTMLElement,
		preset: Preset,
	): void {
		const textDecoContainer = containerEl.createDiv();
		new Setting(textDecoContainer)
			.setName("Text Decoration")
			.setHeading()
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.enableTextDecoration)
					.onChange(async (value) => {
						preset.settings.enableTextDecoration = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!preset.settings.enableTextDecoration) return;

		new Setting(textDecoContainer)
			.setName("Bold to Unicode")
			.setDesc("Convert **bold** to 𝐛𝐨𝐥𝐝 (only works with ASCII)")
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.useBoldUnicode)
					.onChange(async (value) => {
						preset.settings.useBoldUnicode = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(textDecoContainer)
			.setName("Italic to Unicode")
			.setDesc("Convert *italic* to 𝑖𝑡𝑎𝑙𝑖𝑐 (only works with ASCII)")
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.useItalicUnicode)
					.onChange(async (value) => {
						preset.settings.useItalicUnicode = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(textDecoContainer)
			.setName("Strikethrough")
			.setDesc("Convert ~~text~~ to t̶e̶x̶t̶")
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.useStrikethrough)
					.onChange(async (value) => {
						preset.settings.useStrikethrough = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderBlockElementsSection(
		containerEl: HTMLElement,
		preset: Preset,
	): void {
		const blockContainer = containerEl.createDiv();
		new Setting(blockContainer)
			.setName("Block Elements")
			.setHeading()
			.addToggle((toggle) =>
				toggle
					.setValue(preset.settings.enableBlockElements)
					.onChange(async (value) => {
						preset.settings.enableBlockElements = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!preset.settings.enableBlockElements) return;

		new Setting(blockContainer)
			.setName("Horizontal rule")
			.setDesc("Replacement for --- or ***")
			.addText((text) =>
				text
					.setPlaceholder("────────────")
					.setValue(preset.settings.horizontalRule)
					.onChange(async (value) => {
						preset.settings.horizontalRule = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(blockContainer)
			.setName("Blockquote prefix")
			.setDesc("Prefix for > quoted lines")
			.addText((text) =>
				text
					.setPlaceholder("│ ")
					.setValue(preset.settings.blockquotePrefix)
					.onChange(async (value) => {
						preset.settings.blockquotePrefix = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderCodeSection(containerEl: HTMLElement, preset: Preset): void {
		const codeContainer = containerEl.createDiv();
		new Setting(codeContainer)
			.setName("Code")
			.setHeading()
			.addToggle((toggle) =>
				toggle.setValue(preset.settings.enableCode).onChange(async (value) => {
					preset.settings.enableCode = value;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (!preset.settings.enableCode) return;

		new Setting(codeContainer)
			.setName("Code block prefix")
			.setDesc("Prefix for each line in code blocks")
			.addText((text) =>
				text
					.setPlaceholder("  ")
					.setValue(preset.settings.codeBlockPrefix)
					.onChange(async (value) => {
						preset.settings.codeBlockPrefix = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(codeContainer)
			.setName("Inline code wrapper")
			.setDesc("Wrapper for `inline code`")
			.addText((text) =>
				text
					.setPlaceholder("`")
					.setValue(preset.settings.inlineCodeWrapper)
					.onChange(async (value) => {
						preset.settings.inlineCodeWrapper = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderCustomRule(
		container: HTMLElement,
		preset: Preset,
		rule: CustomRule,
		index: number,
	): void {
		const ruleEl = container.createDiv("custom-rule-item");
		ruleEl.style.border = "1px solid var(--background-modifier-border)";
		ruleEl.style.padding = "10px";
		ruleEl.style.marginBottom = "10px";
		ruleEl.style.borderRadius = "5px";
		ruleEl.style.display = "flex";
		ruleEl.style.alignItems = "flex-start";
		ruleEl.style.gap = "10px";
		ruleEl.draggable = true;
		ruleEl.dataset.index = String(index);

		// Drag handle
		const dragHandle = ruleEl.createDiv("drag-handle");
		dragHandle.style.cursor = "grab";
		dragHandle.style.opacity = "0.5";
		dragHandle.style.display = "flex";
		dragHandle.style.alignItems = "center";
		dragHandle.style.flexShrink = "0";
		dragHandle.style.height = "26px"; // Match setting item height
		setIcon(dragHandle, "grip-vertical");
		const iconEl = dragHandle.querySelector("svg");
		if (iconEl) {
			iconEl.setAttribute("width", "12");
			iconEl.setAttribute("height", "12");
		}

		// Drag events
		ruleEl.addEventListener("dragstart", (e) => {
			ruleEl.style.opacity = "0.5";
			e.dataTransfer?.setData("text/plain", String(index));
		});

		ruleEl.addEventListener("dragend", () => {
			ruleEl.style.opacity = "1";
		});

		ruleEl.addEventListener("dragover", (e) => {
			e.preventDefault();
			const fromIndex = Number(e.dataTransfer?.getData("text/plain"));
			if (fromIndex === index) {
				ruleEl.style.borderTop = "";
				return;
			}
			ruleEl.style.borderTop = "2px solid var(--interactive-accent)";
		});

		ruleEl.addEventListener("dragleave", () => {
			ruleEl.style.borderTop = "";
		});

		ruleEl.addEventListener("drop", async (e) => {
			e.preventDefault();
			ruleEl.style.borderTop = "";
			const fromIndex = Number(e.dataTransfer?.getData("text/plain"));

			if (fromIndex === index) return;

			const rules = preset.settings.customRules;
			const [moved] = rules.splice(fromIndex, 1);
			// Insert at target position (adjusted for removal when dragging down)
			const toIndex = fromIndex < index ? index - 1 : index;
			rules.splice(toIndex, 0, moved);
			await this.plugin.saveSettings();
			this.display();
		});

		// Setting container (takes remaining space)
		const settingContainer = ruleEl.createDiv();
		settingContainer.style.flex = "1";

		const ruleName = rule.name || `Rule ${index + 1}`;
		const setting = new Setting(settingContainer)
			.setName(ruleName)
			.addToggle((toggle) =>
				toggle.setValue(rule.enabled).onChange(async (value) => {
					preset.settings.customRules[index].enabled = value;
					await this.plugin.saveSettings();
				}),
			)
			.addExtraButton((button) =>
				button
					.setIcon("settings")
					.setTooltip("Edit")
					.onClick(() => {
						const modal = new RuleEditorModal(
							this.app,
							rule,
							`Rule ${index + 1}`,
							async () => {
								await this.plugin.saveSettings();
							},
							() => {
								this.display();
							},
						);
						modal.open();
					}),
			)
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
						await this.plugin.saveSettings();
						this.display();
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Delete")
					.onClick(() => {
						const ruleName = rule.name || `Rule ${index + 1}`;
						const modal = new ConfirmModal(
							this.app,
							`Delete rule "${ruleName}"?`,
							async () => {
								preset.settings.customRules.splice(index, 1);
								await this.plugin.saveSettings();
								this.display();
							},
						);
						modal.open();
					}),
			);
		// Remove default padding/margin from Setting but keep full width
		setting.settingEl.style.border = "none";
		setting.settingEl.style.padding = "0";
		setting.settingEl.style.width = "100%";
	}
}
