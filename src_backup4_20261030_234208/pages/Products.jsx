import { useState } from 'react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

export default function Products() {
  const { storeId } = useAuth()
  const [search, setSearch] = useState('')
  const { data, error, loading, reload } = useApi('/products/admin/all', { storeId, search: search || undefined, limit: 100 })
  const cats = useApi('/categories')
  const [f, setF] = useState({ name: '', price: '', purchasePrice: '', categoryId: '', sku: '' })
  const [msg, setMsg] = useState('')
  const list = rows(data)

  const create = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      await api.post('/products', {
        name: f.name, slug: slugify(f.name), description: f.name, price: Number(f.price), stock: 0,
        ...(f.purchasePrice && { purchasePrice: Number(f.purchasePrice) }),
        ...(f.categoryId && { categoryId: f.categoryId }), status: 'PUBLISHED',
      })
      setF({ name: '', price: '', purchasePrice: '', categoryId: '', sku: '' }); reload()
    } catch (er) { setMsg(errMsg(er)) }
  }

  return (
    <div>
      <h1>Produits</h1>
      <Msg text={error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Nom" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input placeholder="Prix de vente" type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
        <input placeholder="Prix d’achat" type="number" min="0" value={f.purchasePrice} onChange={(e) => setF({ ...f, purchasePrice: e.target.value })} />
        <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} required>
          <option value="">Catégorie…</option>
          {rows(cats.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button>Créer</button>
      </form>
      <p className="muted small">Le stock initial se saisit dans « Mouvements » (entrée), pour être rattaché à une boutique.</p>
      <input className="search" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Loading on={loading} />
      <table>
        <thead><tr><th>Nom</th><th>Prix</th><th>Achat</th><th>Stock total</th><th>Réservé</th><th>Statut</th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.id}><td>{p.name}</td><td>{fmt(p.price)}</td><td>{p.purchasePrice != null ? fmt(p.purchasePrice) : '—'}</td>
            <td>{p.stock}</td><td>{p.reservedStock}</td><td><Badge>{p.status}</Badge></td></tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}