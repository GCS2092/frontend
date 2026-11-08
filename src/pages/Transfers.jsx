import { useState } from 'react'
import { Eye, Plus, Printer, Trash2 } from 'lucide-react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const vLabel = (v) => [v.size, v.color].filter(Boolean).join(' / ') || 'Variante'
const iLabel = (i) => `${i.product?.name || '—'}${i.variant ? ' — ' + vLabel(i.variant) : ''}`
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const dt = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—')
const EMPTY_LINE = { productId: '', variantId: '', quantity: '' }
const availAt = (p, storeId, variantId) => Math.max(0, (p?.storeStocks || [])
  .filter((s) => String(s.storeId) === String(storeId) && (s.variantId || null) === (variantId || null))
  .reduce((a, s) => a + s.quantity - s.reservedQuantity, 0))

function printTransfer(t) {
  const w = window.open('', '_blank')
  if (!w) return toast.error('Autorisez les fenêtres pop-up pour imprimer.')
  const body = t.items.map((i) => `<tr><td>${esc(iLabel(i))}</td><td class="r">${i.quantity}</td><td class="r">${i.quantityReceived ?? ''}</td></tr>`).join('')
  w.document.write(`<html><head><title>${esc(t.transferNumber)}</title><style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #999;padding:6px 8px;font-size:13px;text-align:left}.r{text-align:right}h1{font-size:20px;margin:0 0 6px}.sig{margin-top:48px;display:flex;justify-content:space-between}</style></head><body><h1>Bon de transfert ${esc(t.transferNumber)}</h1><div>De : ${esc(t.fromStore?.name)} → Vers : ${esc(t.toStore?.name)}</div><div>Créé : ${dt(t.createdAt)} · Expédié : ${dt(t.shippedAt)} · Reçu : ${dt(t.receivedAt)}</div>${t.notes ? '<div>Notes : ' + esc(t.notes) + '</div>' : ''}${t.receiveNotes ? '<div>Motif d’écart : ' + esc(t.receiveNotes) + '</div>' : ''}<table><thead><tr><th>Article</th><th class="r">Envoyé</th><th class="r">Reçu</th></tr></thead><tbody>${body}</tbody></table><div class="sig"><span>Expéditeur : ____________</span><span>Réceptionnaire : ____________</span></div></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function Transfers() {
  const { stores, storeId } = useAuth()
  const t = useApi('/admin/stock-transfers', { storeId })
  const prods = useApi('/products/admin/all', { limit: 200 })
  const list = rows(t.data)
  const prodList = rows(prods.data)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [toStoreId, setToStoreId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [detail, setDetail] = useState(null)
  const [recv, setRecv] = useState({})
  const [recvNote, setRecvNote] = useState('')
  const fromName = stores.find((s) => String(s.id) === String(storeId))?.name

  const act = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) toast.success(ok); t.reload(); prods.reload() } catch (er) { setMsg(errMsg(er)) } }
  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))
  const openCreate = () => { setToStoreId(''); setNotes(''); setLines([{ ...EMPTY_LINE }]); setOpen(true) }

  const create = async (e) => {
    e.preventDefault()
    if (!toStoreId) return toast.error('Choisissez la boutique de destination.')
    const items = []
    for (const [i, l] of lines.entries()) {
      const p = prodList.find((x) => x.id === l.productId)
      const q = Number(l.quantity)
      if (!p) return toast.error(`Ligne ${i + 1} : choisissez un produit.`)
      if (p.variants?.length && !l.variantId) return toast.error(`Ligne ${i + 1} : choisissez la variante.`)
      if (!Number.isInteger(q) || q < 1) return toast.error(`Ligne ${i + 1} : quantité entière positive requise.`)
      const av = availAt(p, storeId, l.variantId || null)
      if (q > av) return toast.error(`Ligne ${i + 1} : disponible à la source : ${av}.`)
      items.push({ productId: l.productId, ...(l.variantId && { variantId: l.variantId }), quantity: q })
    }
    setBusy(true)
    try {
      await api.post('/admin/stock-transfers', { fromStoreId: storeId, toStoreId, items, ...(notes.trim() && { notes: notes.trim() }) })
      toast.success('Transfert créé (en attente d’expédition).'); setOpen(false); t.reload()
    } catch (er) { toast.error(errMsg(er)) } finally { setBusy(false) }
  }

  const ship = async (x) => {
    const ok = await confirmDialog({ title: `Expédier ${x.transferNumber} ?`, message: 'Le stock sort de la boutique source dès maintenant. Il entrera chez la destination à la réception.', confirmLabel: 'Expédier' })
    if (ok) act(() => api.patch(`/admin/stock-transfers/${x.id}/ship`, {}), 'Transfert expédié, stock retiré de la source.')
  }
  const cancel = async (x) => {
    const shipped = x.status === 'SHIPPED'
    const ok = await confirmDialog({ title: `Annuler ${x.transferNumber} ?`, message: shipped ? 'La marchandise expédiée sera remise en stock à la source.' : 'Le transfert en attente sera abandonné.', danger: true, confirmLabel: 'Annuler le transfert' })
    if (ok) act(() => api.patch(`/admin/stock-transfers/${x.id}/cancel`, {}), shipped ? 'Transfert annulé, stock remis à la source.' : 'Transfert annulé.')
  }

  const openDetail = (x) => {
    setDetail(x); setRecvNote('')
    setRecv(Object.fromEntries(x.items.map((i) => [i.id, String(i.quantity)])))
  }
  const receiving = detail?.status === 'SHIPPED'
  const hasGap = detail ? detail.items.some((i) => Number(recv[i.id]) < i.quantity) : false
  const submitReceive = async () => {
    const out = []
    for (const i of detail.items) {
      const q = Number(recv[i.id])
      if (!Number.isInteger(q) || q < 0 || q > i.quantity) return toast.error(`${iLabel(i)} : saisissez 0 à ${i.quantity}.`)
      out.push({ itemId: i.id, quantityReceived: q })
    }
    if (hasGap && recvNote.trim().length < 3) return toast.error('Précisez un motif pour les écarts.')
    setBusy(true)
    try {
      await api.patch(`/admin/stock-transfers/${detail.id}/receive`, { lines: out, note: recvNote.trim() })
      toast.success('Réception enregistrée.'); setDetail(null); t.reload(); prods.reload()
    } catch (er) { toast.error(errMsg(er)) } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>Transferts entre boutiques</h1><p className="page-sub">Demandé → expédié (stock retiré de la source) → reçu (stock ajouté à la destination).</p></div>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouveau transfert</button>
      </div>
      <Msg text={t.error || msg} />
      <Loading on={t.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>N°</th><th>Trajet</th><th>Articles</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.transferNumber}</td><td>{x.fromStore?.name} → {x.toStore?.name}</td>
            <td>{x.items?.length} ligne(s) : {x.items?.slice(0, 2).map((i) => `${i.product?.name} × ${i.quantity}`).join(', ')}{x.items?.length > 2 ? '…' : ''}</td>
            <td><Badge>{x.status}</Badge></td>
            <td>
              <button className="link" onClick={() => openDetail(x)}><Eye size={13} /> {x.status === 'SHIPPED' ? 'Réceptionner' : 'Détail'}</button>{' '}
              {x.status === 'PENDING' && <button className="link" onClick={() => ship(x)}>Expédier</button>}{' '}
              {['PENDING', 'SHIPPED'].includes(x.status) && <button className="link" onClick={() => cancel(x)}>Annuler</button>}
            </td></tr>
        ))}</tbody>
      </table></div>
      {!t.loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} size="lg" title="Nouveau transfert"
        description={`Depuis : ${fromName || '—'}`}
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="tr-form" disabled={busy}>{busy ? 'Création…' : 'Créer le transfert'}</button>
        </>}>
        <form id="tr-form" onSubmit={create}>
          <div className="form-grid">
            <label>Vers
              <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)} required>
                <option value="">Choisir…</option>
                {stores.filter((s) => String(s.id) !== String(storeId)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>Notes <span className="muted">(optionnel)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </div>
          <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Articles</h3>
          {lines.map((l, i) => {
            const p = prodList.find((x) => x.id === l.productId)
            const av = p && (!p.variants?.length || l.variantId) ? availAt(p, storeId, l.variantId || null) : null
            return (
              <div key={i} className="row" style={{ gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <select value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value, variantId: '' })} style={{ minWidth: 160 }}>
                  <option value="">Produit…</option>
                  {prodList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                {p?.variants?.length > 0 && (
                  <select value={l.variantId} onChange={(e) => setLine(i, { variantId: e.target.value })}>
                    <option value="">Variante…</option>
                    {p.variants.map((v) => <option key={v.id} value={v.id}>{vLabel(v)}</option>)}
                  </select>
                )}
                <input type="number" min="1" step="1" placeholder="Qté" style={{ width: 80 }} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                {av !== null && <span className="small muted">dispo : {av}</span>}
                <button type="button" className="ghost icon-btn" aria-label="Retirer la ligne" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Trash2 size={14} /></button>
              </div>
            )
          })}
          <button type="button" className="ghost" onClick={() => setLines((ls) => [...ls, { ...EMPTY_LINE }])}><Plus size={14} /> Ajouter une ligne</button>
        </form>
      </Modal>

      <Modal open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }} size="lg"
        title={detail ? `${detail.transferNumber} — ${detail.fromStore?.name} → ${detail.toStore?.name}` : ''}
        description={detail ? `Expédié : ${dt(detail.shippedAt)} · Reçu : ${dt(detail.receivedAt)}${detail.receiveNotes ? ' · Motif d’écart : ' + detail.receiveNotes : ''}` : undefined}
        footer={detail && <>
          <button type="button" className="ghost" onClick={() => printTransfer(detail)}><Printer size={14} /> Imprimer</button>
          <button type="button" className="ghost" onClick={() => setDetail(null)}>Fermer</button>
          {receiving && <button type="button" disabled={busy} onClick={submitReceive}>{busy ? 'Enregistrement…' : 'Confirmer la réception'}</button>}
        </>}>
        {detail && (
          <div>
            <div className="table-wrap">
              <table className="dt">
                <thead><tr><th>Article</th><th className="r">Envoyé</th><th className="r">Reçu</th><th className="r">Écart</th></tr></thead>
                <tbody>
                  {detail.items.map((i) => {
                    const got = receiving ? Number(recv[i.id]) : i.quantityReceived
                    const gap = got == null || Number.isNaN(got) ? null : i.quantity - got
                    return (
                      <tr key={i.id}>
                        <td>{iLabel(i)}</td><td className="r">{i.quantity}</td>
                        <td className="r">{receiving
                          ? <input type="number" min="0" max={i.quantity} step="1" style={{ width: 80 }} value={recv[i.id] ?? ''} onChange={(e) => setRecv({ ...recv, [i.id]: e.target.value })} />
                          : (i.quantityReceived ?? '—')}</td>
                        <td className="r">{gap ? <strong style={{ color: 'var(--danger)' }}>{gap}</strong> : (gap === 0 ? '0' : '—')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {receiving && (
              <label style={{ marginTop: 10 }}>Motif de l’écart {hasGap ? <span className="muted">(obligatoire)</span> : <span className="muted">(si écart)</span>}
                <input value={recvNote} onChange={(e) => setRecvNote(e.target.value)} placeholder="Ex. 2 pièces abîmées au transport" />
              </label>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}