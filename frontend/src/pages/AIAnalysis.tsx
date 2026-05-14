import { useState } from 'react'
import { analysisApi } from '../services/api'
import type { AIAnalysis, AIInsight, AIAlert, AISuggestion, AITrend } from '../services/api'

function severityColor(s: AIAlert['severity']) {
  return s === 'high' ? 'border-red-300 bg-red-50 text-red-800'
    : s === 'medium' ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
    : 'border-blue-300 bg-blue-50 text-blue-800'
}

function priorityColor(p: AISuggestion['priority']) {
  return p === 'alta' ? 'bg-red-100 text-red-700'
    : p === 'média' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700'
}

function trendColor(d: AITrend['direction']) {
  return d === 'up' ? 'text-green-600' : d === 'down' ? 'text-red-600' : 'text-yellow-600'
}

function trendArrow(d: AITrend['direction']) {
  return d === 'up' ? '↑' : d === 'down' ? '↓' : '→'
}

function insightBorder(t: AIInsight['type']) {
  return t === 'positive' ? 'border-l-green-400'
    : t === 'negative' ? 'border-l-red-400'
    : 'border-l-blue-400'
}

export default function AIAnalysis() {
  const [analysis, setAnalysis]   = useState<AIAnalysis | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await analysisApi.generate()
      setAnalysis(data)
      setGenerated(true)
    } catch {
      setError('Não foi possível gerar a análise. Verifique se o servidor está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = analysis
    ? new Date(analysis.generatedAt).toLocaleString('pt-BR')
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🤖</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análise Inteligente da Alimentação</h1>
            <p className="text-gray-500 text-sm">Motor de análise baseado em regras sobre os dados coletados</p>
          </div>
        </div>

        {/* Painel explicativo */}
        <div className="mt-4 bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800">
          <p className="font-semibold mb-1">📚 Como funciona a IA?</p>
          <p>O sistema coleta avaliações dos alunos, aplica regras de análise sobre os dados e gera
            insights automáticos — identificando refeições rejeitadas, dias com mais desperdício,
            tendências alimentares e sugerindo melhorias no cardápio.</p>
        </div>
      </div>

      {/* Botão principal */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60
                     text-white font-semibold rounded-xl shadow-md transition-all text-lg"
        >
          {loading ? (
            <>
              <span className="animate-spin text-xl">⚙️</span>
              Analisando dados...
            </>
          ) : (
            <>
              <span className="text-xl">🔍</span>
              {generated ? 'Gerar nova análise' : 'Gerar análise'}
            </>
          )}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Resultados */}
      {analysis && (
        <div className="space-y-6">
          {/* Resumo geral */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> Resumo da Análise
              </h2>
              <span className="text-xs text-gray-400">Gerado em {formattedDate}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-brand-700">{analysis.overview.totalEvaluations}</p>
                <p className="text-xs text-gray-500">Avaliações</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{analysis.overview.averageRating}</p>
                <p className="text-xs text-gray-500">Nota média</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-orange-600">{analysis.overview.wastePercentage}%</p>
                <p className="text-xs text-gray-500">Desperdício</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-700">{analysis.overview.totalMeals}</p>
                <p className="text-xs text-gray-500">Refeições</p>
              </div>
            </div>
          </div>

          {/* Tendências */}
          {analysis.trends.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span>📈</span> Tendências Identificadas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.trends.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{t.label}</p>
                      <p className={`text-sm font-semibold ${trendColor(t.direction)}`}>
                        {trendArrow(t.direction)} {t.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertas */}
          {analysis.alerts.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span>🚨</span> Alertas de Atenção
              </h2>
              <div className="space-y-2">
                {analysis.alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${severityColor(a.severity)}`}>
                    <span className="text-lg mt-0.5">{a.icon}</span>
                    <p className="text-sm">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights por refeição */}
          {analysis.insights.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span>💡</span> Insights por Refeição
              </h2>
              <div className="space-y-3">
                {analysis.insights.map((ins, i) => (
                  <div key={i} className={`border-l-4 pl-4 py-2 ${insightBorder(ins.type)}`}>
                    <p className="text-sm font-semibold text-gray-800">
                      {ins.icon} {ins.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{ins.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões */}
          {analysis.suggestions.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span>✨</span> Sugestões de Melhoria
              </h2>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800">{s.action}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(s.priority)}`}>
                          {s.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sem dados */}
          {analysis.insights.length === 0 && analysis.alerts.length === 0 && (
            <div className="card p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">📭</span>
              <p>Dados insuficientes para gerar análises detalhadas.</p>
              <p className="text-sm mt-1">Registre mais avaliações e tente novamente.</p>
            </div>
          )}

          {/* Nota acadêmica */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-600 mb-1">🎓 Nota técnica (acadêmica)</p>
            <p>
              Motor: <strong>{analysis.engine === 'rule-based' ? 'rule-based engine' : `Groq API — ${analysis.engine}`}</strong>
              {analysis.engine === 'rule-based'
                ? ' — analisa vetores de avaliações e aplica regras sobre médias, desperdício e frequências.'
                : ' — o resumo foi gerado por IA (LLaMA 3.1) com base nos dados calculados pelo motor de regras.'}
              {' '}Insights, alertas, tendências e sugestões sempre calculados pelo motor de regras local.
            </p>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {!analysis && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <span className="text-6xl block mb-4">🧠</span>
          <p className="text-lg font-medium text-gray-500">Clique em "Gerar análise" para começar</p>
          <p className="text-sm mt-1">O sistema irá analisar todas as avaliações registradas</p>
        </div>
      )}
    </div>
  )
}
