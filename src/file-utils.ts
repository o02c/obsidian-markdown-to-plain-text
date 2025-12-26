/**
 * File I/O utilities for saving content via Electron dialogs.
 */

import { Notice } from "obsidian";

const { remote } = require("electron");
// biome-ignore lint/style/useNodejsImportProtocol: Obsidian plugin bundler doesn't support node: protocol
const fs = require("fs");

// =============================================================================
// Types
// =============================================================================

export interface SaveDialogOptions {
	title: string;
	defaultPath: string;
	filters: Array<{ name: string; extensions: string[] }>;
}

interface SaveDialogResult {
	canceled: boolean;
	filePath?: string;
}

type FileFilter = { name: string; extensions: string[] };

// =============================================================================
// Constants
// =============================================================================

/** Common file filters for save dialogs */
export const FILE_FILTERS: Record<string, FileFilter[]> = {
	markdown: [
		{ name: "Markdown", extensions: ["md"] },
		{ name: "Text", extensions: ["txt"] },
		{ name: "All Files", extensions: ["*"] },
	],
	text: [
		{ name: "Text", extensions: ["txt"] },
		{ name: "All Files", extensions: ["*"] },
	],
};

// =============================================================================
// File Operations
// =============================================================================

/** Show a save dialog and write content to the selected file */
export async function saveToFile(
	content: string,
	options: SaveDialogOptions,
): Promise<boolean> {
	const result: SaveDialogResult = await remote.dialog.showSaveDialog(options);

	if (result.canceled || !result.filePath) {
		return false;
	}

	return new Promise((resolve) => {
		fs.writeFile(
			result.filePath,
			content,
			(err: NodeJS.ErrnoException | null) => {
				if (err) {
					new Notice(`Error: ${err.message}`);
					resolve(false);
				} else {
					new Notice(`Saved: ${result.filePath}`);
					resolve(true);
				}
			},
		);
	});
}

// =============================================================================
// Filename Generation
// =============================================================================

/** Generate a default filename based on content's first line or timestamp */
export function generateDefaultFileName(
	content: string,
	ext: string = "md",
): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const firstLine = content.split("\n")[0].trim();
	const sanitized = firstLine.replace(/[<>:"/\\|?*#]/g, "").slice(0, 30);

	if (sanitized.length > 0) {
		return `${sanitized}.${ext}`;
	}
	return `export_${timestamp}.${ext}`;
}
