import { cn } from '@/lib/format'

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-gold-600">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-smoke/80">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ label, error, hint, required, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <input className={cn('input', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20')} {...rest} />
    </Field>
  )
}

export function Textarea({ label, error, hint, required, className = '', rows = 4, ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <textarea rows={rows} className={cn('input resize-y', error && 'border-red-400')} {...rest} />
    </Field>
  )
}

export function Select({ label, error, hint, required, options = [], placeholder, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <select className={cn('input appearance-none bg-white', error && 'border-red-400')} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 select-none', disabled && 'opacity-50 pointer-events-none')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-gold-500' : 'bg-ink/20'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium">{label}</span>}
          {description && <span className="text-xs text-smoke">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Checkbox({ checked, onChange, label, className = '' }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-sm select-none', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-gold-500"
      />
      <span className="text-ink/85">{label}</span>
    </label>
  )
}
