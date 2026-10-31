import { Link } from 'react-router-dom'
import { Boxes, Tag, Percent, TrendingUp, Wallet, PiggyBank, Activity, AlertTriangle, ShoppingCart, Plus, ArrowRight } from 'lucide-react'
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
const TONES = {
  stockValue: 'teal', stockRetailValue: 'indigo', stockMargin: 'cyan',
  revenue: 'green', totalExpenses: 'amber', netProfit: 'rose',
}
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0)

export default function Dashboard() {
  const { storeId, user, stores } = useAuth()
  const { data, error, loading } = useApi('/admin/accounting/dashboard', { storeId })
  const d = data || {}
  const cards = Object.entries(d).filter(([, v]) => typeof v === 'number' || (typeof v === 'string' && v.length < 24 && v !== ''))
  const low = Array.isArray(d.lowStockProducts) ? d.lowStockProducts : []

  const revenue = num(d.revenue), expenses = num(d.totalExpenses), profit = num(d.netProfit)
  const stockCost = num(d.stockValue), stockRetail = num(d.stockRetailValue)
  const pct = (v) => (revenue > 0 ? Math.min(100, Math.max(0, (v / revenue) * 100)) : 0)

  const hello = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
  const store = (stores || []).find((s) => String(s.id) === String(storeId))

  const resultData = [
    { name: 'Dépenses', value: expenses, color: '#d97706' },
    { name: 'Résultat net', value: Math.max(profit, 0), color: '#0f766e' },
  ]
  const stockData = [
    { name: 'Valeur d’achat', value: stockCost, color: '#0f766e' },
    { name: 'Marge potentielle', value: Math.max(stockRetail - stockCost, 0), color: '#6366f1' },
  ]
  const lowBars = low.slice(0, 8).map((p) => ({ name: p.name, dispo: num(p.availableStock), seuil: num(p.lowStockAlert) }))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{hello}{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="page-sub">Voici l’état de {store ? `« ${store.name} »` : 'votre activité'}.</p>
        </div>
        <div className="row">
          <Link to="/admin/products" className="btn-link ghost"><Plus size={16} /> Nouveau produit</Link>
          <Link to="/admin/sales" className="btn-link"><ShoppingCart size={16} /> Nouvelle vente</Link>
        </div>
      </div>
      <Msg text={error} /><Loading on={loading} />

      {!loading && low.length > 0 && (
        <div className="banner" role="status">
          <AlertTriangle size={18} />
          <div>
            <strong>{low.length} produit{low.length > 1 ? 's' : ''} sous le seuil d’alerte.</strong>{' '}
            <span className="muted">Pensez à réapprovisionner.</span>
          </div>
          <Link to="/admin/purchase-orders" className="btn-link ghost sm">Bons de commande <ArrowRight size={14} /></Link>
        </div>
      )}

      <Onboarding />

      <div className="grid">
        {cards.map(([k, v]) => {
          const Icon = ICONS[k] || Activity
          const money = typeof v === 'number' && /value|revenue|expense|profit|cost/i.test(k)
          const tone = k === 'netProfit' && typeof v === 'number' ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''
          return (
            <div className="card kpi" key={k} data-tone={TONES[k] || 'teal'}>
              <div className="kpi-top"><span>{LABELS[k] || k}</span><span className="kpi-ico"><Icon size={18} strokeWidth={1.75} /></span></div>
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
            <span style={{ width: `${pct(expenses)}%`, background: '#d97706' }} />
            <span style={{ width: `${pct(Math.max(profit, 0))}%`, background: '#0f766e' }} />
          </div>
          <ul className="legend inline">
            <li><span className="dot" style={{ background: '#d97706' }} />Dépenses · {fmt(expenses)} ({Math.round(pct(expenses))}%)</li>
            <li><span className="dot" style={{ background: '#0f766e' }} />Résultat net · {fmt(profit)} ({Math.round(pct(Math.max(profit, 0)))}%)</li>
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
            series={[{ key: 'dispo', name: 'Disponible', color: '#c93a3a' }, { key: 'seuil', name: 'Seuil', color: '#b5b2a6' }]} />
        </div>
      )}

      <h2 className="row"><AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Produits en stock bas</h2>
      {low.length === 0 ? <div className="empty">Rien à signaler.</div> : (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Produit</th><th className="r">Niveau</th><th className="r">Disponible</th><th className="r">Seuil</th></tr></thead>
            <tbody>{low.map((p) => {
              const seuil = num(p.lowStockAlert), dispo = num(p.availableStock)
              const w = seuil > 0 ? Math.min(100, Math.round((dispo / seuil) * 100)) : 0
              return (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td className="r"><div className="gauge"><div className="gauge-bar"><i style={{ width: `${w}%`, background: dispo <= 0 ? 'var(--danger)' : 'var(--warning)' }} /></div></div></td>
                  <td className="r"><span className="badge danger">{p.availableStock}</span></td>
                  <td className="r">{p.lowStockAlert}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}