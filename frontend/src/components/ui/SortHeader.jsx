// Sortable table header cell. Click to sort; shows a direction chevron
// and exposes aria-sort for screen readers (WCAG: sortable-table).
export default function SortHeader({ label, sortKey, activeKey, dir, onSort, align }) {
  const active = sortKey === activeKey
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <th aria-sort={ariaSort} style={align ? { textAlign: align } : undefined}>
      <button type="button" className={`sort-th ${active ? 'sort-th-active' : ''}`} onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-arrow">{active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  )
}
