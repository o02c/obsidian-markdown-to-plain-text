/**
 * Type definitions and default settings for the plugin.
 * These types are shared across the markdown converter and settings UI.
 */

// =============================================================================
// Custom Rule Types
// =============================================================================

/** Regex-based replacement rule applied before or after markdown conversion */
export interface CustomRule {
	name: string;
	pattern: string;
	replacement: string;
	caseInsensitive: boolean;
	enabled: boolean;
	applyBeforeConversion?: boolean;
}

// =============================================================================
// Preset Types
// =============================================================================

/** A named preset containing conversion settings */
export interface Preset {
	id: string;
	name: string;
	settings: MarkdownConversionSettings;
}

/** Plugin-level settings containing all presets */
export interface PluginSettings {
	presets: Preset[];
}

/** Generate a random ID for new presets */
export function generatePresetId(): string {
	return Math.random().toString(36).substring(2, 9);
}

// =============================================================================
// Markdown Conversion Settings
// =============================================================================

/** Settings for markdown to plain text conversion */
export interface MarkdownConversionSettings {
	// Master toggle
	enableMarkdownConversion: boolean;

	// Headings (section toggle)
	enableHeadings: boolean;
	heading1Prefix: string;
	heading2Prefix: string;
	heading3Prefix: string;
	heading4Prefix: string;

	// Lists (individual toggles)
	enableBullet: boolean;
	bulletChar: string;
	enableCheckbox: boolean;
	checkboxChecked: string;
	checkboxUnchecked: string;

	// Text decoration (individual toggles)
	useBoldUnicode: boolean;
	useItalicUnicode: boolean;
	useStrikethrough: boolean;

	// Block elements (individual toggles)
	enableHorizontalRule: boolean;
	horizontalRule: string;
	enableBlockquote: boolean;
	blockquotePrefix: string;

	// Code (individual toggles)
	enableCodeBlock: boolean;
	codeBlockPrefix: string;
	enableInlineCode: boolean;
	inlineCodeWrapper: string;

	// Custom rules (applied after markdown conversion)
	customRules: CustomRule[];
}

// =============================================================================
// Default Settings
// =============================================================================

export const DEFAULT_SETTINGS: MarkdownConversionSettings = {
	// Master toggle
	enableMarkdownConversion: true,

	// Headings
	enableHeadings: true,
	heading1Prefix: "▌",
	heading2Prefix: "▍",
	heading3Prefix: "▎",
	heading4Prefix: "▏",

	// Lists
	enableBullet: true,
	bulletChar: "•",
	enableCheckbox: true,
	checkboxChecked: "☑",
	checkboxUnchecked: "☐",

	// Text decoration
	useBoldUnicode: true,
	useItalicUnicode: true,
	useStrikethrough: true,

	// Block elements
	enableHorizontalRule: true,
	horizontalRule: "────────────",
	enableBlockquote: true,
	blockquotePrefix: "│ ",

	// Code
	enableCodeBlock: true,
	codeBlockPrefix: "  ",
	enableInlineCode: true,
	inlineCodeWrapper: "`",

	// Default custom rules for checkbox variants not recognized by marked
	customRules: [
		{
			name: "In-progress checkbox",
			pattern: "^(\\s*)• \\[/\\] ?",
			replacement: "$1◐ ",
			caseInsensitive: true,
			enabled: true,
		},
		{
			name: "Cancelled checkbox",
			pattern: "^(\\s*)• \\[-\\] ?",
			replacement: "$1☒ ",
			caseInsensitive: true,
			enabled: true,
		},
	],
};
