import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Tag, TrendingUp, Wallet, PiggyBank, AlertTriangle, ShoppingCart, Plus, ArrowRight } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading } from '../components/ui'
import { AreaCard, DonutCard, HBarCard } from '../ui/charts'
import Onboarding from '../ui/Onboarding'
import { tv } from '../ui/fr'

const METRICS = [
  ['revenue', 'Chiffre d’affaires', TrendingUp, 'green', true],
  ['expenses', 'Dépenses', Wallet, 'amber', true],
  ['netProfit', 'Résultat net', PiggyBank, 'rose', true],
  ['orderCount', 'Commandes payées', ShoppingCart, 'indigo', false],
  ['avgOrderValue', 'Panier moyen', Tag, 'cyan', true],
  ['stockValue', 'Valeur du stock (achat)', Boxes, 'teal', true],
]
const PERIODS = [['month', 'Ce mois'], ['year', 'Cette année'], ['all', 'Tout']]
const num = (v) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function Dashboard() {
  const { storeId, user, stores } = useAuth()
  const [period, setPeriod] = useState('month')
  const { data, error, loading } = useApi('/admin/accounting/dashboard', { storeId, period })
  const d = data || {}
  const low = Array.isArray(d.lowStockProducts) ? d.lowStockProducts : []

  const revenue = num(d.revenue), cogs = num(d.cogs), expenses = num(d.expenses), profit = num(d.netProfit)
  const stockCost = num(d.stockValue), stockRetail = num(d.stockRetailValue)
  const pct = (v) => (revenue > 0 ? Math.min(100, Math.max(0, (v / revenue) * 100)) : 0)

  const hello = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
  const store = (stores || []).find((s) => String(s.id) === String(storeId))

  const resultData = [
    { name: 'Coût des ventes', value: cogs, color: '#6366f1' },
    { name: 'Dépenses', value: expenses, color: '#d97706' },
    { name: 'Résultat net', value: Math.max(profit, 0), color: '#0f766e' },
  ]
  const stockData = [
    { name: 'Valeur d’achat', value: stockCost, color: '#0f766e' },
    { name: 'Marge potentielle', value: Math.max(stockRetail - stockCost, 0), color: '#6366f1' },
  ]
  const expenseSlices = (Array.isArray(d.expensesByCategory) ? d.expensesByCategory : [])
    .map((e) => ({ name: tv(e.category) || 'Autre', value: num(e._sum?.amount) }))
    .filter((e) => e.value > 0)
  const trend = (Array.isArray(d.revenueChart) ? d.revenueChart : [])
    .map((p) => ({ name: p.month, revenue: num(p.revenue) }))
  const lowBars = low.slice(0, 8).map((p) => ({ name: p.name, dispo: num(p.availableStock), seuil: num(p.lowStockAlert) }))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{hello}{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="page-sub">Voici l’état de {store ? `« ${store.name} »` : 'votre activité'}.</p>
        </div>
        <div className="row">
          <div className="fchips" role="group" aria-label="Période">
            {PERIODS.map(([k, l]) => (
              <button key={k} type="button" className={`fchip${period === k ? ' on' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
            ))}
          </div>
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
        {METRICS.map(([k, label, Icon, tone, money]) => {
          const v = num(d[k])
          const sign = k === 'netProfit' ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''
          return (
            <div className="card kpi" key={k} data-tone={tone}>
              <div className="kpi-top"><span>{label}</span><span className="kpi-ico"><Icon size={18} strokeWidth={1.75} /></span></div>
              <div className={`kpi-value ${sign}`}>{money ? fmt(v) : v}</div>
            </div>
          )
        })}
      </div>

      {!loading && data && revenue > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="chart-head"><div className="chart-title">Du chiffre d’affaires au résultat</div>
            <div className="small muted">Coût des ventes, dépenses et résultat net par rapport au CA</div></div>
          <div className="split-bar" role="img" aria-label="Répartition du chiffre d’affaires">
            <span style={{ width: `${pct(cogs)}%`, background: '#6366f1' }} />
            <span style={{ width: `${pct(expenses)}%`, background: '#d97706' }} />
            <span style={{ width: `${pct(Math.max(profit, 0))}%`, background: '#0f766e' }} />
          </div>
          <ul className="legend inline">
            <li><span className="dot" style={{ background: '#6366f1' }} />Coût des ventes · {fmt(cogs)} ({Math.round(pct(cogs))}%)</li>
            <li><span className="dot" style={{ background: '#d97706' }} />Dépenses · {fmt(expenses)} ({Math.round(pct(expenses))}%)</li>
            <li><span className="dot" style={{ background: '#0f766e' }} />Résultat net · {fmt(profit)} ({Math.round(pct(Math.max(profit, 0)))}%)</li>
          </ul>
        </div>
      )}

      {!loading && data && (
        <div className="charts-grid">
          <AreaCard title="Chiffre d’affaires" subtitle="Six derniers mois, commandes payées"
            data={trend} format={fmt} series={[{ key: 'revenue', name: 'CA', color: '#0f766e' }]} />
          <DonutCard title="Répartition du CA" subtitle="Coût des ventes, dépenses et résultat"
            data={resultData} format={fmt} centerLabel="CA" centerValue={fmt(revenue)} />
          <DonutCard title="Dépenses par catégorie" subtitle="Sur la période choisie"
            data={expenseSlices} format={fmt} centerLabel="Total" />
          <DonutCard title="Valeur du stock" subtitle={`Marge potentielle ${d.stockMargin ?? 0} %`}
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