const express = require('express');
const router  = express.Router();
const { getDb, persist, rows, run } = require('../database');
const Queue = require('../structures/Queue');

const feedbackQueue = new Queue();

// GET /api/evaluations/queue/status — ANTES de /:id
router.get('/queue/status', (_req, res) => {
  res.json({ size: feedbackQueue.size(), front: feedbackQueue.front(), isEmpty: feedbackQueue.isEmpty(), items: feedbackQueue.toArray() });
});

// GET /api/evaluations
router.get('/', async (_req, res) => {
  const db   = await getDb();
  const data = rows(db, `
    SELECT e.*, m.name AS meal_name, m.category AS meal_category
    FROM evaluations e
    JOIN meals m ON e.meal_id = m.id
    ORDER BY e.id DESC
    LIMIT 50
  `);
  res.json({ evaluations: data });
});

// POST /api/evaluations
router.post('/', async (req, res) => {
  const { meal_id, rating, liked = true, had_waste = false } = req.body;
  if (!meal_id || !rating) return res.status(400).json({ error: 'meal_id e rating são obrigatórios' });

  const feedback = { meal_id, rating, liked: liked ? 1 : 0, had_waste: had_waste ? 1 : 0, ts: Date.now() };

  feedbackQueue.enqueue(feedback);
  const toProcess = feedbackQueue.dequeue();
  if (!toProcess) return res.status(500).json({ error: 'Erro na fila' });

  const now  = new Date();
  const day  = now.getDay();
  const week = Math.ceil(now.getDate() / 7);

  const db = await getDb();
  const result = run(db,
    'INSERT INTO evaluations (meal_id, rating, liked, had_waste, day_of_week, week_number) VALUES (?, ?, ?, ?, ?, ?)',
    [toProcess.meal_id, toProcess.rating, toProcess.liked, toProcess.had_waste, day, week]
  );
  persist();

  res.status(201).json({ message: 'Avaliação registrada!', id: result.lastInsertRowid, queueSize: feedbackQueue.size() });
});

module.exports = router;
