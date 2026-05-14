const express = require('express');
const router  = express.Router();
const { getDb, persist, rows, row, run } = require('../database');
const Stack = require('../structures/Stack');

const actionStack = new Stack(20);

// GET /api/meals/stack/history  — ANTES de /:id
router.get('/stack/history', (_req, res) => {
  res.json({ stack: actionStack.toArray(), size: actionStack.size(), peek: actionStack.peek() });
});

// POST /api/meals/undo/last — ANTES de /:id
router.post('/undo/last', async (req, res) => {
  const action = actionStack.pop();
  if (!action) return res.status(400).json({ error: 'Nada para desfazer' });

  const db = await getDb();

  if (action.type === 'CREATE') {
    run(db, 'DELETE FROM meals WHERE id = ?', [action.meal.id]);
  } else if (action.type === 'DELETE') {
    const m = action.meal;
    run(db, 'INSERT INTO meals (id, name, category, description) VALUES (?, ?, ?, ?)',
      [m.id, m.name, m.category, m.description]);
  } else if (action.type === 'UPDATE') {
    const b = action.before;
    run(db, 'UPDATE meals SET name=?, category=?, description=? WHERE id=?',
      [b.name, b.category, b.description, b.id]);
  }

  persist();
  res.json({ message: `Ação "${action.type}" desfeita`, action });
});

// GET /api/meals
router.get('/', async (_req, res) => {
  const db = await getDb();
  const meals = rows(db, 'SELECT * FROM meals ORDER BY id DESC');
  res.json({ meals, total: meals.length });
});

// GET /api/meals/:id
router.get('/:id', async (req, res) => {
  const db   = await getDb();
  const meal = row(db, 'SELECT * FROM meals WHERE id = ?', [req.params.id]);
  if (!meal) return res.status(404).json({ error: 'Refeição não encontrada' });
  res.json(meal);
});

// POST /api/meals
router.post('/', async (req, res) => {
  const { name, category, description = '' } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });

  const db     = await getDb();
  const result = run(db, 'INSERT INTO meals (name, category, description) VALUES (?, ?, ?)', [name, category, description]);
  const newMeal = row(db, 'SELECT * FROM meals WHERE id = ?', [result.lastInsertRowid]);

  persist();
  actionStack.push({ type: 'CREATE', meal: newMeal });
  res.status(201).json({ meal: newMeal, stackSize: actionStack.size() });
});

// PUT /api/meals/:id
router.put('/:id', async (req, res) => {
  const db       = await getDb();
  const existing = row(db, 'SELECT * FROM meals WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Refeição não encontrada' });

  const { name = existing.name, category = existing.category, description = existing.description } = req.body;
  run(db, 'UPDATE meals SET name=?, category=?, description=? WHERE id=?',
    [name, category, description, req.params.id]);
  const updated = row(db, 'SELECT * FROM meals WHERE id = ?', [req.params.id]);

  persist();
  actionStack.push({ type: 'UPDATE', before: existing, after: updated });
  res.json({ meal: updated, stackSize: actionStack.size() });
});

// DELETE /api/meals/:id
router.delete('/:id', async (req, res) => {
  const db       = await getDb();
  const existing = row(db, 'SELECT * FROM meals WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Refeição não encontrada' });

  run(db, 'DELETE FROM meals WHERE id = ?', [req.params.id]);
  persist();
  actionStack.push({ type: 'DELETE', meal: existing });
  res.json({ message: 'Refeição removida', stackSize: actionStack.size() });
});

module.exports = router;
