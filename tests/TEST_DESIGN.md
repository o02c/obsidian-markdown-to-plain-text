# Test Design Document

## Overview

This document describes the test coverage for `markdown-converter.ts`, which converts Markdown to plain text with Unicode formatting.

## Testing Principles

1. **Structural Variation Testing**: Same feature can produce different token trees depending on context
2. **Nesting Depth Testing**: Tokens can be nested in unexpected ways
3. **Boundary Condition Testing**: Blank lines, whitespace, empty content change parsing behavior
4. **Parser State Awareness**: Tight vs loose lists, inline vs block context

## Test Categories

### 1. Token Types Coverage

| Token Type | Tested | Test Cases |
|------------|--------|------------|
| `heading` | ✅ | h1-h4 prefixes |
| `paragraph` | ✅ | Implicit in most tests |
| `text` | ✅ | Implicit in most tests |
| `checkbox` | ✅ | Loose list checkbox handling |
| `strong` | ✅ | `**text**`, `__text__`, non-ASCII, disabled |
| `em` | ✅ | `*text*`, `_text_`, disabled |
| `del` | ✅ | `~~text~~`, disabled |
| `codespan` | ✅ | Inline code wrapping, no conversion inside |
| `code` | ✅ | Block prefix, no conversion inside |
| `blockquote` | ✅ | `>` prefix, no space variant |
| `list` | ✅ | Ordered, unordered, nested, mixed |
| `list_item` | ✅ | Bullets, checkboxes, indentation |
| `link` | ✅ | Text extraction |
| `image` | ✅ | Alt text extraction |
| `hr` | ✅ | `---`, `***` |
| `br` | ⚠️ | Implicit only |
| `space` | ⚠️ | Implicit only |
| `html` | ❌ | **NOT TESTED** |
| `escape` | ❌ | **NOT TESTED** |

### 2. Settings Coverage

| Setting | Tested | Notes |
|---------|--------|-------|
| `enableMarkdownConversion` | ❌ | **NOT TESTED** - master toggle |
| `enableHeadings` | ❌ | **NOT TESTED** - section toggle |
| `enableLists` | ❌ | **NOT TESTED** - section toggle |
| `enableTextDecoration` | ❌ | **NOT TESTED** - section toggle |
| `enableBlockElements` | ❌ | **NOT TESTED** - section toggle |
| `enableCode` | ❌ | **NOT TESTED** - section toggle |
| `heading1Prefix` | ✅ | Via DEFAULT_SETTINGS |
| `heading2Prefix` | ✅ | Via DEFAULT_SETTINGS |
| `heading3Prefix` | ✅ | Via DEFAULT_SETTINGS |
| `heading4Prefix` | ✅ | Via DEFAULT_SETTINGS |
| `bulletChar` | ✅ | Via DEFAULT_SETTINGS |
| `checkboxChecked` | ✅ | Via DEFAULT_SETTINGS |
| `checkboxUnchecked` | ✅ | Via DEFAULT_SETTINGS |
| `useBoldUnicode` | ✅ | true and false |
| `useItalicUnicode` | ✅ | true and false |
| `useStrikethrough` | ✅ | true and false |
| `horizontalRule` | ✅ | Via DEFAULT_SETTINGS |
| `blockquotePrefix` | ✅ | Via DEFAULT_SETTINGS |
| `codeBlockPrefix` | ✅ | Via DEFAULT_SETTINGS |
| `inlineCodeWrapper` | ✅ | Via DEFAULT_SETTINGS |
| `customRules` | ✅ | Multiple scenarios |

### 3. Custom Rules Coverage

| Scenario | Tested |
|----------|--------|
| Enabled rule | ✅ |
| Disabled rule | ✅ |
| Multiple rules in order | ✅ |
| Capture groups ($1, $2) | ✅ |
| Invalid regex pattern | ✅ |
| Case insensitive flag | ✅ |
| Case sensitive flag | ❌ |
| Escape sequences (\n, \t, \r, \\) | ❌ |
| Multiline patterns | ❌ |
| Empty pattern | ❌ |
| Empty replacement | ❌ |

### 4. Edge Cases

| Edge Case | Tested |
|-----------|--------|
| Empty input | ❌ |
| Whitespace only | ❌ |
| Very long input | ❌ |
| Deeply nested lists (>3 levels) | ❌ |
| Heading level 5-6 | ❌ |
| Mixed bold/italic `***text***` | ❌ |
| Bold inside italic `*__text__*` | ❌ |
| Nested blockquotes `>> text` | ❌ |
| Multi-line blockquotes | ❌ |
| Code block without language | ✅ |
| Code block with language | ✅ |
| Link with title | ❌ |
| Image without alt text | ❌ |
| Autolinks `<url>` | ❌ |
| Reference links `[text][ref]` | ❌ |
| Footnotes | ❌ |
| Tables | ❌ |
| Loose lists (blank lines) | ✅ |
| Tight lists (no blank lines) | ✅ |
| Unicode in content | ✅ |
| Special characters | ⚠️ |

### 5. List-Specific Coverage

| Scenario | Tested |
|----------|--------|
| Unordered with `-` | ✅ |
| Unordered with `*` | ✅ |
| Unordered with `+` | ❌ |
| Ordered starting at 1 | ✅ |
| Ordered starting at other number | ❌ |
| Nested unordered in ordered | ✅ |
| Nested ordered in unordered | ✅ |
| Checkbox `[x]` | ✅ |
| Checkbox `[X]` uppercase | ✅ |
| Checkbox `[ ]` | ✅ |
| Checkbox `[/]` (custom) | ✅ |
| Checkbox `[-]` (custom) | ✅ |
| List item with multiple paragraphs | ❌ |
| List item with code block | ❌ |

## Structural Variation Matrix

These are the **same features** tested under **different structural conditions**:

### List Structure Variations

| Variation | Tested | Risk Level |
|-----------|--------|------------|
| Tight list (no blank lines) | ✅ | - |
| Loose list (blank lines between items) | ✅ | HIGH - caused Bug #1 |
| Mixed tight/loose in same list | ✅ | HIGH |
| Checkbox in tight list | ✅ | - |
| Checkbox in loose list | ✅ | HIGH - Bug #1 |
| Nested list in loose parent | ✅ | HIGH |
| List inside blockquote | ✅ | MEDIUM |
| List inside list (4 levels) | ✅ | MEDIUM |
| Tab indentation in lists | ✅ | HIGH |

### Text Decoration in Context

| Context | Bold | Italic | Strike | Risk |
|---------|------|--------|--------|------|
| Paragraph | ✅ | ✅ | ✅ | - |
| Inside heading | ✅ | ✅ | - | MEDIUM |
| Inside list item | ✅ | - | - | MEDIUM |
| Inside blockquote | ✅ | ✅ | - | MEDIUM |
| Inside link text | ✅ | - | - | HIGH |
| Nested (bold in italic) | ❌ | ❌ | - | MEDIUM |

### Whitespace & Boundary Conditions

| Condition | Tested | Risk |
|-----------|--------|------|
| Empty input | ✅ | - |
| Whitespace only | ✅ | - |
| Leading blank lines | ❌ | LOW |
| Trailing blank lines | ❌ | LOW |
| Multiple consecutive blank lines | ❌ | MEDIUM |
| Tab indentation vs space | ✅ | HIGH |
| Mixed indentation | ❌ | HIGH |
| CRLF vs LF line endings | ❌ | MEDIUM |

### Custom Rules Edge Cases

| Scenario | Tested | Risk |
|----------|--------|------|
| Rule matches converted unicode | ✅ | HIGH |
| Rule matches across line breaks | ❌ | MEDIUM |
| Rule with empty replacement | ✅ | LOW |
| Rule with empty pattern | ❌ | LOW |
| Many rules (performance) | ❌ | LOW |
| Rule order dependency | ✅ | - |
| Case sensitive matching | ✅ | MEDIUM |

## Remaining Test Gaps

### High Priority
- Mixed indentation (tabs + spaces in same list)
- CRLF line endings

### Medium Priority
- Nested formatting (bold inside italic)
- Reference links

### Low Priority
- Tables (if supported by marked)

## Test Execution

```bash
# Run all tests
pnpm test:run

# Run with coverage
pnpm test:run --coverage

# Run specific test file
pnpm test:run src/markdown-converter.test.ts
```

## Coverage Goals

- **Line coverage**: >90%
- **Branch coverage**: >85%
- **Function coverage**: 100%

## Notes

1. Custom checkbox patterns `[/]` and `[-]` rely on custom rules in DEFAULT_SETTINGS, not native marked support.

2. Loose lists (with blank lines) produce different token structures than tight lists - both are tested.
