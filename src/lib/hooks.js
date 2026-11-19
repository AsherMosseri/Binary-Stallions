import { useEffect, useState } from 'react'
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

// Live list of documents from a collection path like 'runs' or 'dms/<uid>/messages'.
export function useCollection(path, { order, dir = 'desc', n = 200 } = {}) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const parts = []
    if (order) parts.push(orderBy(order, dir))
    if (n) parts.push(limit(n))
    const q = query(collection(db, ...path.split('/')), ...parts)
    return onSnapshot(
      q,
      (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err)
    )
  }, [path, order, dir, n])

  return { rows, error }
}

// Live single document. Returns null while loading, {} if it doesn't exist yet.
export function useDoc(path) {
  const [data, setData] = useState(null)
  useEffect(
    () => onSnapshot(doc(db, path), (snap) => setData(snap.exists() ? snap.data() : {}), () => setData({})),
    [path]
  )
  return data
}
