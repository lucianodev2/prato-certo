require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const mealsRouter = require('./routes/meals');
const evaluationsRouter = require('./routes/evaluations');
const statsRouter = require('./routes/stats');
const analysisRouter = require('./routes/analysis');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/meals', mealsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/analysis', analysisRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'PratoCerto Escolar' }));

app.listen(PORT, () => {
  console.log(`PratoCerto Backend rodando na porta ${PORT}`);
});
