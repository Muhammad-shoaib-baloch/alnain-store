export default function EmptyState({ icon: Icon, title, message, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}>
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-600">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display text-xl">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-smoke">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
