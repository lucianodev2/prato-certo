const express = require('express');
const router  = express.Router();
const { getDb, rows, row } = require('../database');
const { FoodTree } = require('../structures/Tree');

const foodTree = new FoodTree();

// GET /api/stats/overview
router.get('/overview', async (_req, res) => {
  const db = await getDb();

  const { total_evals } = row(db, 'SELECT COUNT(*) as total_evals FROM evaluations') ?? { total_evals: 0 };
  const { avg_rating }  = row(db, 'SELECT AVG(rating) as avg_rating FROM evaluations') ?? { avg_rating: 0 };
  const { waste_count } = row(db, 'SELECT COUNT(*) as waste_count FROM evaluations WHERE had_waste = 1') ?? { waste_count: 0 };
  const { total_meals } = row(db, 'SELECT COUNT(*) as total_meals FROM meals') ?? { total_meals: 0 };

  res.json({
    totalEvaluations: total_evals,
    averageRating:    avg_rating ? parseFloat(Number(avg_rating).toFixed(2)) : 0,
    wastePercentage:  total_evals > 0 ? parseFloat(((waste_count / total_evals) * 100).toFixed(1)) : 0,
    totalMeals:       total_meals,
  });
});

// GET /api/stats/meals
router.get('/meals', async (_req, res) => {
  const db   = await getDb();
  const data = rows(db, `
    SELECT
      m.id, m.name, m.category,
      COUNT(e.id)                                        AS total_evals,
      AVG(e.rating)                                      AS avg_rating,
      SUM(CASE WHEN e.liked    =1 THEN 1 ELSE 0 END)    AS liked_count,
      SUM(CASE WHEN e.had_waste=1 THEN 1 ELSE 0 END)    AS waste_count
    FROM meals m
    LEFT JOIN evaluations e ON m.id = e.meal_id
    GROUP BY m.id
    ORDER BY avg_rating DESC
  `);

  const stats = data.map(r => ({
    ...r,
    avg_rating:    r.avg_rating  ? parseFloat(Number(r.avg_rating).toFixed(2)) : 0,
    approval_rate: r.total_evals ? parseFloat(((r.liked_count / r.total_evals) * 100).toFixed(1)) : 0,
  }));

  res.json({ stats });
});

// GET /api/stats/matrix
router.get('/matrix', async (_req, res) => {
  const matrix = Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => ({ ratings: [], avg: 0, count: 0 }))
  );

  const db   = await getDb();
  const data = rows(db, 'SELECT rating, day_of_week, week_number FROM evaluations');

  data.forEach(r => {
    const w = Math.min(r.week_number - 1, 4);
    const d = r.day_of_week;
    if (w >= 0 && w < 5 && d >= 0 && d < 7) {
      const cell = matrix[w][d];
      cell.ratings.push(r.rating);
      cell.count++;
      cell.avg = parseFloat((cell.ratings.reduce((a, b) => a + b, 0) / cell.count).toFixed(1));
    }
  });

  const clean = matrix.map(week => week.map(({ avg, count }) => ({ avg, count })));
  res.json({ matrix: clean, weeks: 5, days: 7 });
});

// GET /api/stats/tree
router.get('/tree', (_req, res) => {
  res.json({ tree: foodTree.toJSON() });
});

module.exports = router;
