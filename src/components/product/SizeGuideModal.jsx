import Modal from '@/components/ui/Modal'

const ROWS = [
  ['XS', '20', '36–38', '22.5', '38'],
  ['S', '21', '38–40', '23', '39'],
  ['M', '22', '40–42', '23.5', '40'],
  ['L', '23', '42–44', '24', '41'],
  ['XL', '24', '44–46', '24.5', '42'],
  ['XXL', '25', '46–48', '25', '43'],
]

export function SizeChartTable() {
  return (
    <div className="overflow-x-auto">
      <table className="table-base min-w-[480px]">
        <thead>
          <tr>
            <th>Size</th>
            <th>Shoulder</th>
            <th>Chest (round)</th>
            <th>Sleeve</th>
            <th>Kameez Length</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? 'font-semibold' : 'text-smoke'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SizeGuideModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Size Guide" size="md">
      <div className="p-6">
        <p className="mb-4 text-sm text-smoke">
          Measurements are for the garment, in inches. Our silhouettes are tailored — if you prefer a relaxed fit, we
          recommend going one size up.
        </p>
        <SizeChartTable />
        <p className="mt-4 text-xs text-smoke">
          Need help with sizing? WhatsApp us at +92 300 1234567 with your measurements and we’ll guide you.
        </p>
      </div>
    </Modal>
  )
}
