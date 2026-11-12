const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Verificando e executando migrações de banco...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 1. Garantir que as tabelas base do schema.sql existam
    const schemaSqlPath = path.join(__dirname, '../schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      await client.query(schemaSql);
    }

    // 2. Executar arquivos de migration pendentes em ordem alfabética/numérica
    const files = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (rows.length === 0) {
        console.log(`➡️  Executando migração: ${file}`);
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
        
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Migração ${file} concluída.`);
      }
    }
    console.log('✨ Todas as migrações estão atualizadas.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro ao executar migrações:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
