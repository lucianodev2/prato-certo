import { useEffect, useState } from 'react'
import { mealsApi, evaluationsApi, type Meal } from '../services/api'
import { Queue } from '../structures/Queue'
import RatingStars from '../components/RatingStars'
import {
  isOnline,
  enqueueOffline,
  getPendingCount,
  syncPendingEvaluations,
  onQueueChange,
} from '../services/offlineSync'

type Step = 'form' | 'queuing' | 'processing' | 'done' | 'offline_saved' | 'error'

interface PendingFeedback {
  meal_id: number
  meal_name: string
  rating: number
  liked: boolean
  had_waste: boolean
}

const visualQueue = new Queue<PendingFeedback>()

export default function Evaluation() {
  const [meals, setMeals]               = useState<Meal[]>([])
  const [selected, setSelected]         = useState<Meal | null>(null)
  const [rating, setRating]             = useState(0)
  const [liked, setLiked]               = useState<boolean | null>(null)
  const [hadWaste, setHadWaste]         = useState(false)
  const [step, setStep]                 = useState<Step>('form')
  const [queueItems, setQueueItems]     = useState<PendingFeedback[]>([])
  const [loading, setLoading]           = useState(true)
  const [pendingCount, setPendingCount] = useState(getPendingCount)
  const [syncMsg, setSyncMsg]           = useState<string | null>(null)

  useEffect(() => {
    mealsApi.getAll()
      .then(r => setMeals(r.data.meals))
      .catch(console.error)
      .finally(() => setLoading(false))

    const unsub = onQueueChange(setPendingCount)

    async function handleOnline() {
      const pending = getPendingCount()
      if (pending > 0) {
        const result = await syncPendingEvaluations(data =>
          evaluationsApi.create({ ...data }).then(() => {})
        )
        if (result.synced > 0) {
          setSyncMsg(`${result.synced} avaliação(ões) sincronizada(s) com sucesso.`)
          setTimeout(() => setSyncMsg(null), 4000)
        }
      }
    }

    window.addEventListener('online', handleOnline)
    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const canSubmit = selected && rating > 0 && liked !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const feedback: PendingFeedback = {
      meal_id:   selected!.id,
      meal_name: selected!.name,
      rating,
      liked:     liked!,
      had_waste: hadWaste,
    }

    visualQueue.enqueue(feedback)
    setQueueItems(visualQueue.toArray())
    setStep('queuing')
    await delay(900)

    setStep('processing')
    await delay(800)

    if (!isOnline()) {
      enqueueOffline({ meal_id: feedback.meal_id, rating: feedback.rating, liked: feedback.liked, had_waste: feedback.had_waste })
      visualQueue.dequeue()
      setQueueItems(visualQueue.toArray())
      setStep('offline_saved')
      return
    }

    try {
      await evaluationsApi.create({ meal_id: feedback.meal_id, rating: feedback.rating, liked: feedback.liked, had_waste: feedback.had_waste })
      visualQueue.dequeue()
      setQueueItems(visualQueue.toArray())
      setStep('done')
    } catch {
      enqueueOffline({ meal_id: feedback.meal_id, rating: feedback.rating, liked: feedback.liked, had_waste: feedback.had_waste })
      visualQueue.dequeue()
      setQueueItems(visualQueue.toArray())
      setStep('offline_saved')
    }
  }

  function reset() {
    setSelected(null); setRating(0); setLiked(null); setHadWaste(false); setStep('form')
  }

  if (step === 'queuing' || step === 'processing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card">
          {step === 'queuing' ? (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-brand-700 mb-2">Adicionando à Fila...</h2>
              <p className="text-gray-500 text-sm mb-4">Seu feedback está sendo processado.</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-brand-700 mb-2">Processando...</h2>
              <p className="text-gray-500 text-sm mb-4">Salvando sua avaliação...</p>
            </>
          )}
          <QueueVisual items={queueItems} />
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-700 mb-2">Avaliação Registrada!</h2>
          <p className="text-gray-500 text-sm mb-6">Obrigado pelo feedback. Sua opinião ajuda a melhorar a merenda escolar.</p>
          <button onClick={reset} className="btn-primary">Fazer Nova Avaliação</button>
        </div>
      </div>
    )
  }

  if (step === 'offline_saved') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Salvo Offline</h2>
          <p className="text-gray-600 text-sm mb-3">
            Sem conexão com a internet. Sua avaliação foi salva localmente e será enviada automaticamente quando a conexão voltar.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-700">
            {pendingCount} avaliação(ões) aguardando sincronização
          </div>
          <button onClick={reset} className="btn-primary">Fazer Nova Avaliação</button>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao registrar</h2>
          <p className="text-gray-500 text-sm mb-6">Verifique se o backend está rodando em localhost:3001.</p>
          <button onClick={reset} className="btn-secondary">Tentar novamente</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brand-800">Avaliar Refeição</h1>
        <p className="text-gray-500 text-sm mt-1">Selecione a refeição de hoje e compartilhe sua opinião.</p>
      </div>

      {syncMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {syncMsg}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          <strong>{pendingCount}</strong> avaliação(ões) salva(s) offline aguardando sincronização
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">1. Qual refeição você está avaliando?</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Carregando refeições...</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {meals.map(meal => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => setSelected(meal)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    selected?.id === meal.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800">{meal.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{meal.category}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">2. Qual nota você dá?</h2>
          <div className="flex flex-col items-start gap-2">
            <RatingStars value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="text-sm text-gray-500">
                {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">3. Você gostou da refeição?</h2>
          <div className="flex gap-3">
            <button type="button" onClick={() => setLiked(true)}
              className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all ${liked === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}>
              Gostei
            </button>
            <button type="button" onClick={() => setLiked(false)}
              className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all ${liked === false ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 hover:border-red-300'}`}>
              Não gostei
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">4. Houve desperdício?</h2>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setHadWaste(w => !w)}
              className={`w-12 h-6 rounded-full transition-colors ${hadWaste ? 'bg-orange-400' : 'bg-gray-300'} relative`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${hadWaste ? 'left-6' : 'left-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">
              {hadWaste ? 'Sim, deixei comida no prato' : 'Não, comi tudo'}
            </span>
          </label>
        </div>

        <button type="submit" disabled={!canSubmit} className="btn-primary w-full py-3 text-base">
          {isOnline() ? 'Enviar Avaliação' : 'Salvar Offline'}
        </button>
      </form>
    </div>
  )
}

function QueueVisual({ items }: { items: PendingFeedback[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">Fila vazia.</p>
  return (
    <div className="mt-4 space-y-1 text-left">
      <p className="text-xs font-semibold text-gray-500 uppercase">Fila ({items.length} item{items.length > 1 ? 's' : ''})</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded-lg">
          <span className="font-bold text-blue-400">[{i + 1}]</span>
          <span>{item.meal_name}</span>
          <span>— {item.rating}★</span>
        </div>
      ))}
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
