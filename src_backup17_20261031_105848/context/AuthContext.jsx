import { createContext, useContext, useState } from 'react'
import api, { bearer, TOKEN_KEY, USER_KEY, STORES_KEY, STORE_KEY } from '../api/axios'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx)

const read = (k) => {
  try { return JSON.parse(localStorage.getItem(k)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read(USER_KEY))
  const [stores, setStores] = useState(() => read(STORES_KEY) || [])
  const [storeId, setStoreIdState] = useState(() => localStorage.getItem(STORE_KEY) || '')

  const finishSession = (d) => {
    const list = d.stores || []
    const sid = (list.find((s) => s.isMain) || list[0])?.id || ''
    localStorage.setItem(TOKEN_KEY, d.token)
    localStorage.setItem(USER_KEY, JSON.stringify(d.user))
    localStorage.setItem(STORES_KEY, JSON.stringify(list))
    localStorage.setItem(STORE_KEY, sid)
    setUser(d.user); setStores(list); setStoreIdState(sid)
  }

  const setStoreId = (id) => { localStorage.setItem(STORE_KEY, id); setStoreIdState(id) }

  const logout = () => {
    api.post('/auth/logout', {}, bearer(localStorage.getItem(TOKEN_KEY))).catch(() => {})
    ;[TOKEN_KEY, USER_KEY, STORES_KEY, STORE_KEY].forEach((k) => localStorage.removeItem(k))
    setUser(null); setStores([]); setStoreIdState('')
  }

  return <Ctx.Provider value={{ user, stores, storeId, setStoreId, finishSession, logout }}>{children}</Ctx.Provider>
}