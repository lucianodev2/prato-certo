/**
 * ÁRVORE — Estrutura hierárquica de nós
 *
 * Representa categorias de alimentos em níveis: raiz → grupos → folhas.
 * Visualizada com componente TreeView na tela de Cardápio.
 */
export interface TreeNode {
  id: number;
  name: string;
  icon: string;
  children: TreeNode[];
}

export function buildFoodTree(): TreeNode {
  return {
    id: 0, name: 'Alimentação Escolar', icon: '🍽️',
    children: [
      {
        id: 1, name: 'Frutas', icon: '🍎',
        children: [
          { id: 11, name: 'Banana',  icon: '🍌', children: [] },
          { id: 12, name: 'Maçã',   icon: '🍎', children: [] },
          { id: 13, name: 'Laranja', icon: '🍊', children: [] },
        ],
      },
      {
        id: 2, name: 'Verduras', icon: '🥦',
        children: [
          { id: 21, name: 'Alface',  icon: '🥬', children: [] },
          { id: 22, name: 'Tomate',  icon: '🍅', children: [] },
          { id: 23, name: 'Cenoura', icon: '🥕', children: [] },
        ],
      },
      {
        id: 3, name: 'Proteínas', icon: '🍗',
        children: [
          { id: 31, name: 'Frango', icon: '🍗', children: [] },
          { id: 32, name: 'Feijão', icon: '🫘', children: [] },
          { id: 33, name: 'Ovo',   icon: '🥚', children: [] },
        ],
      },
      {
        id: 4, name: 'Carboidratos', icon: '🍚',
        children: [
          { id: 41, name: 'Arroz',    icon: '🍚', children: [] },
          { id: 42, name: 'Macarrão', icon: '🍝', children: [] },
          { id: 43, name: 'Pão',      icon: '🍞', children: [] },
        ],
      },
    ],
  };
}
