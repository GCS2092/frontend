import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import Modal from './Modal'
import { registerConfirmHost } from './feedback'

function useTheme() {
  const read = () => document.documentElement.dataset.theme || 'light'
  const [theme, setTheme] = useState(read)
  useEffect(() => {
    const o = new MutationObserver(() => setTheme(read()))
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => o.disconnect()
  }, [])
  return theme
}

function ConfirmHost() {
  const [s, setS] = useState(null)
  useEffect(() => { registerConfirmHost(setS); return () => registerConfirmHost(null) }, [])
  const close = (v) => { s?.resolve(v); setS(null) }
  return (
    <Modal open={!!s} size="sm" title={s?.title || ''} description={s?.message}
      onOpenChange={(o) => { if (!o) close(false) }}
      footer={<>
        <button className="ghost" onClick={() => close(false)}>Annuler</button>
        <button className={s?.danger ? 'danger' : ''} onClick={() => close(true)}>{s?.confirmLabel || 'Confirmer'}</button>
      </>} />
  )
}

export default function GlobalUI() {
  const theme = useTheme()
  return (
    <>
      <Toaster position="top-right" theme={theme} richColors closeButton />
      <ConfirmHost />
    </>
  )
}