import { Boxes, Tag, Percent, TrendingUp, Wallet, PiggyBank, Activity, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading } from '../components/ui'
import { DonutCard, HBarCard } from '../ui/charts'
import Onboarding from '../ui/Onboarding'

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
  const pct = (v) => (revenue > 0 ? Math.min(100, Math.max(0, (v / revenue) * 100)) : 0)

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
      <div className="page-head"><h1>Tableau de bord</h1></div>
      <Msg text={error} /><Loading on={loading} />
      <Onboarding />

      <div className="grid">
        {cards.map(([k, v]) => {
          const Icon = ICONS[k] || Activity
          const money = typeof v === 'number' && /value|revenue|expense|profit|cost/i.test(k)
          const tone = k === 'netProfit' && typeof v === 'number' ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''
          return (
            <div className="card kpi" key={k}>
              <div className="kpi-top"><span>{LABELS[k] || k}</span><Icon size={16} strokeWidth={1.75} /></div>
              <div className={`kpi-value ${tone}`}>{money ? fmt(v) : v}</div>
            </div>
          )
        })}
      </div>

      {!loading && data && revenue > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="chart-head"><div className="chart-title">Du chiffre d’affaires au résultat</div>
            <div className="small muted">Part des dépenses et du résultat net par rapport au CA</div></div>
          <div className="split-bar" role="img" aria-label="Répartition du chiffre d’affaires">
            <span style={{ width: `${pct(expenses)}%`, background: '#dc2626' }} />
            <span style={{ width: `${pct(Math.max(profit, 0))}%`, background: '#16a34a' }} />
          </div>
          <ul className="legend inline">
            <li><span className="dot" style={{ background: '#dc2626' }} />Dépenses · {fmt(expenses)} ({Math.round(pct(expenses))}%)</li>
            <li><span className="dot" style={{ background: '#16a34a' }} />Résultat net · {fmt(profit)} ({Math.round(pct(Math.max(profit, 0)))}%)</li>
          </ul>
        </div>
      )}

      {!loading && data && (
        <div className="charts-grid">
          <DonutCard title="Chiffre d’affaires" subtitle="Dépenses et résultat net"
            data={resultData} format={fmt} centerLabel="CA" centerValue={fmt(revenue)} />
          <DonutCard title="Valeur du stock" subtitle="Coût d’achat et marge potentielle"
            data={stockData} format={fmt} centerLabel="Vente" centerValue={fmt(stockRetail)} />
          <HBarCard title="Stock bas" subtitle="Disponible vs seuil d’alerte" data={lowBars}
            series={[{ key: 'dispo', name: 'Disponible', color: '#dc2626' }, { key: 'seuil', name: 'Seuil', color: '#9ca3af' }]} />
        </div>
      )}

      <h2 className="row"><AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Produits en stock bas</h2>
      {low.length === 0 ? <div className="empty">Rien à signaler.</div> : (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Produit</th><th className="r">Disponible</th><th className="r">Seuil</th></tr></thead>
            <tbody>{low.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="r"><span className="badge danger">{p.availableStock}</span></td>
                <td className="r">{p.lowStockAlert}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}