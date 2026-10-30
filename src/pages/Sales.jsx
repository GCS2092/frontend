import { useState } from 'react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading } from '../components/ui'

const METHODS = [['CASH_ON_DELIVERY', 'Espèces / à la livraison'], ['MOBILE_MONEY', 'Mobile money']]
const lineKey = (l) => `${l.productId}|${l.variantId || ''}`

export default function Sales() {
  const { storeId } = useAuth()
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([])
  const [f, setF] = useState({ guestName: '', guestPhone: '', paymentMethod: 'CASH_ON_DELIVERY', destination: '' })
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState('')
  const found = useApi('/admin/orders/search/products', { storeId, q })
  const products = rows(found.data)
  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0)

  const add = (p, v = null) => {
    const line = { productId: p.id, variantId: v?.id || null, name: p.name + (v ? ` (${v.size}/${v.color})` : ''), price: p.price, quantity: 1 }
    setCart((c) => c.some((x) => lineKey(x) === lineKey(line))
      ? c.map((x) => (lineKey(x) === lineKey(line) ? { ...x, quantity: x.quantity + 1 } : x))
      : [...c, line])
  }
  const setQty = (k, n) => setCart((c) => c.map((x) => (lineKey(x) === k ? { ...x, quantity: Math.max(1, Number(n) || 1) } : x)))
  const remove = (k) => setCart((c) => c.filter((x) => lineKey(x) !== k))

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setDone('')
    if (!cart.length) return setMsg('Ajoutez au moins un produit.')
    try {
      const { data } = await api.post('/admin/orders', {
        storeId,
        items: cart.map((l) => ({ productId: l.productId, ...(l.variantId && { variantId: l.variantId }), quantity: l.quantity })),
        paymentMethod: f.paymentMethod,
        ...(f.destination && { destination: f.destination }),
        ...(f.guestName && { guestName: f.guestName }),
        ...(f.guestPhone && { guestPhone: f.guestPhone }),
      })
      setCart([]); setDone(`Commande ${data.orderNumber || ''} créée.`)
    } catch (er) { setMsg(errMsg(er)) }
  }

  return (
    <div>
      <h1>Vente comptoir</h1>
      <Msg text={found.error || msg} />
      {done && <div className="card">{done}</div>}
      <input className="search" placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Loading on={found.loading} />
      <table>
        <thead><tr><th>Produit</th><th>Prix</th><th>Ajouter</th></tr></thead>
        <tbody>{products.map((p) => (
          <tr key={p.id}><td>{p.name}</td><td>{fmt(p.price)}</td>
            <td>{p.variants?.length
              ? p.variants.map((v) => <button key={v.id} className="link" onClick={() => add(p, v)}>{v.size}/{v.color}</button>)
              : <button className="link" onClick={() => add(p)}>+ Ajouter</button>}</td></tr>
        ))}</tbody>
      </table>
      <h2>Panier</h2>
      <table>
        <thead><tr><th>Article</th><th>Prix</th><th>Qté</th><th>Sous-total</th><th></th></tr></thead>
        <tbody>{cart.map((l) => (
          <tr key={lineKey(l)}><td>{l.name}</td><td>{fmt(l.price)}</td>
            <td><input className="num" type="number" min="1" value={l.quantity} onChange={(e) => setQty(lineKey(l), e.target.value)} /></td>
            <td>{fmt(l.price * l.quantity)}</td>
            <td><button className="link" onClick={() => remove(lineKey(l))}>Retirer</button></td></tr>
        ))}</tbody>
      </table>
      <form className="card row" onSubmit={submit}>
        <input placeholder="Nom du client (optionnel)" value={f.guestName} onChange={(e) => setF({ ...f, guestName: e.target.value })} />
        <input placeholder="Téléphone (optionnel)" value={f.guestPhone} onChange={(e) => setF({ ...f, guestPhone: e.target.value })} />
        <select value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
          {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input placeholder="Destination / compte de paiement" value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} />
        <strong>Total : {fmt(total)}</strong>
        <button>Valider la vente</button>
      </form>
    </div>
  )
}
