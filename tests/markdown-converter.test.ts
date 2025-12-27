import { describe, expect, it } from "vitest";
import { convertMarkdownToPlainText } from "../src/markdown-converter";
import { DEFAULT_SETTINGS } from "../src/types";

describe("convertMarkdownToPlainText", () => {
	describe("Headings", () => {
		it("converts # heading to prefix", () => {
			const result = convertMarkdownToPlainText("# Title", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("▌ Title");
		});

		it("converts ## heading to prefix", () => {
			const result = convertMarkdownToPlainText("## Title", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("▍ Title");
		});

		it("converts ### heading to prefix", () => {
			const result = convertMarkdownToPlainText("### Title", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("▎ Title");
		});

		it("converts #### heading to prefix", () => {
			const result = convertMarkdownToPlainText("#### Title", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("▏ Title");
		});
	});

	describe("Checkboxes", () => {
		it("converts [x] to checked symbol", () => {
			const result = convertMarkdownToPlainText("- [x] Done", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("☑ Done");
		});

		it("converts [X] (uppercase) to checked symbol", () => {
			const result = convertMarkdownToPlainText("- [X] Done", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("☑ Done");
		});

		it("converts [ ] to unchecked symbol", () => {
			const result = convertMarkdownToPlainText("- [ ] Todo", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("☐ Todo");
		});

		it("converts [/] to in-progress symbol", () => {
			const result = convertMarkdownToPlainText(
				"- [/] In progress",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("◐ In progress");
		});

		it("converts [-] to cancelled symbol", () => {
			const result = convertMarkdownToPlainText(
				"- [-] Cancelled",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("☒ Cancelled");
		});
	});

	describe("Bullet lists", () => {
		it("converts - to bullet", () => {
			const result = convertMarkdownToPlainText("- Item", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("• Item");
		});

		it("converts * to bullet", () => {
			const result = convertMarkdownToPlainText("* Item", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("• Item");
		});

		it("handles nested lists", () => {
			const result = convertMarkdownToPlainText(
				"- Parent\n  - Child",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("• Parent");
			expect(result).toContain("• Child");
		});

		it("handles complex mixed nested lists with indentation", () => {
			const input = `- Project A
  1. Task 1
     - Subtask 1a
     - Subtask 1b
  2. Task 2
- Project B
  - Item X
    1. Detail 1
    2. Detail 2
       - Note A
       - Note B`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);

			// Verify structure with exact expectations (2 spaces per depth level)
			const lines = result.trim().split("\n");
			expect(lines[0]).toBe("• Project A");
			expect(lines[1]).toBe("  1. Task 1"); // depth 1
			expect(lines[2]).toBe("    • Subtask 1a"); // depth 2
			expect(lines[3]).toBe("    • Subtask 1b"); // depth 2
			expect(lines[4]).toBe("  2. Task 2"); // depth 1
			expect(lines[5]).toBe("• Project B");
			expect(lines[6]).toBe("  • Item X"); // depth 1
			expect(lines[7]).toBe("    1. Detail 1"); // depth 2
			expect(lines[8]).toBe("    2. Detail 2"); // depth 2
			expect(lines[9]).toBe("      • Note A"); // depth 3
			expect(lines[10]).toBe("      • Note B"); // depth 3
		});
	});

	describe("Blockquotes", () => {
		it("converts > to blockquote prefix", () => {
			const result = convertMarkdownToPlainText("> Quote", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("│ Quote");
		});

		it("handles > with no space", () => {
			const result = convertMarkdownToPlainText(">Quote", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("│ Quote");
		});
	});

	describe("Horizontal rules", () => {
		it("converts --- to horizontal rule", () => {
			const result = convertMarkdownToPlainText("---", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("────────────");
		});

		it("converts *** to horizontal rule", () => {
			const result = convertMarkdownToPlainText("***", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("────────────");
		});
	});

	describe("Bold text", () => {
		it("converts **text** to unicode bold", () => {
			const result = convertMarkdownToPlainText("**Hello**", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("𝐇𝐞𝐥𝐥𝐨");
		});

		it("converts __text__ to unicode bold", () => {
			const result = convertMarkdownToPlainText("__World__", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("𝐖𝐨𝐫𝐥𝐝");
		});

		it("keeps non-ASCII characters unchanged", () => {
			const result = convertMarkdownToPlainText(
				"**Hello日本語**",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("𝐇𝐞𝐥𝐥𝐨日本語");
		});

		it("strips bold when disabled", () => {
			const settings = { ...DEFAULT_SETTINGS, useBoldUnicode: false };
			const result = convertMarkdownToPlainText("**Hello**", settings);
			expect(result.trim()).toBe("Hello");
		});
	});

	describe("Italic text", () => {
		it("converts *text* to unicode italic", () => {
			const result = convertMarkdownToPlainText("*Hello*", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("𝐻𝑒𝑙𝑙𝑜");
		});

		it("converts _text_ to unicode italic", () => {
			const result = convertMarkdownToPlainText("_World_", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("𝑊𝑜𝑟𝑙𝑑");
		});

		it("strips italic when disabled", () => {
			const settings = { ...DEFAULT_SETTINGS, useItalicUnicode: false };
			const result = convertMarkdownToPlainText("*Hello*", settings);
			expect(result.trim()).toBe("Hello");
		});
	});

	describe("Strikethrough", () => {
		it("converts ~~text~~ to strikethrough", () => {
			const result = convertMarkdownToPlainText("~~Hello~~", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("H̶e̶l̶l̶o̶");
		});

		it("strips strikethrough when disabled", () => {
			const settings = { ...DEFAULT_SETTINGS, useStrikethrough: false };
			const result = convertMarkdownToPlainText("~~Hello~~", settings);
			expect(result.trim()).toBe("Hello");
		});
	});

	describe("Links", () => {
		it("extracts link text", () => {
			const result = convertMarkdownToPlainText(
				"[Click here](https://example.com)",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("Click here");
		});
	});

	describe("Images", () => {
		it("extracts alt text", () => {
			const result = convertMarkdownToPlainText(
				"![Alt text](image.png)",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("Alt text");
		});
	});

	describe("Code", () => {
		it("wraps inline code", () => {
			const result = convertMarkdownToPlainText(
				"some `code` here",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("`code`");
		});

		it("prefixes code block lines", () => {
			const input = "```js\nconst x = 1;\n```";
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("  const x = 1;");
		});

		it("does not convert markdown inside code blocks", () => {
			const input = "```\n**not bold** and *not italic*\n```";
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("**not bold**");
			expect(result).toContain("*not italic*");
		});

		it("does not convert markdown inside inline code", () => {
			const result = convertMarkdownToPlainText(
				"Use `**bold**` syntax",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("`**bold**`");
		});
	});

	describe("Custom rules", () => {
		it("applies enabled custom rules", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "foo to bar",
						pattern: "foo",
						replacement: "bar",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("foo and foo", settings);
			expect(result).toContain("bar and bar");
		});

		it("skips disabled custom rules", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "",
						pattern: "foo",
						replacement: "bar",
						caseInsensitive: true,
						enabled: false,
					},
				],
			};
			const result = convertMarkdownToPlainText("foo", settings);
			expect(result).toContain("foo");
		});

		it("applies multiple rules in order", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "a to b",
						pattern: "a",
						replacement: "b",
						caseInsensitive: true,
						enabled: true,
					},
					{
						name: "b to c",
						pattern: "b",
						replacement: "c",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("aaa", settings);
			expect(result.trim()).toBe("ccc");
		});

		it("handles capture groups", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "email swap",
						pattern: "(\\w+)@(\\w+)",
						replacement: "$2:$1",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("user@domain", settings);
			expect(result).toContain("domain:user");
		});

		it("handles invalid regex gracefully", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "invalid",
						pattern: "[invalid",
						replacement: "x",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			// Should not throw
			const result = convertMarkdownToPlainText("test", settings);
			expect(result).toContain("test");
		});
	});

	describe("Nested ordered lists", () => {
		it("restarts numbering for nested ordered lists with indentation", () => {
			const input = `1. o
2. s
    1. ou
    2. empty`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			const lines = result.trim().split("\n");
			expect(lines[0]).toBe("1. o");
			expect(lines[1]).toBe("2. s");
			expect(lines[2]).toBe("  1. ou"); // Indented, restart at 1
			expect(lines[3]).toBe("  2. empty"); // Indented
		});
	});

	describe("Loose lists (with blank lines)", () => {
		it("handles checkboxes in loose lists", () => {
			const input = `- [ ] Task 1
- [ ] Task 2

- [x] Task 3`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).not.toContain("[ ]");
			expect(result).not.toContain("[x]");
			expect(result).toContain("☐ Task 1");
			expect(result).toContain("☐ Task 2");
			expect(result).toContain("☑ Task 3");
		});

		it("handles nested list in loose parent", () => {
			const input = `- Parent 1

- Parent 2
  - Child A
  - Child B

- Parent 3`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("• Parent 1");
			expect(result).toContain("• Parent 2");
			expect(result).toContain("• Child A");
			expect(result).toContain("• Parent 3");
		});

		it("handles mixed tight and loose sections", () => {
			const input = `- Tight 1
- Tight 2

- Loose after blank

- Another loose
- Back to tight`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("• Tight 1");
			expect(result).toContain("• Tight 2");
			expect(result).toContain("• Loose after blank");
			expect(result).toContain("• Another loose");
			expect(result).toContain("• Back to tight");
			// Should not have duplicated bullets
			expect(result).not.toMatch(/• •/);
		});
	});

	describe("Structural variations - HIGH RISK", () => {
		it("handles bold inside link text", () => {
			const result = convertMarkdownToPlainText(
				"[**Bold link**](url)",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("𝐁𝐨𝐥𝐝 𝐥𝐢𝐧𝐤");
		});

		it("handles italic inside heading", () => {
			const result = convertMarkdownToPlainText(
				"# Title with *italic*",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("▌");
			expect(result).toContain("𝑖𝑡𝑎𝑙𝑖𝑐");
		});

		it("handles bold inside list item", () => {
			const result = convertMarkdownToPlainText(
				"- Item with **bold** text",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("• Item with");
			expect(result).toContain("𝐛𝐨𝐥𝐝");
		});

		it("handles formatting inside blockquote", () => {
			const result = convertMarkdownToPlainText(
				"> Quote with **bold** and *italic*",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("│");
			expect(result).toContain("𝐛𝐨𝐥𝐝");
			expect(result).toContain("𝑖𝑡𝑎𝑙𝑖𝑐");
		});

		it("handles list inside blockquote", () => {
			const input = `> Quote
> - Item 1
> - Item 2`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("│");
			expect(result).toContain("•");
		});

		it("handles deeply nested lists (4 levels)", () => {
			const input = `- Level 1
  - Level 2
    - Level 3
      - Level 4`;
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			const lines = result.trim().split("\n");
			expect(lines[0]).toBe("• Level 1");
			expect(lines[1]).toBe("  • Level 2");
			expect(lines[2]).toBe("    • Level 3");
			expect(lines[3]).toBe("      • Level 4");
		});

		it("handles tab indentation in lists", () => {
			const input = "- Parent\n\t- Child with tab";
			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);
			expect(result).toContain("• Parent");
			expect(result).toContain("• Child");
		});
	});

	describe("Custom rules edge cases", () => {
		it("rule can match converted unicode characters", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "bold to X",
						pattern: "𝐛𝐨𝐥𝐝",
						replacement: "X",
						caseInsensitive: false,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("**bold**", settings);
			expect(result).toContain("X");
		});

		it("handles empty replacement", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "remove foo",
						pattern: "foo",
						replacement: "",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("foo bar foo", settings);
			expect(result.trim()).toBe("bar");
		});

		it("case sensitive rule respects case", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "case sensitive",
						pattern: "Foo",
						replacement: "X",
						caseInsensitive: false,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("Foo foo FOO", settings);
			expect(result).toContain("X");
			expect(result).toContain("foo");
			expect(result).toContain("FOO");
		});

		it("applies rule before markdown conversion when applyBeforeConversion is true", () => {
			// Replace **bold** with REPLACED before markdown processing
			// So markdown won't convert it to unicode bold
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "replace bold syntax",
						pattern: "\\*\\*bold\\*\\*",
						replacement: "REPLACED",
						caseInsensitive: false,
						enabled: true,
						applyBeforeConversion: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("**bold**", settings);
			expect(result.trim()).toBe("REPLACED");
			// Should NOT contain unicode bold since we replaced before conversion
			expect(result).not.toContain("𝐛𝐨𝐥𝐝");
		});

		it("applies rule after markdown conversion by default", () => {
			// Without applyBeforeConversion, rule runs after conversion
			// So **bold** becomes unicode bold first, then rule won't match
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "replace bold syntax",
						pattern: "\\*\\*bold\\*\\*",
						replacement: "REPLACED",
						caseInsensitive: false,
						enabled: true,
						// applyBeforeConversion defaults to false
					},
				],
			};
			const result = convertMarkdownToPlainText("**bold**", settings);
			// Should contain unicode bold since rule ran after conversion
			expect(result).toContain("𝐛𝐨𝐥𝐝");
			expect(result).not.toContain("REPLACED");
		});

		it("applies before and after rules in correct order", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "after rule",
						pattern: "𝐛𝐨𝐥𝐝",
						replacement: "AFTER",
						caseInsensitive: false,
						enabled: true,
						applyBeforeConversion: false,
					},
					{
						name: "before rule",
						pattern: "\\*italic\\*",
						replacement: "BEFORE",
						caseInsensitive: false,
						enabled: true,
						applyBeforeConversion: true,
					},
				],
			};
			const result = convertMarkdownToPlainText(
				"**bold** and *italic*",
				settings,
			);
			// "*italic*" replaced before conversion, so no italic processing
			expect(result).toContain("BEFORE");
			expect(result).not.toContain("𝑖𝑡𝑎𝑙𝑖𝑐");
			// bold converted to unicode, then replaced by after rule
			expect(result).toContain("AFTER");
		});
	});

	describe("Section toggles", () => {
		it("skips heading conversion when enableHeadings is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableHeadings: false };
			const result = convertMarkdownToPlainText("# Title", settings);
			expect(result.trim()).toBe("Title");
		});

		it("skips bullet conversion when enableBullet is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableBullet: false };
			const result = convertMarkdownToPlainText("- Item", settings);
			expect(result.trim()).toBe("Item");
		});

		it("skips checkbox conversion when enableCheckbox is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableCheckbox: false };
			const result = convertMarkdownToPlainText("- [x] Done", settings);
			expect(result.trim()).toBe("Done");
		});

		it("skips bold conversion when useBoldUnicode is false", () => {
			const settings = { ...DEFAULT_SETTINGS, useBoldUnicode: false };
			const result = convertMarkdownToPlainText("**bold**", settings);
			expect(result.trim()).toBe("bold");
		});

		it("skips italic conversion when useItalicUnicode is false", () => {
			const settings = { ...DEFAULT_SETTINGS, useItalicUnicode: false };
			const result = convertMarkdownToPlainText("*italic*", settings);
			expect(result.trim()).toBe("italic");
		});

		it("skips strikethrough conversion when useStrikethrough is false", () => {
			const settings = { ...DEFAULT_SETTINGS, useStrikethrough: false };
			const result = convertMarkdownToPlainText("~~strike~~", settings);
			expect(result.trim()).toBe("strike");
		});

		it("skips blockquote conversion when enableBlockquote is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableBlockquote: false };
			const result = convertMarkdownToPlainText("> Quote", settings);
			expect(result.trim()).toBe("Quote");
		});

		it("skips horizontal rule conversion when enableHorizontalRule is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableHorizontalRule: false };
			const result = convertMarkdownToPlainText("---", settings);
			expect(result.trim()).toBe("");
		});

		it("skips code block conversion when enableCodeBlock is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableCodeBlock: false };
			const result = convertMarkdownToPlainText("```\ncode\n```", settings);
			expect(result.trim()).toBe("code");
		});

		it("skips inline code conversion when enableInlineCode is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableInlineCode: false };
			const result = convertMarkdownToPlainText("some `code` here", settings);
			expect(result).toContain("code");
			expect(result).not.toContain("`");
		});

		it("skips all conversion when enableMarkdownConversion is false", () => {
			const settings = { ...DEFAULT_SETTINGS, enableMarkdownConversion: false };
			const input = "# Title\n\n- **bold** item";
			const result = convertMarkdownToPlainText(input, settings);
			expect(result).toBe(input);
		});
	});

	describe("Edge cases", () => {
		it("handles empty input", () => {
			const result = convertMarkdownToPlainText("", DEFAULT_SETTINGS);
			expect(result).toBe("");
		});

		it("handles whitespace only input", () => {
			const result = convertMarkdownToPlainText("   \n\n   ", DEFAULT_SETTINGS);
			expect(result.trim()).toBe("");
		});

		it("handles heading level 5", () => {
			const result = convertMarkdownToPlainText(
				"##### Title",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("Title");
		});

		it("handles heading level 6", () => {
			const result = convertMarkdownToPlainText(
				"###### Title",
				DEFAULT_SETTINGS,
			);
			expect(result.trim()).toBe("Title");
		});
	});

	describe("Custom rules escape sequences", () => {
		it("replaces with newline using \\n", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "br",
						pattern: "<br>",
						replacement: "\\n",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("line1<br>line2", settings);
			expect(result).toContain("line1\nline2");
		});

		it("replaces with tab using \\t", () => {
			const settings = {
				...DEFAULT_SETTINGS,
				customRules: [
					{
						name: "tab",
						pattern: "TAB",
						replacement: "\\t",
						caseInsensitive: true,
						enabled: true,
					},
				],
			};
			const result = convertMarkdownToPlainText("aTABb", settings);
			expect(result).toContain("a\tb");
		});
	});

	describe("HTML passthrough", () => {
		it("passes through raw HTML", () => {
			const result = convertMarkdownToPlainText(
				"<div>content</div>",
				DEFAULT_SETTINGS,
			);
			expect(result).toContain("<div>content</div>");
		});
	});

	describe("Complex examples", () => {
		it("handles mixed content", () => {
			const input = `# Title

- [x] Task 1
- [ ] Task 2
- [/] Task 3

> Quote here

**Bold** and *italic*`;

			const result = convertMarkdownToPlainText(input, DEFAULT_SETTINGS);

			expect(result).toContain("▌ Title");
			expect(result).toContain("☑ Task 1");
			expect(result).toContain("☐ Task 2");
			expect(result).toContain("◐ Task 3");
			expect(result).toContain("│ Quote here");
			expect(result).toContain("𝐁𝐨𝐥𝐝");
			expect(result).toContain("𝑖𝑡𝑎𝑙𝑖𝑐");
		});
	});
});
