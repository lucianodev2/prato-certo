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
    for (const [name, category, description] of [
      ['Arroz com Feijão',  'Proteínas',    'Prato base nutritivo com arroz branco e feijão carioca'],
      ['Fruta do Dia',      'Frutas',       'Fruta fresca sazonal selecionada diariamente'],
      ['Salada Verde',      'Verduras',     'Mix de alface, tomate e cenoura com azeite'],
      ['Macarrão ao Molho', 'Carboidratos', 'Macarrão com molho de tomate caseiro'],
      ['Frango Grelhado',   'Proteínas',    'Peito de frango grelhado com temperos naturais'],
    ]) {
      run(db, 'INSERT INTO meals (name, category, description) VALUES (?, ?, ?)', [name, category, description]);
    }
    console.log('Dados iniciais inseridos.');
  }

  persist();
  console.log('Banco de dados pronto.');
}

module.exports = { getDb, persist, rows, row, run, initDatabase };
