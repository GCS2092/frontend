import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  HelpCircle, LayoutDashboard, Package, Tags, ArrowLeftRight, Truck, ClipboardList, ClipboardCheck, ShoppingCart, ShoppingBag,
  FileText, FileMinus, Wallet, Users, BarChart3, Store, Settings, ShieldCheck, Boxes, Menu, X, LogOut, Building2, Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'
import PageGuide from '../ui/PageGuide'
import CommandPalette from '../ui/CommandPalette'
import { tv } from '../ui/fr'
import GlobalUI from '../ui/GlobalUI'

const groups = [
  [null, [['/admin', 'Tableau de bord', LayoutDashboard, true]]],
  ['Ventes', [
    ['/admin/sales', 'Vente comptoir', ShoppingCart],
    ['/admin/orders', 'Commandes', ShoppingBag],
    ['/admin/invoices', 'Factures', FileText],
    ['/admin/credit-notes', 'Avoirs', FileMinus],
  ]],
  ['Stock', [
    ['/admin/products', 'Produits', Package],
    ['/admin/categories', 'Catégories', Tags],
    ['/admin/stock', 'Mouvements', ArrowLeftRight],
    ['/admin/transfers', 'Transferts', Truck],
    ['/admin/inventory', 'Inventaires', ClipboardCheck],
  ]],
  ['Achats', [
    ['/admin/purchase-orders', 'Bons de commande', ClipboardList],
    ['/admin/suppliers', 'Fournisseurs', Building2],
  ]],
  ['Finance', [
    ['/admin/expenses', 'Dépenses', Wallet],
    ['/admin/reports', 'Rapports', BarChart3],
  ]],
  ['Aide', [['/admin/help', 'Guide d’utilisation', HelpCircle]]],
  ['Administration', [
    ['/admin/users', 'Utilisateurs', Users],
    ['/admin/stores', 'Boutiques', Store],
    ['/admin/settings', 'Paramètres', Settings],
    ['/admin/audit', 'Audit', ShieldCheck],
  ]],
]

export default function Layout() {
  const { user, stores, storeId, setStoreId, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const initials = `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`
  return (
    <div className="shell">
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="brand">
          <span className="brand-logo"><Boxes size={17} /></span>
          <div>SGB<small>Gestion de stock</small></div>
        </div>
        <nav>
          {groups.map(([title, items]) => (
            <div key={title || 'main'} style={{ display: 'contents' }}>
              {title && <div className="nav-title">{title}</div>}
              {items.map(([to, label, Icon, end]) => (
                <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
                  <Icon size={16} strokeWidth={1.75} />{label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <button className="ghost menu-btn" aria-label="Menu" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="store-pick">
            <Store size={16} />
            <select aria-label="Boutique" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="button" className="ghost search-trigger" aria-label="Recherche rapide" onClick={() => setPalette(true)}>
            <Search size={15} /><span className="search-text">Aller à…</span><kbd>Ctrl K</kbd>
          </button>
          <div className="spacer" />
          <PageGuide />
          <ThemeToggle />
          <div className="user-chip">
            <div className="avatar">{initials || '?'}</div>
            <div className="user-text">
              <div className="user-name">{user.firstName} {user.lastName}</div>
              <div className="user-role">{tv(user.role)}</div>
            </div>
          </div>
          <button className="ghost" title="Déconnexion" aria-label="Déconnexion" onClick={logout} style={{ padding: '7px 9px' }}>
            <LogOut size={16} />
          </button>
        </header>
        <main className="main"><Outlet /></main>
        <GlobalUI />
      </div>
      <CommandPalette open={palette} setOpen={setPalette} groups={groups} />
    </div>
  )
}