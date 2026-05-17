import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.PGUSER || process.env.USER}@localhost:5432/gps_chat`;

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);

export const initSchema = async () => {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Postgres schema ready');
};

export const upsertUser = async (id, name) => {
  await query(
    `INSERT INTO users (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
    [id, name || 'Гость']
  );
};

export const insertUserMessage = async ({ userId, userName, text, at }) => {
  await upsertUser(userId, userName);
  const { rows } = await query(
    `INSERT INTO messages (user_id, role, text, at)
     VALUES ($1, 'user', $2, $3) RETURNING id`,
    [userId, text || null, at]
  );
  return rows[0].id;
};

export const insertUserImage = async ({ userId, userName, buffer, mime, caption, at }) => {
  await upsertUser(userId, userName);
  const { rows } = await query(
    `INSERT INTO messages (user_id, role, caption, image_bytes, image_mime, at)
     VALUES ($1, 'user', $2, $3, $4, $5) RETURNING id`,
    [userId, caption || null, buffer, mime, at]
  );
  return rows[0].id;
};

export const insertAgentMessage = async ({ userId, text, at }) => {
  const { rows } = await query(
    `INSERT INTO messages (user_id, role, text, at)
     VALUES ($1, 'agent', $2, $3) RETURNING id`,
    [userId, text || null, at]
  );
  return rows[0].id;
};

export const getMessagesSince = async (userId, since) => {
  const { rows } = await query(
    `SELECT id, role, text, caption, image_mime, image_name, at
       FROM messages
      WHERE user_id = $1 AND at > $2
      ORDER BY at ASC`,
    [userId, since]
  );
  return rows;
};
