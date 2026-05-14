/**
 * FILA (Queue) — FIFO: First In, First Out
 *
 * Usada para simular visualmente o fluxo de feedbacks pendentes.
 * O aluno preenche a avaliação → enqueue → o sistema processa → dequeue → salva.
 */
export class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void { this.items.push(item); }

  dequeue(): T | null { return this.items.shift() ?? null; }

  front(): T | null   { return this.items[0] ?? null; }
  isEmpty(): boolean  { return this.items.length === 0; }
  size(): number      { return this.items.length; }
  toArray(): T[]      { return [...this.items]; }
}
