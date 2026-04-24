import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="sheet-overlay"
			className={cn(
				'fixed inset-0 z-50 bg-black/80 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
				className
			)}
			{...props}
		/>
	)
}

function SheetContent({
	className,
	children,
	showCloseButton = true,
	position = 'right',
	...props
}: DialogPrimitive.Popup.Props & {
	showCloseButton?: boolean
	position?: 'left' | 'right' | 'top' | 'bottom'
}) {
	const positionClasses = {
		right: 'top-0 right-0 h-full w-3/4 max-w-sm border-l data-enter:translate-x-full data-enter:animate-in data-enter:fade-in-0 data-enter:slide-in-from-right data-leave:translate-x-full data-leave:animate-out data-leave:fade-out-0 data-leave:slide-out-to-right',
		left: 'top-0 left-0 h-full w-3/4 max-w-sm border-r data-enter:-translate-x-full data-enter:animate-in data-enter:fade-in-0 data-enter:slide-in-from-left data-leave:-translate-x-full data-leave:animate-out data-leave:fade-out-0 data-leave:slide-out-to-left',
		top: 'top-0 left-0 w-full h-1/2 border-b data-enter:-translate-y-full data-enter:animate-in data-enter:fade-in-0 data-enter:slide-in-from-top data-leave:-translate-y-full data-leave:animate-out data-leave:fade-out-0 data-leave:slide-out-to-top',
		bottom: 'bottom-0 left-0 w-full h-1/2 border-t data-enter:translate-y-full data-enter:animate-in data-enter:fade-in-0 data-enter:slide-in-from-bottom data-leave:translate-y-full data-leave:animate-out data-leave:fade-out-0 data-leave:slide-out-to-bottom',
	}

	return (
		<SheetPortal>
			<SheetOverlay />
			<DialogPrimitive.Popup
				data-slot="sheet-content"
				className={cn(
					'fixed z-50 flex flex-col gap-4 rounded-none bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none duration-200 overflow-hidden',
					positionClasses[position],
					className
				)}
				{...props}
			>
				{showCloseButton && (
					<div className="flex justify-end">
						<DialogPrimitive.Close
							data-slot="sheet-close"
							render={<Button variant="ghost" size="icon-sm" />}
						>
							<XIcon />
							<span className="sr-only">Close</span>
						</DialogPrimitive.Close>
					</div>
				)}
				{children}
			</DialogPrimitive.Popup>
		</SheetPortal>
	)
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="sheet-header" className={cn('flex flex-col gap-2', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sheet-footer"
			className={cn('-mx-4 -mb-4 mt-auto flex flex-col-reverse gap-2 border-t bg-muted/50 p-4', className)}
			{...props}
		/>
	)
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="sheet-title"
			className={cn('text-base leading-none font-medium', className)}
			{...props}
		/>
	)
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="sheet-description"
			className={cn('text-sm text-muted-foreground', className)}
			{...props}
		/>
	)
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
