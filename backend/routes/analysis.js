require('dotenv').config();
const express  = require('express');
const router   = express.Router();
const Groq     = require('groq-sdk');
const { getDb, rows, row } = require('../database');

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Motor de análise baseado em regras (sempre executado)
function runRuleEngine(mealStats, evaluations, overview) {
  const insights    = [];
  const alerts      = [];
  const suggestions = [];
  const trends      = [];

  const withEvals = mealStats.filter(m => m.total_evals > 0);
  const rejected  = withEvals.filter(m => m.avg_rating < 3);
  const approved  = withEvals.filter(m => m.avg_rating >= 4);
  const highWaste = withEvals.filter(m => (m.waste_count / m.total_evals) > 0.4);

  rejected.forEach(m => {
    insights.push({ type: 'negative', icon: '⚠️', title: `Baixa aceitação: ${m.name}`,
      description: `Nota média de ${Number(m.avg_rating).toFixed(1)} — abaixo do esperado. Taxa de aprovação de ${m.approval_rate}%.` });
  });
  approved.forEach(m => {
    insights.push({ type: 'positive', icon: '✅', title: `Alta aceitação: ${m.name}`,
      description: `Nota média de ${Number(m.avg_rating).toFixed(1)} — muito bem avaliada (${m.approval_rate}% de aprovação).` });
  });
  highWaste.forEach(m => {
    const rate = ((m.waste_count / m.total_evals) * 100).toFixed(0);
    alerts.push({ severity: 'high', icon: '🗑️', message: `Desperdício elevado em "${m.name}": ${rate}% das avaliações registraram sobras.` });
  });

  const wasteByDay = {}, countByDay = {}, ratingByDay = {};
  evaluations.forEach(ev => {
    const d = ev.day_of_week;
    wasteByDay[d]  = (wasteByDay[d]  || 0) + (ev.had_waste ? 1 : 0);
    countByDay[d]  = (countByDay[d]  || 0) + 1;
    ratingByDay[d] = (ratingByDay[d] || 0) + ev.rating;
  });

  let worstWasteDay = -1, worstWasteRate = 0, bestDay = -1, bestDayRating = 0;
  Object.keys(countByDay).forEach(d => {
    const wasteRate = wasteByDay[d] / countByDay[d];
    const avgRating = ratingByDay[d] / countByDay[d];
    if (wasteRate > worstWasteRate) { worstWasteRate = wasteRate; worstWasteDay = parseInt(d); }
    if (avgRating  > bestDayRating) { bestDayRating  = avgRating; bestDay       = parseInt(d); }
  });

  if (worstWasteDay >= 0 && worstWasteRate > 0.3) {
    alerts.push({ severity: 'medium', icon: '📅', message: `O desperdício é mais alto às ${DAY_NAMES[worstWasteDay]}s (${(worstWasteRate * 100).toFixed(0)}% com sobras).` });
    suggestions.push({ priority: 'alta', icon: '💡', action: `Revisar cardápio de ${DAY_NAMES[worstWasteDay]}`, reason: `Maior desperdício observado neste dia.` });
  }
  if (bestDay >= 0) trends.push({ label: 'Melhor dia', direction: 'up', icon: '📈', value: `${DAY_NAMES[bestDay]} — nota ${bestDayRating.toFixed(1)}` });

  if (overview.averageRating >= 4) {
    trends.push({ label: 'Satisfação geral', direction: 'up',     icon: '😊', value: `Nota ${overview.averageRating} — ótima aceitação` });
  } else if (overview.averageRating < 3) {
    trends.push({ label: 'Satisfação geral', direction: 'down',   icon: '😟', value: `Nota ${overview.averageRating} — requer atenção` });
    alerts.push({ severity: 'high', icon: '🔴', message: 'Satisfação média abaixo de 3. Revisar cardápio com urgência.' });
  } else {
    trends.push({ label: 'Satisfação geral', direction: 'stable', icon: '😐', value: `Nota ${overview.averageRating} — razoável` });
  }

  if (overview.wastePercentage > 35) {
    alerts.push({ severity: 'high', icon: '♻️', message: `Desperdício geral de ${overview.wastePercentage}% — acima do limite de 20%.` });
    suggestions.push({ priority: 'alta', icon: '📋', action: 'Reduzir porções ou oferecer meia-porção', reason: `Desperdício de ${overview.wastePercentage}% é elevado.` });
  } else if (overview.wastePercentage > 20) {
    alerts.push({ severity: 'medium', icon: '⚠️', message: `Desperdício de ${overview.wastePercentage}% — monitorar de perto.` });
  } else if (overview.wastePercentage <= 15 && overview.totalEvaluations > 0) {
    trends.push({ label: 'Desperdício', direction: 'up', icon: '♻️', value: `${overview.wastePercentage}% — dentro da meta` });
  }

  const byCategory = {};
  mealStats.forEach(m => {
    if (!byCategory[m.category]) byCategory[m.category] = { total: 0, sum: 0 };
    byCategory[m.category].sum   += m.avg_rating * m.total_evals;
    byCategory[m.category].total += m.total_evals;
  });
  let bestCategory = null, bestCatRating = 0;
  Object.entries(byCategory).forEach(([cat, v]) => {
    if (v.total > 0 && v.sum / v.total > bestCatRating) { bestCatRating = v.sum / v.total; bestCategory = cat; }
  });
  if (bestCategory) trends.push({ label: 'Categoria mais aceita', direction: 'up', icon: '🏆', value: `${bestCategory} (nota ${bestCatRating.toFixed(1)})` });

  if (rejected.length > 0) suggestions.push({ priority: 'alta', icon: '🔄', action: `Substituir ou reformular: ${rejected.map(m => m.name).join(', ')}`, reason: 'Nota média abaixo de 3.' });
  if (approved.length > 0) suggestions.push({ priority: 'baixa', icon: '📌', action: `Manter: ${approved.map(m => m.name).join(', ')}`, reason: 'Alta aprovação pelos alunos.' });
  if (overview.totalEvaluations < 10) suggestions.push({ priority: 'média', icon: '📊', action: 'Coletar mais avaliações', reason: `Apenas ${overview.totalEvaluations} registradas.` });

  let summary = `Análise de ${overview.totalEvaluations} avaliações de ${overview.totalMeals} refeições. `;
  summary += overview.averageRating >= 4 ? `Boa aceitação geral (nota ${overview.averageRating}). `
           : overview.averageRating < 3  ? `Cardápio precisa de atenção (nota ${overview.averageRating}). `
           : `Aceitação razoável (nota ${overview.averageRating}). `;
  summary += `Desperdício: ${overview.wastePercentage}%. `;
  if (alerts.length)      summary += `${alerts.length} alerta(s). `;
  if (suggestions.length) summary += `${suggestions.length} sugestão(ões).`;

  return { summary, insights, alerts, suggestions, trends };
}

// Gera resumo em linguagem natural via Groq (LLaMA)
async function generateGroqSummary(mealStats, overview, ruleResult) {
  const mealsText = mealStats
    .filter(m => m.total_evals > 0)
    .map(m => `- ${m.name} (${m.category}): nota ${Number(m.avg_rating).toFixed(1)}, aprovação ${m.approval_rate}%, desperdício ${m.total_evals > 0 ? ((m.waste_count / m.total_evals) * 100).toFixed(0) : 0}%`)
    .join('\n');

  const prompt = `Você é um analista de nutrição escolar. Analise os dados abaixo e escreva um resumo executivo em português, de forma clara e direta, com no máximo 3 parágrafos curtos. Foque nos pontos mais importantes: o que está bom, o que preocupa e a principal recomendação.

DADOS GERAIS:
- Total de avaliações: ${overview.totalEvaluations}
- Nota média geral: ${overview.averageRating}/5
- Taxa de desperdício: ${overview.wastePercentage}%
- Total de refeições: ${overview.totalMeals}

DESEMPENHO POR REFEIÇÃO:
${mealsText}

Escreva apenas o resumo, sem títulos, sem listas, sem markdown.`;

  const response = await groq.chat.completions.create({
    model:       'llama-3.1-8b-instant',
    messages:    [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens:  400,
  });

  return response.choices[0]?.message?.content?.trim() ?? ruleResult.summary;
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
      avg_rating:    r.avg_rating  ? parseFloat(Number(r.avg_rating).toFixed(2)) : 0,
      approval_rate: r.total_evals ? parseFloat(((r.liked_count / r.total_evals) * 100).toFixed(1)) : 0,
    }));

    const evaluations = rows(db, 'SELECT rating, liked, had_waste, day_of_week, week_number FROM evaluations');

    const { total_evals } = row(db, 'SELECT COUNT(*) as total_evals FROM evaluations') ?? { total_evals: 0 };
    const { avg_rating  } = row(db, 'SELECT AVG(rating) as avg_rating FROM evaluations')  ?? { avg_rating: 0 };
    const { waste_count } = row(db, 'SELECT COUNT(*) as waste_count FROM evaluations WHERE had_waste=1') ?? { waste_count: 0 };
    const { total_meals } = row(db, 'SELECT COUNT(*) as total_meals FROM meals') ?? { total_meals: 0 };

    const overview = {
      totalEvaluations: total_evals,
      averageRating:    avg_rating ? parseFloat(Number(avg_rating).toFixed(2)) : 0,
      wastePercentage:  total_evals > 0 ? parseFloat(((waste_count / total_evals) * 100).toFixed(1)) : 0,
      totalMeals:       total_meals,
    };

    // Motor de regras (sempre roda — gera insights, alertas, tendências)
    const ruleResult = runRuleEngine(mealStats, evaluations, overview);

    // Groq enriquece apenas o resumo em linguagem natural
    let summary  = ruleResult.summary;
    let engine   = 'rule-based';

    if (groq && overview.totalEvaluations > 0) {
      try {
        summary = await generateGroqSummary(mealStats, overview, ruleResult);
        engine  = 'groq/llama-3.1-8b-instant';
      } catch (err) {
        console.warn('Groq indisponível, usando fallback:', err.message);
      }
    }

    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      engine,
      overview,
      summary,
      insights:    ruleResult.insights,
      alerts:      ruleResult.alerts,
      suggestions: ruleResult.suggestions,
      trends:      ruleResult.trends,
    });
  } catch (err) {
    console.error('Erro na análise:', err);
    res.status(500).json({ ok: false, error: 'Erro ao gerar análise.' });
  }
});

router.get('/last', (_req, res) => {
  res.json({ ok: false, message: 'Nenhuma análise gerada ainda.' });
});

module.exports = router;
