import type { DocumentState } from '@doclocalizer/core'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@doclocalizer/ui'
import { CheckCircle2, Clock, FileText, Loader2, Pause, XCircle } from 'lucide-react'

type ExtendedStatus = DocumentState['status'] | 'rejected'

interface LocaleSelectProps {
	value: string
	onChange: (value: string | null) => void
	locales?: { code: string; name: string }[]
	disabled?: boolean
}

export function LocaleSelect({ value, onChange, locales, disabled }: LocaleSelectProps) {
	return (
		<Select value={value} onValueChange={onChange} disabled={disabled}>
			<SelectTrigger className="h-7 w-28">
				<SelectValue placeholder="Select..." />
			</SelectTrigger>
			<SelectContent>
				{locales?.map((l) => (
					<SelectItem key={l.code} value={l.code}>
						{l.code}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export function StatusIcon({ status }: { status: ExtendedStatus }) {
	switch (status) {
		case 'idle':
			return <Clock className="w-5 h-5 text-muted-foreground" />
		case 'parsing':
		case 'localizing':
			return <Loader2 className="w-5 h-5 text-primary animate-spin" />
		case 'paused':
			return <Pause className="w-5 h-5 text-orange-500" />
		case 'review':
			return <FileText className="w-5 h-5 text-yellow-500" />
		case 'approved':
		case 'exported':
			return <CheckCircle2 className="w-5 h-5 text-green-500" />
		case 'rejected':
			return <XCircle className="w-5 h-5 text-red-500" />
		case 'error':
			return <XCircle className="w-5 h-5 text-red-500" />
	}
}

export const STATUS_LABELS: Record<ExtendedStatus, string> = {
	idle: 'Ready to process',
	parsing: 'Extracting text...',
	localizing: 'Localizing...',
	paused: 'Paused',
	review: 'Needs review',
	approved: 'Ready to export',
	rejected: 'Rejected',
	exported: 'Exported',
	error: 'Error',
}

export const STATUS_COLORS: Record<ExtendedStatus, string> = {
	idle: 'text-muted-foreground',
	parsing: 'text-muted-foreground',
	localizing: 'text-muted-foreground',
	paused: 'text-orange-500',
	review: 'text-yellow-500',
	approved: 'text-green-500',
	rejected: 'text-red-500',
	exported: 'text-green-500',
	error: 'text-red-500',
}

export const ALL_STATUSES: ExtendedStatus[] = [
	'idle',
	'parsing',
	'localizing',
	'paused',
	'review',
	'approved',
	'rejected',
	'exported',
	'error',
]
