import { useState } from 'react'
import api, { errMsg } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading } from '../components/ui'
import { toast } from '../ui/feedback'

const GROUPS = [
  ['Entreprise', [['company_name', 'Nom'], ['company_address', 'Adresse'], ['company_phone', 'Téléphone'], ['company_email', 'Email']]],
  ['Mobile money', [['wave_number', 'Numéro Wave'], ['orange_money_number', 'Numéro Orange Money'], ['free_money_number', 'Numéro Free Money'], ['payment_instructions', 'Instructions de paiement']]],
  ['WhatsApp', [['whatsapp_number', 'Numéro WhatsApp']]],
  ['Livraison', [['delivery_fee', 'Frais de livraison'], ['free_delivery_threshold', 'Seuil de livraison gratuite'], ['reservation_expiry_hours', 'Expiration des réservations (heures)'], ['default_country_code', 'Indicatif pays par défaut']]],
  ['Livraison Congo', [['congo_express_rate', 'Tarif express'], ['congo_groupage_rate', 'Tarif groupage'], ['congo_groupage_gift', 'Cadeau groupage']]],
  ['Acompte', [['deposit_threshold', 'Seuil d’acompte (0 = désactivé)'], ['deposit_percent', 'Pourcentage d’acompte']]],
]
const KNOWN = new Set(GROUPS.flatMap(([, f]) => f.map(([k]) => k)))

export default function Settings() {
  const s = useApi('/settings')
  const [edit, setEdit] = useState({})
  const [msg, setMsg] = useState('')
  const base = s.data && typeof s.data === 'object' ? s.data : {}
  const others = Object.keys(base).filter((k) => !KNOWN.has(k) && ['string', 'number'].includes(typeof base[k]))
  const groups = others.length ? [...GROUPS, ['Autres', others.map((k) => [k, k])]] : GROUPS
  const val = (k) => edit[k] ?? base[k] ?? ''
  const save = async (e) => {
    e.preventDefault(); setMsg('')
    if (!Object.keys(edit).length) return toast.error('Aucune modification.')
    try { await api.put('/settings', edit); setEdit({}); toast.success('Paramètres enregistrés.'); s.reload() } catch (er) { setMsg(errMsg(er)) }
  }
  return (
    <div>
      <div className="page-head"><div><h1>Paramètres</h1><p className="page-sub">Identité de l’entreprise, paiements et livraison.</p></div></div>
      <Msg text={s.error || msg} /><Loading on={s.loading} />
      <form onSubmit={save}>
        {groups.map(([title, fields]) => (
          <div className="card" key={title}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            {fields.map(([k, label]) => (
              <label key={k}>{label}
                <input value={val(k)} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        ))}
        <button>Enregistrer</button>
      </form>
    </div>
  )
}
