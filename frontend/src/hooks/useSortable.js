// Reusable client-side sorting for tables. Handles numbers, strings and
// ISO dates. Returns the sorted list plus the current key/dir + a toggler.
import { useMemo, useState } from 'react'

function compare(a, b) {
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

// `accessors` maps a sort key -> function(item) returning the sortable value.
export function useSortable(items, accessors, initial = null) {
  const [sortKey, setSortKey] = useState(initial)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    if (!sortKey || !accessors[sortKey]) return items
    const get = accessors[sortKey]
    const copy = [...items]
    copy.sort((x, y) => {
      const r = compare(get(x), get(y))
      return sortDir === 'asc' ? r : -r
    })
    return copy
  }, [items, sortKey, sortDir, accessors])

  const toggle = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return { sorted, sortKey, sortDir, toggle }
}
