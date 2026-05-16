import { useEffect, useState } from 'react'
import { getPendingCount, onQueueChange, isOnline } from '../services/offlineSync'

export default function SyncIndicator() {
  const [pending, setPending] = useState(getPendingCount)
  const [online, setOnline]   = useState(isOnline)

  useEffect(() => {
    const unsub = onQueueChange(setPending)

    function handleOnline()  { setOnline(true) }
    function handleOffline() { setOnline(false) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsub()
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online && pending === 0) return null

  if (!online) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                       bg-red-100 text-red-700 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Offline
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                     bg-yellow-100 text-yellow-700 border border-yellow-200">
      <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
      {pending} pendente{pending !== 1 ? 's' : ''}
    </span>
  )
}
