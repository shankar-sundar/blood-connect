import { TopNav } from '@/components/shared/top-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
