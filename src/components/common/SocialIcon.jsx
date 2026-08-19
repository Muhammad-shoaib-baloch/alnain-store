import { Instagram, Facebook, Youtube, Twitter, Music2, MessageCircle, Pin, Globe } from 'lucide-react'

const ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Music2,
  whatsapp: MessageCircle,
  pinterest: Pin,
}

/** Renders the right icon for a social platform key (from admin Social Links). */
export default function SocialIcon({ platform, size = 18, className = '' }) {
  const Icon = ICONS[platform] || Globe
  return <Icon size={size} className={className} />
}
