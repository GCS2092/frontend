import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Package, ArrowLeftRight, Truck, ClipboardList, ShoppingCart, ShoppingBag,
  FileText, FileMinus, Wallet, Users, UserCog, BarChart3, Store, Settings, ShieldCheck,
  Boxes, Menu, X, LogOut, ClipboardCheck, Receipt,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'

const links = [
  ['/admin', 'Tableau de bord', LayoutDashboard, true],
  ['/admin/products', 'Produits', Package],
  ['/admin/stock', 'Mouvements', ArrowLeftRight],
  ['/admin/transfers', 'Transferts', Truck],
  ['/admin/purchase-orders', 'Bons de commande', ClipboardList],
  ['/admin/inventory', 'Inventaires', ClipboardCheck],
  ['/admin/sales', 'Vente comptoir', ShoppingCart],
  ['/admin/orders', 'Commandes', ShoppingBag],
  ['/admin/invoices', 'Factures', FileText],
  ['/admin/credit-notes', 'Avoirs', FileMinus],
  ['/admin/expenses', 'Dépenses', Wallet],
  ['/admin/suppliers', 'Fournisseurs', Receipt],
  ['/admin/users', 'Utilisateurs', Users],
  ['/admin/reports', 'Rapports', BarChart3],
  ['/admin/stores', 'Boutiques', Store],
  ['/admin/settings', 'Paramètres', Settings],
  ['/admin/audit', 'Audit', ShieldCheck],
]

export default function Layout() {
  const { user, stores, storeId, setStoreId, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  return (
    <div className="shell">
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="side-head">
          <div className="brand"><span className="brand-logo"><Boxes size={18} /></span>SGB</div>
          <div className="side-tools">
            <ThemeToggle />
            <button className="menu-btn" aria-label="Menu" onClick={() => setOpen(!open)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <div className="side-body">
          <label>Boutique
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <nav>
            {links.map(([to, label, Icon, end]) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="who">
            <div className="avatar">{(user.firstName || '?')[0]}</div>
            <div>
              <div className="who-name">{user.firstName} {user.lastName}</div>
              <div className="who-role">{user.role}</div>
            </div>
          </div>
          <button className="ghost" onClick={logout}><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>
      <main className="main">
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}