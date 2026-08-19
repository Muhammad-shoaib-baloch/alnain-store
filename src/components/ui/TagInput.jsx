import { useState } from 'react'
import { X } from 'lucide-react'
import { Field } from './Field'

export default function TagInput({ value = [], onChange, label, placeholder = 'Type and press Enter', hint }) {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const tag = draft.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  return (
    <Field label={label} hint={hint}>
      <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 py-1.5">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-cream px-2 py-1 text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X size={12} className="text-smoke hover:text-ink" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag()
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={addTag}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[100px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-smoke/60"
        />
      </div>
    </Field>
  )
}
