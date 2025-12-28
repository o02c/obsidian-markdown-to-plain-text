/**
 * Markdown to plain text converter using the marked library.
 * Converts markdown syntax to Unicode-formatted plain text.
 */

import { Lexer, type Token, type Tokens } from "marked";
import type { CustomRule, MarkdownConversionSettings } from "./types";

// =============================================================================
// Types
// =============================================================================

interface RenderContext {
	settings: MarkdownConversionSettings;
	listDepth: number;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/** Convert markdown text to plain text with Unicode formatting */
export function convertMarkdownToPlainText(
	markdown: string,
	settings: MarkdownConversionSettings,
): string {
	// Master toggle - return raw input if disabled
	if (!settings.enableMarkdownConversion) {
		return markdown;
	}

	// Separate before and after rules
	const beforeRules = settings.customRules.filter(
		(r) => r.applyBeforeConversion === true,
	);
	const afterRules = settings.customRules.filter(
		(r) => r.applyBeforeConversion !== true,
	);

	// Apply before rules
	const text = applyCustomRules(markdown, beforeRules);

	// Markdown conversion
	const lexer = new Lexer();
	const tokens = lexer.lex(text);
	const ctx: RenderContext = { settings, listDepth: 0 };
	let result = renderTokens(tokens, ctx);

	// Apply after rules
	result = applyCustomRules(result, afterRules);

	return result;
}

// =============================================================================
// Token Rendering - Core
// =============================================================================

function renderTokens(tokens: Token[], ctx: RenderContext): string {
	return tokens.map((token) => renderToken(token, ctx)).join("");
}

function renderToken(token: Token, ctx: RenderContext): string {
	switch (token.type) {
		case "heading":
			return renderHeading(token as Tokens.Heading, ctx);
		case "paragraph":
			return renderParagraph(token as Tokens.Paragraph, ctx);
		case "text":
			return renderText(token as Tokens.Text, ctx);
		case "strong":
			return renderStrong(token as Tokens.Strong, ctx);
		case "em":
			return renderEm(token as Tokens.Em, ctx);
		case "del":
			return renderDel(token as Tokens.Del, ctx);
		case "codespan":
			return renderCodespan(token as Tokens.Codespan, ctx);
		case "code":
			return renderCode(token as Tokens.Code, ctx);
		case "blockquote":
			return renderBlockquote(token as Tokens.Blockquote, ctx);
		case "list":
			return renderList(token as Tokens.List, ctx);
		case "link":
			return renderLink(token as Tokens.Link, ctx);
		case "image":
			return renderImage(token as Tokens.Image);
		case "hr":
			return ctx.settings.enableHorizontalRule
				? `${ctx.settings.horizontalRule}\n`
				: "";
		case "br":
		case "space":
			return "\n";
		case "checkbox":
			return ""; // Handled by getBullet in list items
		case "html":
			return (token as Tokens.HTML).raw;
		case "escape":
			return (token as Tokens.Escape).text;
		default:
			return "raw" in token ? (token as { raw: string }).raw : "";
	}
}

// =============================================================================
// Token Rendering - Headings
// =============================================================================

function renderHeading(token: Tokens.Heading, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);

	if (!ctx.settings.enableHeadings) {
		return `${text}\n`;
	}

	const prefixes: Record<number, string> = {
		1: ctx.settings.heading1Prefix,
		2: ctx.settings.heading2Prefix,
		3: ctx.settings.heading3Prefix,
		4: ctx.settings.heading4Prefix,
	};
	const prefix = prefixes[token.depth] || "";

	return `${prefix} ${text}\n`;
}

// =============================================================================
// Token Rendering - Text & Paragraphs
// =============================================================================

function renderParagraph(token: Tokens.Paragraph, ctx: RenderContext): string {
	return `${renderTokens(token.tokens, ctx)}\n`;
}

function renderText(token: Tokens.Text, ctx: RenderContext): string {
	return token.tokens ? renderTokens(token.tokens, ctx) : token.text;
}

// =============================================================================
// Token Rendering - Text Decoration (Bold, Italic, Strikethrough)
// =============================================================================

function renderStrong(token: Tokens.Strong, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	switch (ctx.settings.boldMode) {
		case "keep":
			return `**${text}**`;
		case "unicode":
			return convertToBoldUnicode(text);
		case "remove":
			return text;
	}
}

function renderEm(token: Tokens.Em, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	switch (ctx.settings.italicMode) {
		case "keep":
			return `*${text}*`;
		case "unicode":
			return convertToItalicUnicode(text);
		case "remove":
			return text;
	}
}

function renderDel(token: Tokens.Del, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	switch (ctx.settings.strikethroughMode) {
		case "keep":
			return `~~${text}~~`;
		case "unicode":
			return convertToStrikethrough(text);
		case "remove":
			return text;
	}
}

// =============================================================================
// Token Rendering - Code
// =============================================================================

function renderCodespan(token: Tokens.Codespan, ctx: RenderContext): string {
	if (!ctx.settings.enableInlineCode) return token.text;
	const w = ctx.settings.inlineCodeWrapper;
	return `${w}${token.text}${w}`;
}

function renderCode(token: Tokens.Code, ctx: RenderContext): string {
	if (!ctx.settings.enableCodeBlock) {
		return `${token.text}\n`;
	}
	const prefix = ctx.settings.codeBlockPrefix;
	return `${token.text
		.split("\n")
		.map((line) => prefix + line)
		.join("\n")}\n`;
}

// =============================================================================
// Token Rendering - Block Elements
// =============================================================================

function renderBlockquote(
	token: Tokens.Blockquote,
	ctx: RenderContext,
): string {
	const content = renderTokens(token.tokens, ctx);

	if (!ctx.settings.enableBlockquote) {
		return content;
	}

	const prefix = ctx.settings.blockquotePrefix;
	return content
		.split("\n")
		.map((line) => (line ? prefix + line : line))
		.join("\n");
}

// =============================================================================
// Token Rendering - Lists
// =============================================================================

function renderList(token: Tokens.List, ctx: RenderContext): string {
	return token.items
		.map((item, index) => renderListItem(item, ctx, token.ordered, index))
		.join("");
}

function renderListItem(
	token: Tokens.ListItem,
	ctx: RenderContext,
	ordered: boolean,
	index: number,
): string {
	const { settings, listDepth } = ctx;

	// Separate content tokens from nested lists
	const contentTokens = token.tokens.filter((t) => t.type !== "list");
	const nestedLists = token.tokens.filter(
		(t) => t.type === "list",
	) as Tokens.List[];

	// Render content (filter checkbox token)
	const filteredContent = contentTokens.filter((t) => t.type !== "checkbox");
	const content = renderTokens(filteredContent, ctx).trim();

	// Render nested lists with increased depth
	const nestedCtx: RenderContext = { settings, listDepth: listDepth + 1 };
	const nested = nestedLists
		.map((list) => renderList(list, nestedCtx))
		.join("");

	const bullet = getBullet(token, settings, ordered, index);
	if (bullet === null) {
		// No bullet/checkbox conversion
		return `${content}\n${nested}`;
	}

	const indent = "  ".repeat(listDepth);
	return `${indent}${bullet} ${content}\n${nested}`;
}

function getBullet(
	token: Tokens.ListItem,
	settings: MarkdownConversionSettings,
	ordered: boolean,
	index: number,
): string | null {
	// Standard checkboxes (marked recognizes [x] and [ ])
	if (token.task) {
		if (!settings.enableCheckbox) return null;
		return token.checked
			? settings.checkboxChecked
			: settings.checkboxUnchecked;
	}

	// Ordered lists keep their numbers
	if (ordered) {
		return `${index + 1}.`;
	}

	// Unordered lists
	if (!settings.enableBullet) return null;
	return settings.bulletChar;
}

// =============================================================================
// Token Rendering - Links & Images
// =============================================================================

function renderLink(token: Tokens.Link, ctx: RenderContext): string {
	return renderTokens(token.tokens, ctx);
}

function renderImage(token: Tokens.Image): string {
	return token.text || "";
}

// =============================================================================
// Unicode Text Conversion
// =============================================================================

/** Convert ASCII text to mathematical bold Unicode characters */
function convertToBoldUnicode(text: string): string {
	return [...text]
		.map((char) => {
			const code = char.codePointAt(0);
			if (code === undefined) return char;
			// A-Z → 𝐀-𝐙
			if (code >= 65 && code <= 90)
				return String.fromCodePoint(code - 65 + 0x1d400);
			// a-z → 𝐚-𝐳
			if (code >= 97 && code <= 122)
				return String.fromCodePoint(code - 97 + 0x1d41a);
			// 0-9 → 𝟎-𝟗
			if (code >= 48 && code <= 57)
				return String.fromCodePoint(code - 48 + 0x1d7ce);
			return char;
		})
		.join("");
}

/** Convert ASCII text to mathematical italic Unicode characters */
function convertToItalicUnicode(text: string): string {
	return [...text]
		.map((char) => {
			const code = char.codePointAt(0);
			if (code === undefined) return char;
			// A-Z → 𝐴-𝑍
			if (code >= 65 && code <= 90)
				return String.fromCodePoint(code - 65 + 0x1d434);
			// a-z → 𝑎-𝑧
			if (code >= 97 && code <= 122)
				return String.fromCodePoint(code - 97 + 0x1d44e);
			return char;
		})
		.join("");
}

/** Add strikethrough combining character to each character */
function convertToStrikethrough(text: string): string {
	return [...text].map((char) => `${char}\u0336`).join("");
}

// =============================================================================
// Custom Rules Processing
// =============================================================================

/** Apply user-defined regex replacement rules */
function applyCustomRules(text: string, rules: CustomRule[]): string {
	let result = text;

	for (const rule of rules) {
		if (!rule.enabled) continue;

		try {
			const flags = rule.caseInsensitive ? "gmi" : "gm";
			const regex = new RegExp(rule.pattern, flags);
			const replacement = unescapeString(rule.replacement);
			result = result.replace(regex, replacement);
		} catch {
			console.warn(`Invalid custom rule pattern: ${rule.pattern}`);
		}
	}

	return result;
}

/** Convert escape sequences in replacement strings */
function unescapeString(str: string): string {
	return str
		.replace(/\\n/g, "\n")
		.replace(/\\t/g, "\t")
		.replace(/\\r/g, "\r")
		.replace(/\\\\/g, "\\");
}
