import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Toaster } from 'sonner'
import { CornerDownLeft, LogOut, Search } from 'lucide-react'
import Modal from './Modal'
import { registerConfirmHost } from './feedback'
import { useAuth } from '../context/AuthContext'

const PAGES = [
  ['/admin', 'Tableau de bord'], ['/admin/help', 'Aide et guide d’utilisation'], ['/admin/sales', 'Vente comptoir'], ['/admin/orders', 'Commandes'],
  ['/admin/invoices', 'Factures'], ['/admin/credit-notes', 'Avoirs'], ['/admin/products', 'Produits'], ['/admin/categories', 'Catégories'],
  ['/admin/stock', 'Mouvements de stock'], ['/admin/transfers', 'Transferts'], ['/admin/inventory', 'Inventaires'],
  ['/admin/purchase-orders', 'Bons de commande'], ['/admin/suppliers', 'Fournisseurs'], ['/admin/expenses', 'Dépenses'],
  ['/admin/reports', 'Rapports'], ['/admin/users', 'Utilisateurs'], ['/admin/stores', 'Boutiques'],
  ['/admin/settings', 'Paramètres'], ['/admin/audit', 'Audit'],
]

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

function Palette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const go = (to) => { setOpen(false); navigate(to) }
  const item = 'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-text data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary'
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Recherche rapide"
      overlayClassName="fixed inset-0 z-40 bg-black/40 animate-[fade-in_.12s_ease-out]"
      contentClassName="fixed left-1/2 top-[16%] z-50 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search size={16} className="text-muted" />
        <Command.Input placeholder="Aller à une page…"
          style={{ border: 0, boxShadow: 'none', borderRadius: 0, background: 'transparent', flex: 1, padding: '14px 4px' }} />
        <kbd className="rounded border border-border px-1.5 text-xs text-muted">Échap</kbd>
      </div>
      <Command.List className="max-h-80 overflow-auto p-2">
        <Command.Empty className="p-4 text-center text-sm text-muted">Aucun résultat.</Command.Empty>
        <Command.Group heading="Pages"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted">
          {PAGES.map(([to, label]) => (
            <Command.Item key={to} value={label} onSelect={() => go(to)} className={item}>
              {label}<CornerDownLeft size={14} className="text-muted" />
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Compte"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted">
          <Command.Item value="Déconnexion" onSelect={() => { setOpen(false); logout() }} className={item}>
            Déconnexion<LogOut size={14} className="text-muted" />
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

export default function GlobalUI() {
  const theme = useTheme()
  return (
    <>
      <Toaster position="top-right" theme={theme} richColors closeButton />
      <ConfirmHost />
      <Palette />
    </>
  )
}