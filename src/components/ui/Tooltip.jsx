export default function Tooltip({ label, children, side = 'top' }) {
  const pos =
    side === 'bottom'
      ? 'top-full mt-1.5 left-1/2 -translate-x-1/2'
      : 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-50 whitespace-nowrap bg-ink px-2.5 py-1 text-[11px] font-medium text-ivory opacity-0 shadow-soft transition-opacity duration-150 group-hover/tip:opacity-100 ${pos}`}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  )
}
