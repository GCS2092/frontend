import axios from 'axios'

export const TOKEN_KEY = 'sgb_token'
export const USER_KEY = 'sgb_user'
export const STORES_KEY = 'sgb_stores'
export const STORE_KEY = 'sgb_store'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use((cfg) => {
  if (!cfg.headers.Authorization) {
    const t = localStorage.getItem(TOKEN_KEY)
    if (t) cfg.headers.Authorization = `Bearer ${t}`
  }
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || ''
    const isAuthStep = url.startsWith('/auth/login') || url.startsWith('/auth/2fa')
    if (err.response?.status === 401 && !isAuthStep) {
      ;[TOKEN_KEY, USER_KEY, STORES_KEY, STORE_KEY].forEach((k) => localStorage.removeItem(k))
      if (location.pathname !== '/login') location.assign('/login')
    }
    return Promise.reject(err)
  }
)

export const errMsg = (e) => e.response?.data?.message || e.response?.data?.error || e.message || 'Erreur inattendue'
export const bearer = (t) => ({ headers: { Authorization: `Bearer ${t}` } })
export const rows = (d) => {
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object') return d.data ?? d.items ?? d.products ?? Object.values(d).find(Array.isArray) ?? []
  return []
}
export const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' F'

export default api

export async function download(url, filename, params = {}) {
  const r = await api.get(url, { params, responseType: 'blob' })
  const href = URL.createObjectURL(r.data)
  const a = document.createElement('a')
  a.href = href; a.download = filename; a.click()
  URL.revokeObjectURL(href)
}
