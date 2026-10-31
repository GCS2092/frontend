import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Boxes, Tag, Percent, TrendingUp, Wallet, PiggyBank, Activity, AlertTriangle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../api/axios'
import { Msg, Loading, Badge } from '../components/ui'

const LABELS = {
  stockValue: 'Valeur du stock (achat)', stockRetailValue: 'Valeur du stock (vente)',
  stockMargin: 'Marge potentielle (%)', revenue: 'Chiffre d’affaires', totalExpenses: 'Dépenses', netProfit: 'Résultat net',
}
const ICONS = {
  stockValue: [Boxes, ''], stockRetailValue: [Tag, ''], stockMargin: [Percent, ''],
  revenue: [TrendingUp, 'green'], totalExpenses: [Wallet, 'red'], netProfit: [PiggyBank, 'green'],
}

function CountUp({ value, format }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, start
    const step = (t) => {
      start ??= t
      const p = Math.min((t - start) / 700, 1)
      setN(p === 1 ? value : value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(n)}</>
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
        {cards.map(([k, v], i) => {
          const [Icon, tone] = ICONS[k] || [Activity, '']
          const money = typeof v === 'number' && /value|revenue|expense|profit|cost/i.test(k)
          return (
            <motion.div className="card" key={k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
              <div className="stat">
                <div>
                  <div className="muted small">{LABELS[k] || k}</div>
                  <div className="big">
                    {typeof v === 'number'
                      ? <CountUp value={v} format={(x) => money ? fmt(x) : (x === v ? String(x) : Number.isInteger(v) ? String(Math.round(x)) : x.toFixed(2))} />
                      : v}
                  </div>
                </div>
                <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
              </div>
            </motion.div>
          )
        })}
      </div>
      <h2 className="row"><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Stock bas</h2>
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