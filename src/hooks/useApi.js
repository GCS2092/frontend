import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../api/axios'

export function useApi(url, params = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const key = JSON.stringify(params)
  const reload = useCallback(() => {
    setLoading(true)
    api.get(url, { params: JSON.parse(key) })
      .then((r) => { setData(r.data); setError('') })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [url, key])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload() }, [reload])
  return { data, error, loading, reload }
}
