/**
 * FILA (Queue) — Princípio FIFO: First In, First Out
 *
 * Uso no sistema: feedbacks aguardando processamento.
 * O aluno envia a avaliação → ela entra na fila (enqueue).
 * O sistema processa a primeira da fila (dequeue) e salva no banco.
 */
class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) { this.items.push(item); }

  dequeue() {
    return this.isEmpty() ? null : this.items.shift();
  }

  front()   { return this.isEmpty() ? null : this.items[0]; }
  isEmpty() { return this.items.length === 0; }
  size()    { return this.items.length; }
  toArray() { return [...this.items]; }
}

module.exports = Queue;
