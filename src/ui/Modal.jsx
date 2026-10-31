import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export default function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }) {
  const w = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-[fade-in_.15s_ease-out]" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] ${w} -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 text-text shadow-xl animate-[fade-in_.15s_ease-out] focus:outline-none`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button className="ghost" aria-label="Fermer" style={{ padding: '5px 7px' }}><X size={16} /></button>
            </Dialog.Close>
          </div>
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}