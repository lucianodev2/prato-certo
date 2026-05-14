import { useEffect, useState } from 'react'
import { mealsApi, statsApi, type Meal } from '../services/api'
import TreeView from '../components/TreeView'
import type { TreeNode } from '../structures/Tree'

interface StackEntry { type: string; meal?: any; before?: any; after?: any }

const CATEGORIES = ['Proteínas', 'Frutas', 'Verduras', 'Carboidratos', 'Laticínios', 'Outros']

export default function MenuManagement() {
  const [meals, setMeals]         = useState<Meal[]>([])
  const [stack, setStack]         = useState<StackEntry[]>([])
  const [tree, setTree]           = useState<TreeNode | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Meal | null>(null)
  const [form, setForm]           = useState({ name: '', category: '', description: '' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  async function load() {
    try {
      const [mealsRes, stackRes, treeRes] = await Promise.all([
        mealsApi.getAll(),
        mealsApi.getStack(),
        statsApi.getTree(),
      ])
      setMeals(mealsRes.data.meals)
      setStack(stackRes.data.stack)
      setTree(treeRes.data.tree)
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

  async function handleUndo() {
    try {
      const res = await mealsApi.undo()
      await load()
      setMsg((res.data as any).message)
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Nada para desfazer.')
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const actionTypeLabel: Record<string, string> = {
    CREATE: '➕ Adicionou', UPDATE: '✏️ Editou', DELETE: '🗑️ Removeu',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-800">Gerenciamento de Cardápio</h1>
          <p className="text-gray-500 text-sm mt-1">Adicione, edite e remova refeições do cardápio.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nova Refeição</button>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl text-sm font-medium">{msg}</div>
      )}

      {/* Info pilha */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
        <strong>Estrutura: Pilha (Stack)</strong> — cada ação (criar/editar/remover) é empilhada.
        O botão "Desfazer" faz pop() na pilha e reverte a última operação (LIFO).
      </div>

      {/* Meals table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">Refeições Cadastradas</h2>
          <span className="badge bg-brand-100 text-brand-700">Vetor: {meals.length} item{meals.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-100 rounded-lg" />)}
          </div>
        ) : meals.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm text-center">Nenhuma refeição cadastrada.</p>
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

      {/* Stack panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-700">Histórico de Ações (Pilha)</h2>
          <button onClick={handleUndo} disabled={stack.length === 0} className="btn-secondary text-sm disabled:opacity-40">
            ↩ Desfazer
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          As ações mais recentes aparecem no topo — princípio LIFO (Last In, First Out).
        </p>
        {stack.length === 0 ? (
          <p className="text-sm text-gray-400">Pilha vazia. Faça uma alteração no cardápio.</p>
        ) : (
          <div className="space-y-2">
            {stack.map((entry, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                {i === 0 && <span className="text-xs font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">TOPO</span>}
                <span className="text-sm font-medium text-gray-700">
                  {actionTypeLabel[entry.type] ?? entry.type}
                </span>
                <span className="text-sm text-gray-500">
                  {entry.meal?.name || entry.before?.name || entry.after?.name || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tree view */}
      {tree && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-2">Categorias de Alimentos (Árvore)</h2>
          <TreeView tree={tree} />
        </div>
      )}

      {/* Modal */}
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
                  <option value="">Selecione…</option>
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
                  {saving ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
