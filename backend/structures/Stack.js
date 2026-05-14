/**
 * PILHA (Stack) — Princípio LIFO: Last In, First Out
 *
 * Uso no sistema: histórico de ações do cardápio (undo/desfazer).
 * Cada vez que o admin cria, edita ou remove uma refeição, a ação é
 * empilhada. O botão "Desfazer" faz pop() e reverte a operação.
 */
class Stack {
  constructor(maxSize = 20) {
    this.items = [];
    this.maxSize = maxSize;
  }

  push(item) {
    if (this.items.length >= this.maxSize) this.items.shift();
    this.items.push(item);
  }

  pop() {
    return this.isEmpty() ? null : this.items.pop();
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.items.length - 1];
  }

  isEmpty() { return this.items.length === 0; }
  size()    { return this.items.length; }

  toArray() { return [...this.items].reverse(); }
}

module.exports = Stack;
