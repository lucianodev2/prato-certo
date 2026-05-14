import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { statsApi, evaluationsApi, type Overview, type Evaluation } from '../services/api'
import { getPendingCount, onQueueChange, isOnline } from '../services/offlineSync'

export default function Home() {
  const [overview, setOverview]     = useState<Overview | null>(null)
  const [recent, setRecent]         = useState<Evaluation[]>([])
  const [loading, setLoading]       = useState(true)
  const [pendingCount, setPendingCount] = useState(getPendingCount)
  const [online, setOnline]         = useState(isOnline)

  useEffect(() => {
    Promise.all([statsApi.getOverview(), evaluationsApi.getAll()])
      .then(([ov, ev]) => {
        setOverview(ov.data)
        setRecent(ev.data.evaluations.slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    const unsub = onQueueChange(setPendingCount)
    const handleOnline  = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      unsub()
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Banner offline */}
      {!online && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          🔴 <span><strong>Modo offline.</strong> As avaliações serão salvas localmente e sincronizadas quando a conexão voltar.</span>
        </div>
      )}
      {online && pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-700 text-sm">
          🟡 <span><strong>{pendingCount}</strong> avaliação(ões) salva(s) offline aguardando sincronização automática…</span>
        </div>
      )}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-8 py-12">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <span>🌱</span> ODS 4 — Educação de Qualidade
          </div>
          <h1 className="text-4xl font-extrabold mb-3">PratoCerto Escolar</h1>
          <p className="text-white/85 max-w-lg text-lg mb-2">
            Plataforma inteligente de análise da alimentação escolar.
          </p>
          <p className="text-white/70 text-sm max-w-lg mb-6">
            Coleta avaliações · Funciona offline · Analisa com IA · Gera recomendações
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/avaliar"   className="bg-white text-brand-700 font-bold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">⭐ Avaliar Refeição</Link>
            <Link to="/analise"   className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">🤖 Análise IA</Link>
            <Link to="/dashboard" className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">📊 Dashboard</Link>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[120px] opacity-20 select-none hidden lg:block">🍽️</div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Avaliações" value={overview.totalEvaluations} icon="📊" color="green" sub="no total" />
          <StatCard label="Nota Média"  value={`${overview.averageRating}★`} icon="⭐" color="blue"   sub="de 5 estrelas" />
          <StatCard label="Desperdício" value={`${overview.wastePercentage}%`} icon="🗑️" color="orange" sub="dos alunos" />
          <StatCard label="Refeições"  value={overview.totalMeals} icon="🥘" color="green" sub="cadastradas" />
        </div>
      )}

      {/* Feature cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/avaliar',   icon: '📝', title: 'Avaliação',           desc: 'Feedbacks em Fila (Queue) com suporte offline e sincronização automática.' },
          { to: '/analise',   icon: '🤖', title: 'Análise IA',          desc: 'Motor inteligente que gera insights, alertas e sugestões do cardápio.' },
          { to: '/dashboard', icon: '📈', title: 'Dashboard',           desc: 'Gráficos e Matriz de notas por semana/dia com estatísticas visuais.' },
          { to: '/cardapio',  icon: '🥗', title: 'Cardápio',            desc: 'Gestão de refeições com histórico de Pilha (Stack) para desfazer ações.' },
        ].map(card => (
          <Link key={card.to} to={card.to} className="card hover:border-brand-300 hover:shadow-md transition-all group">
            <div className="text-4xl mb-3">{card.icon}</div>
            <h3 className="font-bold text-brand-800 text-base mb-1 group-hover:text-brand-600">{card.title}</h3>
            <p className="text-gray-500 text-xs">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Fluxo do sistema */}
      <div className="card mb-8">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span>🔄</span> Fluxo do Sistema
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { icon: '⭐', label: 'Aluno avalia' },
            { icon: '💾', label: 'Salvo localmente' },
            { icon: '🌐', label: 'Sincroniza online' },
            { icon: '📤', label: 'Enviado ao servidor' },
            { icon: '🤖', label: 'IA analisa' },
            { icon: '💡', label: 'Gera recomendações' },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span>{step.icon}</span>
                <span className="text-gray-600 font-medium">{step.label}</span>
              </div>
              {i < arr.length - 1 && <span className="text-gray-300 font-bold">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent evaluations */}
      {recent.length > 0 && (
        <div className="card mb-8">
          <h2 className="font-bold text-gray-700 mb-4">🕐 Avaliações Recentes</h2>
          <div className="space-y-2">
            {recent.map(ev => (
              <div key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-800">{ev.meal_name}</p>
                  <p className="text-xs text-gray-400">{ev.meal_category}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-yellow-500 text-sm">{'★'.repeat(ev.rating)}{'☆'.repeat(5 - ev.rating)}</span>
                  <span className={`badge ${ev.liked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {ev.liked ? '👍' : '👎'}
                  </span>
                  {ev.had_waste === 1 && <span className="badge bg-orange-100 text-orange-600">🗑️</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer acadêmico */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Projeto acadêmico — Disciplina de Estrutura de Dados · ODS 4 Educação de Qualidade 🌍
      </div>
    </div>
  )
}
