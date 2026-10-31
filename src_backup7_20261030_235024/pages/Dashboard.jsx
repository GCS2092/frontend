import { Boxes, Tag, Percent, TrendingUp, Wallet, PiggyBank, Activity, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading } from '../components/ui'
import { BarCard, DonutCard } from '../ui/charts'

const LABELS = {
  stockValue: 'Valeur du stock (achat)', stockRetailValue: 'Valeur du stock (vente)',
  stockMargin: 'Marge potentielle (%)', revenue: 'Chiffre d’affaires', totalExpenses: 'Dépenses', netProfit: 'Résultat net',
}
const ICONS = {
  stockValue: Boxes, stockRetailValue: Tag, stockMargin: Percent,
  revenue: TrendingUp, totalExpenses: Wallet, netProfit: PiggyBank,
}
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0)

export default function Dashboard() {
  const { storeId } = useAuth()
  const { data, error, loading } = useApi('/admin/accounting/dashboard', { storeId })
  const d = data || {}
  const cards = Object.entries(d).filter(([, v]) => typeof v === 'number' || (typeof v === 'string' && v.length < 24 && v !== ''))
  const low = Array.isArray(d.lowStockProducts) ? d.lowStockProducts : []

  const revenue = num(d.revenue), expenses = num(d.totalExpenses), profit = num(d.netProfit)
  const stockCost = num(d.stockValue), stockRetail = num(d.stockRetailValue)

  const resultData = [
    { name: 'Dépenses', value: expenses, color: '#dc2626' },
    { name: 'Résultat net', value: Math.max(profit, 0), color: '#16a34a' },
  ]
  const stockData = [
    { name: 'Valeur d’achat', value: stockCost, color: '#2563eb' },
    { name: 'Marge potentielle', value: Math.max(stockRetail - stockCost, 0), color: '#7c3aed' },
  ]
  const lowBars = low.slice(0, 8).map((p) => ({ name: p.name, dispo: num(p.availableStock), seuil: num(p.lowStockAlert) }))

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

      {!loading && data && (
        <div className="charts-grid">
          <DonutCard title="Chiffre d’affaires" subtitle="Dépenses et résultat net"
            data={resultData} format={fmt} centerLabel="CA" centerValue={fmt(revenue)} />
          <DonutCard title="Valeur du stock" subtitle="Coût d’achat et marge potentielle"
            data={stockData} format={fmt} centerLabel="Vente" centerValue={fmt(stockRetail)} />
          <BarCard title="Stock bas" subtitle="Disponible vs seuil d’alerte" data={lowBars}
            series={[{ key: 'dispo', name: 'Disponible', color: '#dc2626' }, { key: 'seuil', name: 'Seuil', color: '#9ca3af' }]} />
        </div>
      )}

      <h2 className="row"><AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Produits en stock bas</h2>
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