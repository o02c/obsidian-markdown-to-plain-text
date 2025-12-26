/**
 * Modal dialogs used in the settings UI.
 */

import { type App, Modal, Setting } from "obsidian";
import type { CustomRule } from "../types";

// =============================================================================
// Confirm Modal - Delete confirmation dialog
// =============================================================================

export class ConfirmModal extends Modal {
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

// =============================================================================
// Rule Editor Modal - Edit custom regex rule
// =============================================================================

export class RuleEditorModal extends Modal {
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

		// Rule name
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

		// Regex pattern
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

		// Replacement string
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

		// Case sensitivity toggle
		new Setting(contentEl)
			.setName("Case insensitive")
			.setDesc("Ignore case when matching")
			.addToggle((toggle) =>
				toggle.setValue(this.rule.caseInsensitive).onChange(async (value) => {
					this.rule.caseInsensitive = value;
					await this.onSaveCallback();
				}),
			);

		// Apply before conversion toggle
		new Setting(contentEl)
			.setName("Apply before conversion")
			.setDesc("Run this rule before markdown conversion (default: after)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.rule.applyBeforeConversion ?? false)
					.onChange(async (value) => {
						this.rule.applyBeforeConversion = value;
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
