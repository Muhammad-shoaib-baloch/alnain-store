import PageHeader from '@/components/admin/PageHeader'
import SocialLinksManager from '@/components/admin/SocialLinksManager'
import { usePageTitle } from '@/hooks'

export default function AdminSocialLinks() {
  usePageTitle('Admin · Social Links')
  return (
    <div>
      <PageHeader
        title="Social Media Links"
        sub="These links power the storefront footer and social sections — no URLs are hardcoded in the frontend."
      />
      <div className="max-w-3xl">
        <SocialLinksManager />
      </div>
    </div>
  )
}
