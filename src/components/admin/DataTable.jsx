/**
 * Light declarative table for admin lists.
 * columns: [{ key, label, className, render?(row) }]
 */
export default function DataTable({ columns, rows, keyFn = (r) => r.id, empty = 'Nothing here yet.', onRowClick }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-smoke">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={keyFn(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
