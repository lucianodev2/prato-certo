/**
 * PILHA (Stack) — LIFO: Last In, First Out
 *
 * Usada no frontend para histórico local de ações antes de enviar ao servidor.
 * Permite exibir o estado da pilha na tela de Gerenciamento de Cardápio.
 */
export class Stack<T> {
  private items: T[] = [];
  private maxSize: number;

  constructor(maxSize = 10) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    if (this.items.length >= this.maxSize) this.items.shift();
    this.items.push(item);
  }

  pop(): T | null {
    return this.items.pop() ?? null;
  }

  peek(): T | null {
    return this.items[this.items.length - 1] ?? null;
  }

  isEmpty(): boolean { return this.items.length === 0; }
  size(): number     { return this.items.length; }
  toArray(): T[]     { return [...this.items].reverse(); }
}
