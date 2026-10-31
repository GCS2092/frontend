import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading } from '../components/ui'

const LABELS = {
  stockValue: 'Valeur du stock (achat)', stockRetailValue: 'Valeur du stock (vente)',
  stockMargin: 'Marge potentielle (%)', revenue: 'Chiffre d’affaires', totalExpenses: 'Dépenses', netProfit: 'Résultat net',
}

export default function Dashboard() {
  const { storeId } = useAuth()
  const { data, error, loading } = useApi('/admin/accounting/dashboard', { storeId })
  const d = data || {}
  const cards = Object.entries(d).filter(([, v]) => typeof v === 'number' || (typeof v === 'string' && v.length < 24 && v !== ''))
  const low = Array.isArray(d.lowStockProducts) ? d.lowStockProducts : []
  return (
    <div>
      <h1>Tableau de bord</h1>
      <Msg text={error} /><Loading on={loading} />
      <div className="grid">
        {cards.map(([k, v]) => (
          <div className="card" key={k}>
            <div className="muted small">{LABELS[k] || k}</div>
            <div className="big">{typeof v === 'number' && /value|revenue|expense|profit|cost/i.test(k) ? fmt(v) : v}</div>
          </div>
        ))}
      </div>
      <h2>Stock bas</h2>
      {low.length === 0 ? <p className="muted">Rien à signaler.</p> : (
        <table><thead><tr><th>Produit</th><th>Disponible</th><th>Seuil</th></tr></thead>
          <tbody>{low.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.availableStock}</td><td>{p.lowStockAlert}</td></tr>)}</tbody></table>
      )}
    </div>
  )
}