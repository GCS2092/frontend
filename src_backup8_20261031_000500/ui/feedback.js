import { toast } from 'sonner'
export { toast }

let host = null
export const registerConfirmHost = (fn) => { host = fn }

// const ok = await confirmDialog({ title, message, danger, confirmLabel })
export const confirmDialog = (opts = {}) =>
  new Promise((resolve) => {
    if (!host) return resolve(window.confirm(opts.title || 'Confirmer ?'))
    host({ ...opts, resolve })
  })