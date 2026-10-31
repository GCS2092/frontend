import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Rocket, X } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { rows } from '../api/axios'

const KEY = 'onboarding-hidden'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

function Checklist({ onHide }) {
  const { storeId } = useAuth()
  const cats = useApi('/categories')
  const prods = useApi('/products/admin/all', { storeId, limit: 100 })
  const sups = useApi('/admin/accounting/suppliers/all')
  const ords = useApi('/admin/orders', { storeId, limit: 1 })

  const all = [cats, prods, sups, ords]
  if (all.some((x) => x.loading) || all.some((x) => x.error)) return null

  const products = rows(prods.data)
  const items = [
    { k: 'cat', title: 'Créer une catégorie', hint: 'Indispensable pour créer un produit.', to: '/admin/categories', done: rows(cats.data).length > 0 },
    { k: 'prod', title: 'Créer un produit', hint: 'Nom, prix de vente, prix d’achat, catégorie.', to: '/admin/products', done: products.length > 0 },
    { k: 'stock', title: 'Saisir le stock initial', hint: 'Une « Entrée » dans Mouvements, dans la bonne boutique.', to: '/admin/stock', done: products.some((p) => Number(p.stock) > 0) },
    { k: 'sup', title: 'Ajouter un fournisseur', hint: 'Pour pouvoir passer des bons de commande.', to: '/admin/suppliers', done: rows(sups.data).length > 0 },
    { k: 'sale', title: 'Faire une première vente', hint: 'Depuis la vente comptoir.', to: '/admin/sales', done: rows(ords.data).length > 0 },
  ]
  const doneCount = items.filter((i) => i.done).length
  const next = items.find((i) => !i.done)
  const pct = Math.round((doneCount / items.length) * 100)

  return (
    <div className="card onb">
      <div className="onb-head">
        <div>
          <div className="chart-title"><Rocket size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {next ? 'Bien démarrer avec SGB' : 'Tout est prêt'}</div>
          <div className="small muted">
            {next ? `${doneCount} étape${doneCount > 1 ? 's' : ''} sur ${items.length} terminée${doneCount > 1 ? 's' : ''}` : 'Votre boutique est configurée. Vous pouvez masquer ce bloc.'}
          </div>
        </div>
        <button type="button" className="ghost icon-btn" aria-label="Masquer" title="Masquer" onClick={onHide}><X size={14} /></button>
      </div>
      <div className="onb-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div>
      <ul className="onb-list">
        {items.map((i) => (
          <li key={i.k} className={`onb-item${i.done ? ' done' : ''}${next && i.k === next.k ? ' next' : ''}`}>
            <span className="onb-check">{i.done && <Check size={13} strokeWidth={3} />}</span>
            <div className="onb-txt"><div className="onb-title">{i.title}</div><div className="small muted">{i.hint}</div></div>
            {!i.done && next && i.k === next.k && <Link className="onb-go" to={i.to}>Commencer <ArrowRight size={14} /></Link>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Onboarding() {
  const [hidden, setHidden] = useState(read)
  if (hidden) return null
  return <Checklist onHide={() => { try { localStorage.setItem(KEY, '1') } catch { /* ignoré */ } setHidden(true) }} />
}