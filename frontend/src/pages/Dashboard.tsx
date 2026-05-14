import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import MatrixView from '../components/MatrixView'
import { statsApi, type Overview, type MealStats, type MatrixCell } from '../services/api'

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [mealStats, setMealStats] = useState<MealStats[]>([])
  const [matrix, setMatrix]       = useState<MatrixCell[][]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([statsApi.getOverview(), statsApi.getMealsStats(), statsApi.getMatrix()])
      .then(([ov, ms, mx]) => {
        setOverview(ov.data)
        setMealStats(ms.data.stats)
        setMatrix(mx.data.matrix)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899']

  const wasteData = overview ? [
    { name: 'Sem Desperdício', value: parseFloat((100 - overview.wastePercentage).toFixed(1)) },
    { name: 'Com Desperdício', value: overview.wastePercentage },
  ] : []

  const barData = mealStats
    .filter(m => m.total_evals > 0)
    .map(m => ({ name: m.name.split(' ').slice(0, 2).join(' '), aprovacao: m.approval_rate, nota: m.avg_rating }))

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      <div>
        <h1 className="text-2xl font-extrabold text-brand-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Estatísticas de aceitação da merenda escolar.</p>
      </div>

      {/* Info vetores */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <strong>Estrutura: Vetores (Arrays)</strong> — todas as estatísticas são calculadas iterando sobre vetores de avaliações.
        A busca, inserção e média utilizam operações sobre esses vetores.
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total de Avaliações" value={overview.totalEvaluations} icon="📊" color="green" />
          <StatCard label="Nota Média"           value={`${overview.averageRating}★`} icon="⭐" color="blue" />
          <StatCard label="Índice Desperdício"   value={`${overview.wastePercentage}%`} icon="🗑️" color="orange" />
          <StatCard label="Refeições"            value={overview.totalMeals} icon="🥘" color="green" />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Bar chart */}
        <div className="card lg:col-span-3">
          <h2 className="font-bold text-gray-700 mb-4">Taxa de Aprovação por Refeição</h2>
          {barData.length === 0 ? (
            <p className="text-gray-400 text-sm">Ainda sem avaliações. <a href="/avaliar" className="text-brand-600 underline">Avalie uma refeição.</a></p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Aprovação']} />
                <Bar dataKey="aprovacao" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-bold text-gray-700 mb-4">Índice de Desperdício</h2>
          {overview?.totalEvaluations === 0 ? (
            <p className="text-gray-400 text-sm">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={wasteData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  <Cell fill="#22c55e" />
                  <Cell fill="#f97316" />
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ranking */}
      {mealStats.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">Ranking das Refeições</h2>
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-semibold text-brand-700">Vetor ordenado</span> — as refeições são armazenadas em um vetor e ordenadas pela nota média (decrescente).
          </p>
          <div className="space-y-2">
            {mealStats.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className={`font-bold text-lg w-8 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.category} · {m.total_evals} avaliações</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{m.avg_rating}★</p>
                  <p className="text-xs text-gray-400">{m.approval_rate}% aprovação</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix */}
      {matrix.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-2">Matriz de Notas — Semana × Dia</h2>
          <MatrixView matrix={matrix} />
        </div>
      )}
    </div>
  )
}
