/**
 * File system utilities for reading and processing documents.
 */

/**
 * Reads a PDF file and returns its bytes.
 */
export async function readPdfFile(filePath: string): Promise<Uint8Array> {
	const base64 = await window.electron.readFile(filePath)
	const binaryString = atob(base64)
	const bytes = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	return bytes
}

/**
 * Reads a text file and returns its contents.
 */
export async function readTextFile(filePath: string): Promise<string> {
	const base64 = await window.electron.readFile(filePath)
	const binaryString = atob(base64)
	return binaryString
}

/**
 * Checks if a file path points to a PDF file.
 */
export function isPdfPath(path: string): boolean {
	return /\.pdf$/i.test(path)
}

/**
 * Gets the filename from a full path.
 */
export function getFileName(path: string): string {
	return path.split('/').pop() || path
}

/**
 * Generates an output path for a localized document.
 */
export function getOutputPath(sourcePath: string, targetLocale: string): string {
	return sourcePath.replace(/\.(pdf|md)$/i, `.${targetLocale}.localized.md`)
}

/**
 * Generates an output filename for a localized document.
 */
export function getOutputFileName(sourceName: string, targetLocale: string): string {
	return sourceName.replace(/\.(pdf|md)$/i, `.${targetLocale}.localized.md`)
}
