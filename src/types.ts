/**
 * Type definitions and default settings for the plugin.
 * These types are shared across the markdown converter and settings UI.
 */

// =============================================================================
// Custom Rule Types
// =============================================================================

/** Regex-based replacement rule applied after markdown conversion */
export interface CustomRule {
	name: string;
	pattern: string;
	replacement: string;
	caseInsensitive: boolean;
	enabled: boolean;
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
	// Section toggles
	enableMarkdownConversion: boolean;
	enableHeadings: boolean;
	enableLists: boolean;
	enableTextDecoration: boolean;
	enableBlockElements: boolean;
	enableCode: boolean;

	// Headings
	heading1Prefix: string;
	heading2Prefix: string;
	heading3Prefix: string;
	heading4Prefix: string;

	// Lists
	bulletChar: string;
	checkboxChecked: string;
	checkboxUnchecked: string;

	// Text decoration
	useBoldUnicode: boolean;
	useItalicUnicode: boolean;
	useStrikethrough: boolean;

	// Block elements
	horizontalRule: string;
	blockquotePrefix: string;

	// Code
	codeBlockPrefix: string;
	inlineCodeWrapper: string;

	// Custom rules (applied after markdown conversion)
	customRules: CustomRule[];
}

// =============================================================================
// Default Settings
// =============================================================================

export const DEFAULT_SETTINGS: MarkdownConversionSettings = {
	// Section toggles
	enableMarkdownConversion: true,
	enableHeadings: true,
	enableLists: true,
	enableTextDecoration: true,
	enableBlockElements: true,
	enableCode: true,

	// Headings - Unicode block characters for visual hierarchy
	heading1Prefix: "▌",
	heading2Prefix: "▍",
	heading3Prefix: "▎",
	heading4Prefix: "▏",

	// Lists
	bulletChar: "•",
	checkboxChecked: "☑",
	checkboxUnchecked: "☐",

	// Text decoration
	useBoldUnicode: true,
	useItalicUnicode: true,
	useStrikethrough: true,

	// Block elements
	horizontalRule: "────────────",
	blockquotePrefix: "│ ",

	// Code
	codeBlockPrefix: "  ",
	inlineCodeWrapper: "`",

	// Default custom rules for checkbox variants not recognized by marked
	customRules: [
		{
			name: "In-progress checkbox",
			pattern: "• \\[/\\] ?",
			replacement: "◐ ",
			caseInsensitive: true,
			enabled: true,
		},
		{
			name: "Cancelled checkbox",
			pattern: "• \\[-\\] ?",
			replacement: "☒ ",
			caseInsensitive: true,
			enabled: true,
		},
	],
};
