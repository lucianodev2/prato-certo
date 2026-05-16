const initSqlJs = require('sql.js');
const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'pratocerto.db');

let _db = null;

async function getDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  _db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();
  return _db;
}

function persist() {
  if (_db) fs.writeFileSync(DB_FILE, Buffer.from(_db.export()));
}

// SELECT — retorna array de objetos
function rows(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const result = [];
  while (stmt.step()) result.push(stmt.getAsObject());
  stmt.free();
  return result;
}

// SELECT one
function row(db, sql, params = []) {
  return rows(db, sql, params)[0] ?? null;
}

// INSERT / UPDATE / DELETE
function run(db, sql, params = []) {
  db.run(sql, params);
  const r = rows(db, 'SELECT last_insert_rowid() as id');
  return { lastInsertRowid: r[0]?.id ?? null };
}

async function initDatabase() {
  const db = await getDb();

  run(db, `CREATE TABLE IF NOT EXISTS meals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  )`);

  run(db, `CREATE TABLE IF NOT EXISTS evaluations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id     INTEGER NOT NULL,
    rating      INTEGER NOT NULL,
    liked       INTEGER NOT NULL DEFAULT 1,
    had_waste   INTEGER NOT NULL DEFAULT 0,
    day_of_week INTEGER NOT NULL DEFAULT 0,
    week_number INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now'))
  )`);

  const { count } = row(db, 'SELECT COUNT(*) as count FROM meals') ?? { count: 0 };
  if (!count) {
    run(db, 'INSERT INTO meals (name, category, description) VALUES (?, ?, ?)',
      ['Merenda Escolar', 'Geral', 'Refeição servida no refeitório do IEMA Rio Anil']);
    console.log('Refeição base inserida.');
  }

  // Seed com dados reais da pesquisa de campo (193 alunos, IEMA Rio Anil, 13/05/2026)
  const { evalCount } = row(db, 'SELECT COUNT(*) as evalCount FROM evaluations') ?? { evalCount: 0 };
  if (!evalCount) {
    // Q1: Avaliação da refeição → ratings
    // Muito Boa(5)=15, Boa(4)=58, Regular(3)=104, Ruim(2)=11, Muito Ruim(1)=5
    const ratings = [
      ...Array(15).fill(5),
      ...Array(58).fill(4),
      ...Array(104).fill(3),
      ...Array(11).fill(2),
      ...Array(5).fill(1),
    ];
    // Q3: Desperdício no prato → had_waste
    // Às vezes(123) + Frequentemente(29) = 152 tiveram desperdício, 41 não
    const waste = [...Array(152).fill(1), ...Array(41).fill(0)];

    for (let i = 0; i < 193; i++) {
      const rating      = ratings[i];
      const liked       = rating >= 4 ? 1 : 0;
      const had_waste   = waste[i];
      const meal_id     = 1;   // avaliação da merenda em geral
      const day_of_week = 3;   // quarta-feira (13/05/2026)
      const week_number = 1;   // coleta em único dia
      run(db, 'INSERT INTO evaluations (meal_id, rating, liked, had_waste, day_of_week, week_number) VALUES (?, ?, ?, ?, ?, ?)',
        [meal_id, rating, liked, had_waste, day_of_week, week_number]);
    }
    console.log('193 avaliações reais inseridas (pesquisa de campo IEMA Rio Anil, 13/05/2026).');
  }

  persist();
  console.log('Banco de dados pronto.');
}

module.exports = { getDb, persist, rows, row, run, initDatabase };
