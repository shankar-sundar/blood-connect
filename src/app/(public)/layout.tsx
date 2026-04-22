import { TopNav } from '@/components/shared/top-nav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
