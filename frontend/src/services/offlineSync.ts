// Gerenciamento de fila offline com localStorage — estrutura de dados: Fila (Queue)

const STORAGE_KEY = 'pratocerto_offline_queue'

export interface PendingEvaluation {
  id: string
  meal_id: number
  rating: number
  liked: boolean
  had_waste: boolean
  createdAt: string
}

type SyncListener = (count: number) => void

const listeners: SyncListener[] = []

function notify() {
  const count = getPendingCount()
  listeners.forEach(fn => fn(count))
}

export function onQueueChange(fn: SyncListener): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}

export function getPendingQueue(): PendingEvaluation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getPendingCount(): number {
  return getPendingQueue().length
}

export function enqueueOffline(data: Omit<PendingEvaluation, 'id' | 'createdAt'>): void {
  const queue = getPendingQueue()
  queue.push({
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  notify()
}

function dequeue(id: string): void {
  const queue = getPendingQueue().filter(item => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  notify()
}

export function isOnline(): boolean {
  return navigator.onLine
}

// Tenta sincronizar todos os itens pendentes com o servidor
export async function syncPendingEvaluations(
  submitFn: (data: Omit<PendingEvaluation, 'id' | 'createdAt'>) => Promise<unknown>
): Promise<{ synced: number; failed: number }> {
  const queue = getPendingQueue()
  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      await submitFn({
        meal_id:   item.meal_id,
        rating:    item.rating,
        liked:     item.liked,
        had_waste: item.had_waste,
      })
      dequeue(item.id)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

// Inicia listener de reconexão para sincronização automática
export function startAutoSync(
  submitFn: (data: Omit<PendingEvaluation, 'id' | 'createdAt'>) => Promise<unknown>,
  onResult?: (result: { synced: number; failed: number }) => void
): () => void {
  const handler = async () => {
    if (getPendingCount() > 0) {
      const result = await syncPendingEvaluations(submitFn)
      onResult?.(result)
    }
  }

  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
