import { TopNav } from '@/components/shared/top-nav'

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
