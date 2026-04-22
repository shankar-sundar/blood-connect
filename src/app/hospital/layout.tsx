import { TopNav } from '@/components/shared/top-nav'

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
