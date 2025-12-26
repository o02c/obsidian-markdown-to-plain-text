export interface CustomRule {
	name: string;
	pattern: string;
	replacement: string;
	caseInsensitive: boolean;
	enabled: boolean;
}

export interface Preset {
	id: string;
	name: string;
	settings: MarkdownConversionSettings;
}

export interface PluginSettings {
	presets: Preset[];
}

export function generatePresetId(): string {
	return Math.random().toString(36).substring(2, 9);
}

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

export const DEFAULT_SETTINGS: MarkdownConversionSettings = {
	enableMarkdownConversion: true,
	enableHeadings: true,
	enableLists: true,
	enableTextDecoration: true,
	enableBlockElements: true,
	enableCode: true,

	heading1Prefix: "▌",
	heading2Prefix: "▍",
	heading3Prefix: "▎",
	heading4Prefix: "▏",

	bulletChar: "•",
	checkboxChecked: "☑",
	checkboxUnchecked: "☐",

	useBoldUnicode: true,
	useItalicUnicode: true,
	useStrikethrough: true,

	horizontalRule: "────────────",
	blockquotePrefix: "│ ",

	codeBlockPrefix: "  ",
	inlineCodeWrapper: "`",

	customRules: [
		// Custom checkbox patterns (marked only recognizes [x] and [ ])
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
