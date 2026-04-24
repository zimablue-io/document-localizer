import { jsPDF } from 'jspdf'

export type ExportFormat = 'md' | 'pdf'

export interface ExportOptions {
	format: ExportFormat
	content: string
	defaultFilename: string
}

export function getFileExtension(format: ExportFormat): string {
	return format === 'pdf' ? '.pdf' : '.md'
}

export function getMimeType(format: ExportFormat): string {
	return format === 'pdf' ? 'application/pdf' : 'text/markdown'
}

export function getFilterForFormat(format: ExportFormat): { name: string; extensions: string[] } {
	if (format === 'pdf') {
		return { name: 'PDF', extensions: ['pdf'] }
	}
	return { name: 'Markdown', extensions: ['md'] }
}

export function markdownToPlainText(markdown: string): string {
	// Remove common markdown formatting
	return markdown
		.replace(/#{1,6}\s+/g, '') // Headers
		.replace(/\*\*(.+?)\*\*/g, '$1') // Bold
		.replace(/\*(.+?)\*/g, '$1') // Italic
		.replace(/__(.+?)__/g, '$1') // Bold (alt)
		.replace(/_(.+?)_/g, '$1') // Italic (alt)
		.replace(/`(.+?)`/g, '$1') // Inline code
		.replace(/```[\s\S]*?```/g, '') // Code blocks
		.replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
		.replace(/!\[.*?\]\(.+?\)/g, '') // Images
		.replace(/^\s*[-*+]\s+/gm, '') // List bullets
		.replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
		.replace(/^\s*>\s+/gm, '') // Blockquotes
		.replace(/\n{3,}/g, '\n\n') // Multiple newlines
		.trim()
}

export function contentToPdf(content: string, filename: string): Blob {
	const doc = new jsPDF()
	const pageWidth = doc.getPageWidth()
	const pageHeight = doc.getPageHeight()
	const margin = 20
	const maxWidth = pageWidth - margin * 2
	const lineHeight = 7

	// Add title
	doc.setFontSize(16)
	doc.setFont('helvetica', 'bold')
	const title = filename.replace(/\.(md|txt)$/i, '')
	doc.text(title, margin, margin + 10)

	// Add timestamp
	doc.setFontSize(10)
	doc.setFont('helvetica', 'normal')
	doc.setTextColor(128)
	doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + 18)
	doc.setTextColor(0)

	// Add separator line
	doc.setDrawColor(200)
	doc.line(margin, margin + 24, pageWidth - margin, margin + 24)

	// Add content
	doc.setFontSize(11)
	const plainText = markdownToPlainText(content)
	const lines = doc.splitTextToSize(plainText, maxWidth)

	let yPosition = margin + 35
	let pageNumber = 1

	for (const line of lines) {
		if (yPosition + lineHeight > pageHeight - margin) {
			// Add page number before new page
			doc.setFontSize(9)
			doc.setTextColor(128)
			doc.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 10)
			doc.setTextColor(0)
			doc.setFontSize(11)

			doc.addPage()
			yPosition = margin
			pageNumber++
		}
		doc.text(line, margin, yPosition)
		yPosition += lineHeight
	}

	// Add final page number
	doc.setFontSize(9)
	doc.setTextColor(128)
	doc.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 10)

	return doc.output('blob')
}
