import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from '../config/env.js';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const statements = async (file) => {
  const raw = await readFile(path.join(here, file), 'utf8');
  const withoutComments = raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
};

async function main() {
  const reset = process.argv.includes('--reset');
  const seedOnly = process.argv.includes('--seed-only');
  const { host, port, user, password, database } = env.db;

  const root = await mysql.createConnection({ host, port, user, password, multipleStatements: false });
  if (!seedOnly) {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✓ Database "${database}" sẵn sàng`);
  }
  await root.end();

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: false });

  if (!seedOnly) {
    for (const statement of await statements('schema.sql')) {
      await conn.query(statement);
    }
    console.log('✓ Đã tạo/cập nhật bảng');
  }

  const result = await seed(conn, { reset });
  console.log(result.skipped ? '• Đã có dữ liệu, bỏ qua seed (dùng --reset để tạo lại)' : '✓ Đã seed dữ liệu demo');

  if (!result.skipped) {
    const [rows] = await conn.query('SELECT COUNT(*) AS total FROM transactions');
    console.log(`  ${rows[0].total} giao dịch · đăng nhập: manh@finora.vn / 123456`);
  }
  await conn.end();
}

main().catch((error) => {
  console.error('✗ Lỗi migrate:', error.message);
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('  Kiểm tra DB_USER / DB_PASSWORD trong server/.env');
  }
  process.exit(1);
});
