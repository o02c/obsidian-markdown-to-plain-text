import { Lexer, type Token, type Tokens } from "marked";
import type { CustomRule, MarkdownConversionSettings } from "./types";

interface RenderContext {
	settings: MarkdownConversionSettings;
	listDepth: number;
}

export function convertMarkdownToPlainText(
	markdown: string,
	settings: MarkdownConversionSettings,
): string {
	// Master toggle - return raw input if disabled
	if (!settings.enableMarkdownConversion) {
		return markdown;
	}

	const lexer = new Lexer();
	const tokens = lexer.lex(markdown);
	const ctx: RenderContext = { settings, listDepth: 0 };
	let result = renderTokens(tokens, ctx);
	result = applyCustomRules(result, settings.customRules);
	return result;
}

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

function unescapeString(str: string): string {
	return str
		.replace(/\\n/g, "\n")
		.replace(/\\t/g, "\t")
		.replace(/\\r/g, "\r")
		.replace(/\\\\/g, "\\");
}

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
		case "checkbox":
			return ""; // Handled by getBullet in list items
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
			return ctx.settings.enableBlockElements
				? `${ctx.settings.horizontalRule}\n`
				: "";
		case "br":
		case "space":
			return "\n";
		case "html":
			return (token as Tokens.HTML).raw;
		case "escape":
			return (token as Tokens.Escape).text;
		default:
			return "raw" in token ? (token as { raw: string }).raw : "";
	}
}

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

function renderParagraph(token: Tokens.Paragraph, ctx: RenderContext): string {
	return `${renderTokens(token.tokens, ctx)}\n`;
}

function renderText(token: Tokens.Text, ctx: RenderContext): string {
	return token.tokens ? renderTokens(token.tokens, ctx) : token.text;
}

function renderStrong(token: Tokens.Strong, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	if (!ctx.settings.enableTextDecoration) return text;
	return ctx.settings.useBoldUnicode ? convertToBoldUnicode(text) : text;
}

function renderEm(token: Tokens.Em, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	if (!ctx.settings.enableTextDecoration) return text;
	return ctx.settings.useItalicUnicode ? convertToItalicUnicode(text) : text;
}

function renderDel(token: Tokens.Del, ctx: RenderContext): string {
	const text = renderTokens(token.tokens, ctx);
	if (!ctx.settings.enableTextDecoration) return text;
	return ctx.settings.useStrikethrough ? convertToStrikethrough(text) : text;
}

function renderCodespan(token: Tokens.Codespan, ctx: RenderContext): string {
	if (!ctx.settings.enableCode) return token.text;
	const w = ctx.settings.inlineCodeWrapper;
	return `${w}${token.text}${w}`;
}

function renderCode(token: Tokens.Code, ctx: RenderContext): string {
	const prefix = ctx.settings.codeBlockPrefix;
	return `${token.text
		.split("\n")
		.map((line) => prefix + line)
		.join("\n")}\n`;
}

function renderBlockquote(
	token: Tokens.Blockquote,
	ctx: RenderContext,
): string {
	const content = renderTokens(token.tokens, ctx);
	if (!ctx.settings.enableBlockElements) {
		return content;
	}
	const prefix = ctx.settings.blockquotePrefix;
	return content
		.split("\n")
		.map((line) => (line ? prefix + line : line))
		.join("\n");
}

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

	if (!settings.enableLists) {
		return `${content}\n${nested}`;
	}

	const indent = "  ".repeat(listDepth);
	const bullet = getBullet(token, settings, ordered, index);
	return `${indent}${bullet} ${content}\n${nested}`;
}

function getBullet(
	token: Tokens.ListItem,
	settings: MarkdownConversionSettings,
	ordered: boolean,
	index: number,
): string {
	// Standard checkboxes (marked recognizes [x] and [ ])
	if (token.task) {
		return token.checked
			? settings.checkboxChecked
			: settings.checkboxUnchecked;
	}

	// Ordered/unordered
	return ordered ? `${index + 1}.` : settings.bulletChar;
}

function renderLink(token: Tokens.Link, ctx: RenderContext): string {
	return renderTokens(token.tokens, ctx);
}

function renderImage(token: Tokens.Image): string {
	return token.text || "";
}

// Unicode conversion functions

function convertToBoldUnicode(text: string): string {
	return [...text]
		.map((char) => {
			const code = char.codePointAt(0);
			if (code === undefined) return char;
			if (code >= 65 && code <= 90)
				return String.fromCodePoint(code - 65 + 0x1d400);
			if (code >= 97 && code <= 122)
				return String.fromCodePoint(code - 97 + 0x1d41a);
			if (code >= 48 && code <= 57)
				return String.fromCodePoint(code - 48 + 0x1d7ce);
			return char;
		})
		.join("");
}

function convertToItalicUnicode(text: string): string {
	return [...text]
		.map((char) => {
			const code = char.codePointAt(0);
			if (code === undefined) return char;
			if (code >= 65 && code <= 90)
				return String.fromCodePoint(code - 65 + 0x1d434);
			if (code >= 97 && code <= 122)
				return String.fromCodePoint(code - 97 + 0x1d44e);
			return char;
		})
		.join("");
}

function convertToStrikethrough(text: string): string {
	return [...text].map((char) => `${char}\u0336`).join("");
}
