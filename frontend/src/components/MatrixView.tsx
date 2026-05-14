import type { MatrixCell } from '../services/api'

interface Props {
  matrix: MatrixCell[][]
}

const DAYS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']

function ratingColor(avg: number): string {
  if (avg === 0)  return '#e5e7eb'
  if (avg < 2)    return '#fca5a5'
  if (avg < 3)    return '#fdba74'
  if (avg < 4)    return '#fde68a'
  return '#86efac'
}

export default function MatrixView({ matrix }: Props) {
  return (
    <div className="overflow-x-auto">
      {/* Legenda da estrutura */}
      <p className="text-xs text-gray-500 mb-3">
        <span className="font-semibold text-brand-700">Matriz</span> — linhas = semanas do mês, colunas = dias da semana.
        Cada célula guarda a média das notas (0 = sem avaliações).
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-24 text-left text-gray-400 text-xs pb-2"></th>
            {DAYS.map(d => (
              <th key={d} className="text-center text-xs font-semibold text-gray-500 pb-2 px-1">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((week, wi) => (
            <tr key={wi}>
              <td className="text-xs text-gray-400 pr-2 py-1">{WEEKS[wi]}</td>
              {week.map((cell, di) => (
                <td key={di} className="px-1 py-1">
                  <div
                    className="rounded-lg flex flex-col items-center justify-center h-12 w-full font-semibold text-sm transition-transform hover:scale-105 cursor-default"
                    style={{ backgroundColor: ratingColor(cell.avg) }}
                    title={cell.count > 0 ? `${cell.avg} estrelas (${cell.count} avaliações)` : 'Sem avaliações'}
                  >
                    {cell.count > 0 ? (
                      <>
                        <span className="text-gray-800">{cell.avg.toFixed(1)}</span>
                        <span className="text-gray-500 text-[10px]">{cell.count}x</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>Legenda:</span>
        {[['#fca5a5','1–2'],['#fdba74','2–3'],['#fde68a','3–4'],['#86efac','4–5']].map(([bg, lbl]) => (
          <span key={lbl} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: bg }} />
            {lbl}
          </span>
        ))}
      </div>
    </div>
  )
}
