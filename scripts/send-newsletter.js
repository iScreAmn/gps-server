#!/usr/bin/env node
/**
 * Manually trigger a newsletter broadcast after publishing news/product content.
 *
 * Usage:
 *   node scripts/send-newsletter.js --type article --title "..." --description "..." --url "https://geopolser.ge/news/some-id"
 *
 * Env:
 *   NEWSLETTER_API_URL   Base server URL (default: https://gps-app-server.vercel.app)
 *   NEWSLETTER_ADMIN_KEY Must match the server's NEWSLETTER_ADMIN_KEY
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i += 1;
    }
  }
  return args;
};

const args = parseArgs(process.argv.slice(2));

if (!args.title || !args.type) {
  console.error('Usage: node scripts/send-newsletter.js --type article|product --title "..." [--description "..."] [--url "..."]');
  process.exit(1);
}

const baseUrl = (process.env.NEWSLETTER_API_URL || 'https://gps-app-server.vercel.app').replace(/\/$/, '');
const adminKey = process.env.NEWSLETTER_ADMIN_KEY;

if (!adminKey) {
  console.error('NEWSLETTER_ADMIN_KEY is not set in .env');
  process.exit(1);
}

const run = async () => {
  const response = await fetch(`${baseUrl}/api/newsletter/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({
      type: args.type,
      title: args.title,
      description: args.description || '',
      url: args.url || '',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Broadcast failed:', data);
    process.exit(1);
  }

  console.log(`Sent to ${data.sent}/${data.totalSubscribers} subscribers (${data.failed} failed).`);
};

run().catch((err) => {
  console.error('Broadcast request failed:', err.message);
  process.exit(1);
});
