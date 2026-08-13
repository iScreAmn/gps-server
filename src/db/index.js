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

export const setTelegramMessageId = async (dbId, telegramMessageId) => {
  await query(
    'UPDATE messages SET telegram_message_id = $1 WHERE id = $2',
    [telegramMessageId, dbId]
  );
};

export const findUserByTelegramMessageId = async (telegramMessageId) => {
  const { rows } = await query(
    'SELECT user_id FROM messages WHERE telegram_message_id = $1 ORDER BY at DESC LIMIT 1',
    [telegramMessageId]
  );
  return rows[0]?.user_id || null;
};

export const getNewAgentMessages = async (userId, since) => {
  const { rows } = await query(
    `SELECT id, text, caption, at
       FROM messages
      WHERE user_id = $1 AND role = 'agent' AND at > $2
      ORDER BY at ASC`,
    [userId, since]
  );
  return rows.map((r) => ({
    id: `agent-db-${r.id}`,
    role: 'agent',
    kind: 'text',
    text: r.text || r.caption,
    at: r.at,
  }));
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

export const addNewsletterSubscriber = async (email) => {
  const { rows } = await query(
    `INSERT INTO newsletter_subscribers (email)
     VALUES ($1)
     ON CONFLICT (email) DO UPDATE
       SET unsubscribed_at = NULL
       WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL
     RETURNING id, (xmax = 0) AS inserted`,
    [email]
  );
  if (rows.length === 0) return { alreadySubscribed: true };
  return { alreadySubscribed: false, resubscribed: !rows[0].inserted };
};

export const unsubscribeNewsletterEmail = async (email) => {
  const { rows } = await query(
    `UPDATE newsletter_subscribers SET unsubscribed_at = now()
     WHERE email = $1 AND unsubscribed_at IS NULL
     RETURNING id`,
    [email]
  );
  return rows.length > 0;
};

export const getActiveNewsletterEmails = async () => {
  const { rows } = await query(
    `SELECT email FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY id ASC`
  );
  return rows.map((r) => r.email);
};

export const getHistory = async (userId, limit = 200) => {
  const { rows } = await query(
    `SELECT id, role, text, caption, image_bytes, image_mime, image_name, at
       FROM messages
      WHERE user_id = $1
      ORDER BY at ASC
      LIMIT $2`,
    [userId, limit]
  );
  return rows.map((r) => {
    const msg = {
      id: `${r.role}-db-${r.id}`,
      role: r.role,
      at: r.at,
    };
    const text = r.text || r.caption;
    if (text) msg.text = text;
    if (r.image_bytes && r.image_mime) {
      msg.imageUrl = `data:${r.image_mime};base64,${r.image_bytes.toString('base64')}`;
      if (r.image_name) msg.imageName = r.image_name;
    }
    return msg;
  });
};
