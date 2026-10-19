import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';

async function setupDatabase() {
  console.log('==================================================');
  console.log('       BOT_404_V3 • XAMPP DATABASE IMPORTER       ');
  console.log('==================================================\n');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'bot_404';

  console.log(`📡 Connecting to XAMPP MySQL at ${host}:${port} as '${user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL server successfully.');
  } catch (err: any) {
    console.error('\n❌ Could not connect to MySQL server!');
    console.error(`Error: ${err.message}`);
    console.error('\n💡 Please ensure XAMPP is open and MySQL is started (green indicator in XAMPP Control Panel).');
    process.exit(1);
  }

  try {
    const schemaPath = path.resolve('sql', 'schema.sql');
    console.log(`📄 Reading SQL schema from: ${schemaPath}`);
    const sql = await fs.readFile(schemaPath, 'utf-8');

    console.log(`🚀 Executing schema import for database '${dbName}'...`);
    await connection.query(sql);

    // Automatic migrations for existing tables
    const migrations = [
      'ALTER TABLE bot_ai_interactions ADD COLUMN latency_ms INT UNSIGNED NULL',
      'ALTER TABLE bot_ai_interactions ADD COLUMN tokens_used INT UNSIGNED NULL',
      'ALTER TABLE bot_audit_log ADD COLUMN actor_jid VARCHAR(255) NULL',
      'ALTER TABLE bot_audit_log ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT "success"',
      'ALTER TABLE api_usage ADD COLUMN endpoint VARCHAR(128) NULL',
      'ALTER TABLE api_usage ADD COLUMN latency_ms INT UNSIGNED NULL',
      'ALTER TABLE api_usage ADD COLUMN status INT NULL',
      'ALTER TABLE api_usage ADD COLUMN is_fallback TINYINT(1) NOT NULL DEFAULT 0'
    ];

    for (const alterSql of migrations) {
      try {
        await connection.query(alterSql);
      } catch (mErr: any) {
        if (mErr.errno !== 1060 && mErr.code !== 'ER_DUP_FIELDNAME') {
          // ignore
        }
      }
    }

    console.log('\n==================================================');
    console.log(`✅ SUCCESS: Database '${dbName}' and all tables created/migrated!`);
    console.log('• bot_messages');
    console.log('• bot_edits');
    console.log('• bot_ai_interactions');
    console.log('• bot_settings');
    console.log('• user_game_profiles');
    console.log('• user_game_history');
    console.log('• trusted_entities');
    console.log('• api_usage');
    console.log('• bot_audit_log');
    console.log('==================================================\n');
  } catch (err: any) {
    console.error('\n❌ Error executing SQL schema:', err.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
