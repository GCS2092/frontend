import { useEffect, useState } from 'react'
import { Banknote, Minus, Plus, Search, ShoppingCart, Smartphone, Trash2 } from 'lucide-react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading } from '../components/ui'
import { toast, confirmDialog } from '../ui/feedback'

const METHODS = [
  ['CASH_ON_DELIVERY', 'Espèces', 'Espèces / à la livraison', Banknote],
  ['MOBILE_MONEY', 'Mobile money', 'Mobile money', Smartphone],
]
const lineKey = (l) => `${l.productId}|${l.variantId || ''}`
const EMPTY = { guestName: '', guestPhone: '', paymentMethod: 'CASH_ON_DELIVERY', destination: '' }
const eq = (a, b) => a && String(a).trim().toLowerCase() === b

export default function Sales() {
  const { storeId } = useAuth()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [f, setF] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const found = useApi('/admin/orders/search/products', { storeId, q: query })
  const products = rows(found.data)
  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0)
  const count = cart.reduce((s, l) => s + l.quantity, 0)

  const add = (p, v = null) => {
    const avail = v ? v.available : p.available
    const max = typeof avail === 'number' ? avail : null
    const line = { productId: p.id, variantId: v?.id || null, name: p.name + (v ? ` (${v.size}/${v.color})` : ''), price: p.price, quantity: 1, max }
    const have = cart.find((x) => lineKey(x) === lineKey(line))?.quantity || 0
    if (max !== null && have + 1 > max) {
      return toast.error(max <= 0 ? 'Rupture de stock pour cet article.' : `Stock disponible : ${max}.`)
    }
    setCart((c) => (c.some((x) => lineKey(x) === lineKey(line))
      ? c.map((x) => (lineKey(x) === lineKey(line) ? { ...x, quantity: x.quantity + 1, max } : x))
      : [...c, line]))
  }
  const setQty = (k, n) => {
    const line = cart.find((x) => lineKey(x) === k)
    if (!line) return
    let qn = Math.max(1, Math.floor(Number(n)) || 1)
    if (line.max != null && qn > line.max) { qn = Math.max(1, line.max); toast.error(`Stock disponible : ${line.max}.`) }
    setCart((c) => c.map((x) => (lineKey(x) === k ? { ...x, quantity: qn } : x)))
  }
  const remove = (k) => setCart((c) => c.filter((x) => lineKey(x) !== k))

  const clear = async () => {
    const ok = await confirmDialog({ title: 'Vider le panier ?', message: `${count} article(s) seront retirés.`, danger: true, confirmLabel: 'Vider' })
    if (ok) setCart([])
  }

  // Entrée = lecture douchette : code-barres / SKU exact (produit ou variante), sinon résultat unique
  const onSearchKey = async (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    try {
      const { data } = await api.get('/admin/orders/search/products', { params: { storeId, q: term } })
      const list = rows(data)
      const t = term.toLowerCase()
      for (const p of list) {
        const v = p.variants?.find((x) => eq(x.barcode, t) || eq(x.sku, t))
        if (v) { add(p, v); setQ(''); return }
      }
      const exact = list.find((p) => !p.variants?.length && (eq(p.barcode, t) || eq(p.sku, t)))
      if (exact) { add(exact); setQ(''); return }
      if (list.length === 1 && !list[0].variants?.length) { add(list[0]); setQ(''); return }
      if (!list.length) toast.error('Aucun article pour ce code.')
      else if (list.length === 1) toast.error('Choisissez la variante dans la liste.')
    } catch (er) { toast.error(errMsg(er)) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!cart.length) return toast.error('Ajoutez au moins un produit.')
    if (f.guestPhone && !/^[+\d][\d\s.()-]{5,}$/.test(f.guestPhone.trim())) return toast.error('Numéro de téléphone invalide.')
    setBusy(true)
    try {
      const { data } = await api.post('/admin/orders', {
        storeId,
        items: cart.map((l) => ({ productId: l.productId, ...(l.variantId && { variantId: l.variantId }), quantity: l.quantity })),
        paymentMethod: f.paymentMethod,
        ...(f.destination && { destination: f.destination }),
        ...(f.guestName && { guestName: f.guestName }),
        ...(f.guestPhone && { guestPhone: f.guestPhone }),
      })
      setCart([]); setF({ ...EMPTY, paymentMethod: f.paymentMethod })
      toast.success(`Vente enregistrée — commande ${data.orderNumber || ''}`.trim())
      found.reload?.()
    } catch (er) { toast.error(errMsg(er)); found.reload?.() }
    finally { setBusy(false) }
  }

  return (
    <div>
      <div className="page-head"><div><h1>Vente comptoir</h1><p className="page-sub">Encaissez pour la boutique sélectionnée. Scannez un code-barres (ou tapez un SKU) puis Entrée pour ajouter l’article.</p></div></div>
      <Msg text={found.error} />

      <div className="pos">
        <section>
          <div className="toolbar">
            <div className="search-box" style={{ maxWidth: 420 }}>
              <Search size={15} />
              <input className="search" placeholder="Nom, SKU ou code-barres…" value={q}
                onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} autoFocus />
            </div>
            <span className="small muted">{products.length} résultat{products.length > 1 ? 's' : ''}</span>
          </div>
          <Loading on={found.loading && !products.length} />
          <div className="prod-grid">
            {products.map((p) => (
              <div className="prod" key={p.id}>
                <div className="prod-name">{p.name}</div>
                <div className="prod-price">{fmt(p.price)}</div>
                {typeof p.available === 'number' && (
                  <div className="small" style={{ color: p.available <= 0 ? 'var(--danger)' : undefined }}>
                    {p.available <= 0 ? 'Rupture' : `Dispo : ${p.available}`}
                  </div>
                )}
                <div className="prod-actions">
                  {p.variants?.length
                    ? p.variants.map((v) => (
                      <button type="button" key={v.id} className="ghost chip" disabled={v.available <= 0}
                        title={typeof v.available === 'number' ? `Disponible : ${v.available}` : undefined} onClick={() => add(p, v)}>
                        {v.size}/{v.color}{typeof v.available === 'number' ? ` · ${v.available}` : ''}
                      </button>
                    ))
                    : <button type="button" className="ghost chip" disabled={p.available <= 0} onClick={() => add(p)}><Plus size={14} /> Ajouter</button>}
                </div>
              </div>
            ))}
          </div>
          {!found.loading && !products.length && <div className="empty">Aucun produit trouvé.</div>}
        </section>

        <aside className="card pos-cart">
          <div className="cart-head">
            <h2><ShoppingCart size={16} style={{ verticalAlign: '-3px' }} /> Panier {count > 0 && <span className="badge">{count}</span>}</h2>
            {cart.length > 0 && <button type="button" className="link" onClick={clear}>Vider</button>}
          </div>

          {!cart.length ? <div className="empty small">Le panier est vide.<br />Ajoutez des produits depuis la liste.</div> : (
            <ul className="cart-lines">
              {cart.map((l) => {
                const k = lineKey(l)
                return (
                  <li key={k}>
                    <div className="cart-line-top">
                      <span className="cart-name">{l.name}</span>
                      <button type="button" className="ghost icon-btn" aria-label="Retirer" onClick={() => remove(k)}><Trash2 size={14} /></button>
                    </div>
                    <div className="cart-line-bottom">
                      <div className="stepper">
                        <button type="button" className="ghost icon-btn" aria-label="Moins" onClick={() => setQty(k, l.quantity - 1)}><Minus size={14} /></button>
                        <input className="qty-input" type="number" min="1" max={l.max ?? undefined} value={l.quantity} onChange={(e) => setQty(k, e.target.value)} />
                        <button type="button" className="ghost icon-btn" aria-label="Plus" onClick={() => setQty(k, l.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <span className="muted small">{fmt(l.price)} ×</span>
                      <strong className="cart-sub">{fmt(l.price * l.quantity)}</strong>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <form onSubmit={submit}>
            <div className="seg" role="radiogroup" aria-label="Moyen de paiement">
              {METHODS.map(([v, label, title, Icon]) => (
                <button type="button" key={v} role="radio" aria-checked={f.paymentMethod === v} title={title}
                  className={`ghost${f.paymentMethod === v ? ' on' : ''}`} onClick={() => setF({ ...f, paymentMethod: v })}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <label>Client <span className="muted">(optionnel)</span>
              <input placeholder="Nom" value={f.guestName} onChange={(e) => setF({ ...f, guestName: e.target.value })} />
            </label>
            <label>Téléphone <span className="muted">(optionnel)</span>
              <input type="tel" placeholder="+221 …" value={f.guestPhone} onChange={(e) => setF({ ...f, guestPhone: e.target.value })} />
            </label>
            <label>Destination <span className="muted">(vide si vente locale)</span>
              <input value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} />
            </label>
            <div className="cart-total"><span>Total</span><strong>{fmt(total)}</strong></div>
            <button className="pay-btn" disabled={busy || !cart.length}>{busy ? 'Enregistrement…' : 'Valider la vente'}</button>
          </form>
        </aside>
      </div>
    </div>
  )
}