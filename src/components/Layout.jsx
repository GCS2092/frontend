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
  return (
    <div className="shell">
      <aside className="side">
        <h2>SGB</h2>
        <label className="small">Boutique
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <nav>
          {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}
        </nav>
        <div className="who small">{user.firstName} {user.lastName}<br />{user.role}</div>
        <button className="ghost" onClick={logout}>Déconnexion</button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}