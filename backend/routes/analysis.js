const express = require('express');
const router  = express.Router();
const { getDb, rows, row } = require('../database');

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Motor de análise baseado em regras
function runRuleEngine(mealStats, evaluations, overview) {
  const insights   = [];
  const alerts     = [];
  const suggestions = [];
  const trends     = [];

  // --- Análise por refeição ---
  const withEvals = mealStats.filter(m => m.total_evals > 0);

  const rejected = withEvals.filter(m => m.avg_rating < 3);
  const approved  = withEvals.filter(m => m.avg_rating >= 4);
  const highWaste = withEvals.filter(m => m.total_evals > 0 && (m.waste_count / m.total_evals) > 0.4);

  rejected.forEach(m => {
    insights.push({
      type: 'negative',
      icon: '⚠️',
      title: `Baixa aceitação: ${m.name}`,
      description: `Nota média de ${Number(m.avg_rating).toFixed(1)} — abaixo do esperado. Taxa de aprovação de ${m.approval_rate}%.`,
    });
  });

  approved.forEach(m => {
    insights.push({
      type: 'positive',
      icon: '✅',
      title: `Alta aceitação: ${m.name}`,
      description: `Nota média de ${Number(m.avg_rating).toFixed(1)} — muito bem avaliada pelos alunos (${m.approval_rate}% de aprovação).`,
    });
  });

  highWaste.forEach(m => {
    const rate = ((m.waste_count / m.total_evals) * 100).toFixed(0);
    alerts.push({
      severity: 'high',
      icon: '🗑️',
      message: `Desperdício elevado em "${m.name}": ${rate}% das avaliações registraram sobras.`,
    });
  });

  // --- Análise por dia da semana ---
  const wasteByDay  = {};
  const countByDay  = {};
  const ratingByDay = {};

  evaluations.forEach(ev => {
    const d = ev.day_of_week;
    wasteByDay[d]  = (wasteByDay[d]  || 0) + (ev.had_waste ? 1 : 0);
    countByDay[d]  = (countByDay[d]  || 0) + 1;
    ratingByDay[d] = (ratingByDay[d] || 0) + ev.rating;
  });

  let worstWasteDay = -1, worstWasteRate = 0;
  let bestDay = -1, bestDayRating = 0;

  Object.keys(countByDay).forEach(d => {
    const wasteRate = wasteByDay[d] / countByDay[d];
    const avgRating = ratingByDay[d] / countByDay[d];

    if (wasteRate > worstWasteRate) { worstWasteRate = wasteRate; worstWasteDay = parseInt(d); }
    if (avgRating  > bestDayRating) { bestDayRating  = avgRating; bestDay        = parseInt(d); }
  });

  if (worstWasteDay >= 0 && worstWasteRate > 0.3) {
    alerts.push({
      severity: 'medium',
      icon: '📅',
      message: `O desperdício é mais alto às ${DAY_NAMES[worstWasteDay]}s (${(worstWasteRate * 100).toFixed(0)}% das refeições com sobras).`,
    });
    suggestions.push({
      priority: 'alta',
      icon: '💡',
      action: `Revisar o cardápio de ${DAY_NAMES[worstWasteDay]}`,
      reason: `Maior taxa de desperdício observada neste dia (${(worstWasteRate * 100).toFixed(0)}%).`,
    });
  }

  if (bestDay >= 0) {
    trends.push({
      label: `Melhor dia de aceitação`,
      direction: 'up',
      icon: '📈',
      value: `${DAY_NAMES[bestDay]} — nota média ${(bestDayRating).toFixed(1)}`,
    });
  }

  // --- Tendências gerais ---
  if (overview.averageRating >= 4) {
    trends.push({ label: 'Satisfação geral', direction: 'up',   icon: '😊', value: `Nota média ${overview.averageRating} — ótima aceitação` });
  } else if (overview.averageRating < 3) {
    trends.push({ label: 'Satisfação geral', direction: 'down', icon: '😟', value: `Nota média ${overview.averageRating} — requer atenção` });
    alerts.push({ severity: 'high', icon: '🔴', message: 'A satisfação média geral está abaixo de 3. Revisar cardápio urgente.' });
  } else {
    trends.push({ label: 'Satisfação geral', direction: 'stable', icon: '😐', value: `Nota média ${overview.averageRating} — razoável` });
  }

  if (overview.wastePercentage > 35) {
    alerts.push({ severity: 'high', icon: '♻️', message: `Desperdício geral de ${overview.wastePercentage}% — acima do limite recomendado de 20%.` });
    suggestions.push({ priority: 'alta', icon: '📋', action: 'Reduzir porções ou oferecer opção de meia-porção', reason: `Desperdício de ${overview.wastePercentage}% é elevado.` });
  } else if (overview.wastePercentage > 20) {
    alerts.push({ severity: 'medium', icon: '⚠️', message: `Desperdício de ${overview.wastePercentage}% — monitorar de perto.` });
  } else if (overview.wastePercentage <= 15 && overview.totalEvaluations > 0) {
    trends.push({ label: 'Controle de desperdício', direction: 'up', icon: '♻️', value: `${overview.wastePercentage}% — dentro da meta` });
  }

  // --- Análise por categoria ---
  const byCategory = {};
  mealStats.forEach(m => {
    if (!byCategory[m.category]) byCategory[m.category] = { total: 0, sum: 0, count: 0 };
    byCategory[m.category].sum   += m.avg_rating * m.total_evals;
    byCategory[m.category].total += m.total_evals;
    byCategory[m.category].count++;
  });

  let bestCategory = null, bestCatRating = 0;
  Object.entries(byCategory).forEach(([cat, v]) => {
    if (v.total > 0) {
      const avg = v.sum / v.total;
      if (avg > bestCatRating) { bestCatRating = avg; bestCategory = cat; }
    }
  });

  if (bestCategory) {
    trends.push({ label: 'Categoria mais aceita', direction: 'up', icon: '🏆', value: `${bestCategory} (nota média ${bestCatRating.toFixed(1)})` });
  }

  // --- Sugestões gerais ---
  if (rejected.length > 0) {
    suggestions.push({
      priority: 'alta',
      icon: '🔄',
      action: `Substituir ou reformular: ${rejected.map(m => m.name).join(', ')}`,
      reason: 'Essas refeições apresentam nota média abaixo de 3.',
    });
  }
  if (approved.length > 0) {
    suggestions.push({
      priority: 'baixa',
      icon: '📌',
      action: `Manter e repetir com frequência: ${approved.map(m => m.name).join(', ')}`,
      reason: 'Alta aprovação — alunos gostam dessas refeições.',
    });
  }
  if (overview.totalEvaluations < 10) {
    suggestions.push({
      priority: 'média',
      icon: '📊',
      action: 'Coletar mais avaliações para análises mais precisas',
      reason: `Apenas ${overview.totalEvaluations} avaliações registradas. Mais dados melhoram a precisão.`,
    });
  }

  // --- Resumo geral ---
  let summary = `Análise baseada em ${overview.totalEvaluations} avaliações de ${overview.totalMeals} refeições. `;
  if (overview.averageRating >= 4) {
    summary += `O cardápio tem boa aceitação geral (nota ${overview.averageRating}). `;
  } else if (overview.averageRating < 3) {
    summary += `O cardápio precisa de atenção — nota média de ${overview.averageRating}. `;
  } else {
    summary += `A aceitação geral é razoável (nota ${overview.averageRating}). `;
  }
  summary += `O desperdício está em ${overview.wastePercentage}%. `;
  if (alerts.length > 0) summary += `${alerts.length} alerta(s) identificado(s). `;
  if (suggestions.length > 0) summary += `${suggestions.length} sugestão(ões) de melhoria disponível(is).`;

  return { summary, insights, alerts, suggestions, trends };
}

// POST /api/analysis/generate
router.post('/generate', async (_req, res) => {
  try {
    const db = await getDb();

    const mealData = rows(db, `
      SELECT m.id, m.name, m.category,
        COUNT(e.id)                                      AS total_evals,
        AVG(e.rating)                                    AS avg_rating,
        SUM(CASE WHEN e.liked    =1 THEN 1 ELSE 0 END)  AS liked_count,
        SUM(CASE WHEN e.had_waste=1 THEN 1 ELSE 0 END)  AS waste_count
      FROM meals m
      LEFT JOIN evaluations e ON m.id = e.meal_id
      GROUP BY m.id
    `);

    const mealStats = mealData.map(r => ({
      ...r,
      avg_rating:    r.avg_rating   ? parseFloat(Number(r.avg_rating).toFixed(2)) : 0,
      approval_rate: r.total_evals  ? parseFloat(((r.liked_count / r.total_evals) * 100).toFixed(1)) : 0,
    }));

    const evaluations = rows(db, 'SELECT rating, liked, had_waste, day_of_week, week_number FROM evaluations');

    const { total_evals } = row(db, 'SELECT COUNT(*) as total_evals FROM evaluations') ?? { total_evals: 0 };
    const { avg_rating  } = row(db, 'SELECT AVG(rating) as avg_rating FROM evaluations') ?? { avg_rating: 0 };
    const { waste_count } = row(db, 'SELECT COUNT(*) as waste_count FROM evaluations WHERE had_waste=1') ?? { waste_count: 0 };
    const { total_meals } = row(db, 'SELECT COUNT(*) as total_meals FROM meals') ?? { total_meals: 0 };

    const overview = {
      totalEvaluations: total_evals,
      averageRating:    avg_rating ? parseFloat(Number(avg_rating).toFixed(2)) : 0,
      wastePercentage:  total_evals > 0 ? parseFloat(((waste_count / total_evals) * 100).toFixed(1)) : 0,
      totalMeals:       total_meals,
    };

    const analysis = runRuleEngine(mealStats, evaluations, overview);

    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      engine: 'rule-based',
      overview,
      ...analysis,
    });
  } catch (err) {
    console.error('Erro na análise:', err);
    res.status(500).json({ ok: false, error: 'Erro ao gerar análise.' });
  }
});

// GET /api/analysis/last  (retorna análise armazenada em memória, se houver)
let _lastAnalysis = null;
router.get('/last', (_req, res) => {
  if (_lastAnalysis) return res.json({ ok: true, cached: true, ..._lastAnalysis });
  res.json({ ok: false, message: 'Nenhuma análise gerada ainda.' });
});

module.exports = router;
