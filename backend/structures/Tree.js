/**
 * ÁRVORE (Tree) — Estrutura hierárquica de nós
 *
 * Uso no sistema: categorias de alimentos organizadas em hierarquia.
 * A raiz é "Alimentação Escolar"; os filhos são grupos (Frutas, Verduras…);
 * as folhas são os alimentos específicos.
 *
 * Algoritmo de busca: DFS (Depth-First Search / Busca em Profundidade).
 */
class TreeNode {
  constructor(id, name, icon = '') {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.children = [];
  }

  addChild(node) {
    this.children.push(node);
    return this;
  }
}

class FoodTree {
  constructor() {
    this.root = new TreeNode(0, 'Alimentação Escolar', '🍽️');
    this._build();
  }

  _build() {
    const frutas = new TreeNode(1, 'Frutas', '🍎');
    frutas.addChild(new TreeNode(11, 'Banana', '🍌'));
    frutas.addChild(new TreeNode(12, 'Maçã', '🍎'));
    frutas.addChild(new TreeNode(13, 'Laranja', '🍊'));

    const verduras = new TreeNode(2, 'Verduras', '🥦');
    verduras.addChild(new TreeNode(21, 'Alface', '🥬'));
    verduras.addChild(new TreeNode(22, 'Tomate', '🍅'));
    verduras.addChild(new TreeNode(23, 'Cenoura', '🥕'));

    const proteinas = new TreeNode(3, 'Proteínas', '🍗');
    proteinas.addChild(new TreeNode(31, 'Frango', '🍗'));
    proteinas.addChild(new TreeNode(32, 'Feijão', '🫘'));
    proteinas.addChild(new TreeNode(33, 'Ovo', '🥚'));

    const carbs = new TreeNode(4, 'Carboidratos', '🍚');
    carbs.addChild(new TreeNode(41, 'Arroz', '🍚'));
    carbs.addChild(new TreeNode(42, 'Macarrão', '🍝'));
    carbs.addChild(new TreeNode(43, 'Pão', '🍞'));

    this.root.addChild(frutas);
    this.root.addChild(verduras);
    this.root.addChild(proteinas);
    this.root.addChild(carbs);
  }

  toJSON() { return this.root; }

  findById(id, node = this.root) {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findById(id, child);
      if (found) return found;
    }
    return null;
  }
}

module.exports = { FoodTree, TreeNode };
