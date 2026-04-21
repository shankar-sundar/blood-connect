'use client'

type Props = { message: string; type: 'success' | 'info' | 'warning'; onClose: () => void }

const accent = { success: 'border-l-green-400', info: 'border-l-[#0071e3]', warning: 'border-l-red-400' }

export default function Toast({ message, type, onClose }: Props) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-md border border-[#e5e5ea] border-l-4 ${accent[type]}`}>
      <p className="text-sm text-[#1d1d1f] flex-1">{message}</p>
      <button onClick={onClose} className="text-[#aeaeb2] hover:text-[#6e6e73] text-lg leading-none">×</button>
    </div>
  )
}
