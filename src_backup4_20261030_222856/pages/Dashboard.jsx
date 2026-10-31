import { Boxes, Tag, Percent, TrendingUp, Wallet, PiggyBank, Activity, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading } from '../components/ui'

const LABELS = {
  stockValue: 'Valeur du stock (achat)', stockRetailValue: 'Valeur du stock (vente)',
  stockMargin: 'Marge potentielle (%)', revenue: 'Chiffre d’affaires', totalExpenses: 'Dépenses', netProfit: 'Résultat net',
}
const ICONS = {
  stockValue: Boxes, stockRetailValue: Tag, stockMargin: Percent,
  revenue: TrendingUp, totalExpenses: Wallet, netProfit: PiggyBank,
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
        {cards.map(([k, v]) => {
          const Icon = ICONS[k] || Activity
          const money = typeof v === 'number' && /value|revenue|expense|profit|cost/i.test(k)
          const tone = k === 'netProfit' && typeof v === 'number' ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''
          return (
            <div className="card" key={k}>
              <div className="kpi-top"><span>{LABELS[k] || k}</span><Icon size={16} strokeWidth={1.75} /></div>
              <div className={`kpi-value ${tone}`}>{money ? fmt(v) : v}</div>
            </div>
          )
        })}
      </div>
      <h2 className="row"><AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Stock bas</h2>
      {low.length === 0 ? <div className="empty">Rien à signaler.</div> : (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Produit</th><th>Disponible</th><th>Seuil</th></tr></thead>
            <tbody>{low.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className="badge danger">{p.availableStock}</span></td>
                <td>{p.lowStockAlert}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}