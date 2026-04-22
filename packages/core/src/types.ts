export interface ChunkConfig {
	maxTokens: number
	overlapTokens: number
}

export interface AppConfig {
	llmBaseUrl: string
	llmModel: string
	chunkConfig: ChunkConfig
	defaultSourceLocale?: string
	defaultTargetLocale?: string
}

export interface LocalizationResult {
	outputText: string
	chunks: number
	model: string
	changesCount?: number
}

export interface DiffArtifact {
	diffMarkdown: string
	summaryMarkdown: string
	summaryJson: string
	patchText: string
}

export interface DiffLine {
	type: 'added' | 'removed' | 'unchanged'
	content: string
}

export interface DocumentState {
	id: string
	name: string
	path: string
	status: DocumentStatus
	error?: string
	markdown?: string
	localizedText?: string
	progress?: {
		current: number
		total: number
		phase: 'parsing' | 'localizing'
	}
	// For targeted re-localization
	chunkErrorIndex?: number
}

export interface ClassifiedChange {
	type: 'spelling' | 'phrase' | 'regional' | 'style'
	original: string
	rewritten: string
	risky: boolean
	reason?: string
}

export interface BatchStatus {
	total: number
	processed: number
	failed: number
	documents: BatchDocStatus[]
}

export interface BatchDocStatus {
	name: string
	status: 'pending' | 'processing' | 'completed' | 'failed'
	error?: string
	localePair?: string
}

export interface ApprovalRecord {
	document: string
	approvedBy: string
	approvedAt: string
	targetLocale: string
	notes?: string
}

// Document processing types
export type DocumentStatus = 'idle' | 'parsing' | 'localizing' | 'review' | 'approved' | 'exported' | 'error'

export interface DocumentInput {
	id: string
	path: string
	name: string
}

export interface PdfPage {
	page_number: number
	text: string
}

export interface PdfParseResult {
	pages: PdfPage[]
	total_pages: number
	file_name: string
}

export interface ProcessCallbacks {
	onStatusChange: (status: DocumentStatus) => void
	onProgress: (current: number, total: number, phase: 'parsing' | 'localizing') => void
	onComplete: (markdown: string, localizedText: string) => void
	onError: (error: string) => void
}

export interface ProcessConfig {
	chunkSize: number
	overlapSize: number
	systemPrompt: string
}

export interface ProcessResult {
	markdown: string
	localizedText: string
	chunksCount: number
}

// File-based processing types
export type SourceFileType = 'pdf' | 'md' | 'unknown'

export interface ConversionResult {
	markdown: string
	sourceType: SourceFileType
	mdFilePath?: string // Path to saved .md file if converted from PDF
}

export interface FileProcessorCallbacks {
	onStatusChange: (status: DocumentStatus) => void
	onProgress: (current: number, total: number, phase: 'parsing' | 'localizing' | 'converting') => void
	onComplete: (result: ConversionResult, localizedText: string) => void
	onError: (error: string) => void
}

export interface FileProcessorConfig {
	chunkSize: number
	overlapSize: number
	systemPrompt: string
	saveMdFiles: boolean // Whether to save converted .md files to disk
}
