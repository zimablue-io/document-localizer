import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import { cn } from '../../lib/utils'

const AlertDialogRoot = Dialog.Root

const AlertDialogTrigger = Dialog.Trigger

const AlertDialogContent = ({ className, children, ...props }: Dialog.Popup.Props) => (
	<>
		<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80" />
		<Dialog.Popup
			data-slot="alert-dialog-content"
			className={cn(
				'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
				className
			)}
			{...props}
		>
			{children}
		</Dialog.Popup>
	</>
)
AlertDialogContent.displayName = 'AlertDialogContent'

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		data-slot="alert-dialog-header"
		className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
		{...props}
	/>
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		data-slot="alert-dialog-footer"
		className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
		{...props}
	/>
)
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = Dialog.Title
const AlertDialogDescription = Dialog.Description
const AlertDialogClose = Dialog.Close

const AlertDialogAction = Dialog.Close
const AlertDialogCancel = Dialog.Close

export {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogRoot as AlertDialog,
	AlertDialogTitle,
	AlertDialogTrigger,
}
