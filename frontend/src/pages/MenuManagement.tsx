import { useEffect, useState } from 'react'
import { mealsApi, type Meal } from '../services/api'

const CATEGORIES = ['Proteínas', 'Frutas', 'Verduras', 'Carboidratos', 'Laticínios', 'Outros']

export default function MenuManagement() {
  const [meals, setMeals]         = useState<Meal[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Meal | null>(null)
  const [form, setForm]           = useState({ name: '', category: '', description: '' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  async function load() {
    try {
      const res = await mealsApi.getAll()
      setMeals(res.data.meals)
    } catch { setMsg('Erro ao carregar dados.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', category: '', description: '' })
    setShowModal(true)
  }

  function openEdit(meal: Meal) {
    setEditing(meal)
    setForm({ name: meal.name, category: meal.category, description: meal.description })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.category) return
    setSaving(true)
    try {
      if (editing) await mealsApi.update(editing.id, form)
      else         await mealsApi.create(form)
      setShowModal(false)
      await load()
      setMsg(editing ? 'Refeição atualizada.' : 'Refeição adicionada.')
    } catch { setMsg('Erro ao salvar.') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remover "${name}"?`)) return
    try {
      await mealsApi.remove(id)
      await load()
      setMsg(`"${name}" removida.`)
    } catch { setMsg('Erro ao remover.') }
    finally { setTimeout(() => setMsg(''), 3000) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-800">Cardápio</h1>
          <p className="text-gray-500 text-sm mt-1">Adicione e gerencie as refeições cadastradas.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nova Refeição</button>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl text-sm font-medium">{msg}</div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-700">Refeições Cadastradas</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-100 rounded-lg" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="font-medium text-gray-500">Nenhuma refeição cadastrada.</p>
            <p className="text-sm mt-1">Clique em "+ Nova Refeição" para começar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Nome', 'Categoria', 'Descrição', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, i) => (
                <tr key={meal.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{meal.name}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-100 text-brand-700">{meal.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{meal.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(meal)} className="btn-secondary text-xs px-3 py-1.5">Editar</button>
                      <button onClick={() => handleDelete(meal.id, meal.name)} className="btn-danger">Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{editing ? 'Editar Refeição' : 'Nova Refeição'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input className="input" placeholder="Ex: Frango com Arroz" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select className="input" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea className="input resize-none" rows={2} placeholder="Descrição opcional"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
