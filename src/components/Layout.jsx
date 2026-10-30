import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/admin', 'Tableau de bord', true],
  ['/admin/products', 'Produits'],
  ['/admin/stock', 'Mouvements'],
  ['/admin/transfers', 'Transferts'],
  ['/admin/purchase-orders', 'Bons de commande'],
  ['/admin/inventory', 'Inventaires'],
  ['/admin/invoices', 'Factures'],
  ['/admin/expenses', 'Dépenses'],
  ['/admin/suppliers', 'Fournisseurs'],
  ['/admin/users', 'Utilisateurs'],
  ['/admin/audit', 'Audit'],
]

export default function Layout() {
  const { user, stores, storeId, setStoreId, logout } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <div className="shell">
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="side-head">
          <h2>SGB</h2>
          <button className="menu-btn" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        </div>
        <div className="side-body">
          <label className="small">Boutique
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <nav>
            {links.map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>{label}</NavLink>
            ))}
          </nav>
          <div className="who small">{user.firstName} {user.lastName}<br />{user.role}</div>
          <button className="ghost" onClick={logout}>Déconnexion</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
