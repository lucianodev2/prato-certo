import { useState } from 'react'
import type { TreeNode } from '../structures/Tree'

interface NodeProps {
  node: TreeNode
  depth: number
}

function TreeNodeItem({ node, depth }: NodeProps) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <button
        type="button"
        onClick={() => hasChildren && setOpen(o => !o)}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg w-full text-left transition-colors ${
          hasChildren ? 'hover:bg-brand-50 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className="text-lg">{node.icon}</span>
        <span className={`text-sm ${depth === 0 ? 'font-bold text-brand-800' : depth === 1 ? 'font-semibold text-brand-700' : 'text-gray-600'}`}>
          {node.name}
        </span>
        {hasChildren && (
          <span className="ml-auto text-gray-400 text-xs">{open ? '▼' : '▶'}</span>
        )}
      </button>

      {open && hasChildren && (
        <div className="border-l-2 border-brand-100 ml-4">
          {node.children.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  tree: TreeNode
}

export default function TreeView({ tree }: Props) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        <span className="font-semibold text-brand-700">Árvore</span> — hierarquia de categorias.
        Clique nos grupos para expandir ou recolher os nós filhos.
      </p>
      <div className="bg-brand-50 rounded-xl p-3">
        <TreeNodeItem node={tree} depth={0} />
      </div>
    </div>
  )
}
