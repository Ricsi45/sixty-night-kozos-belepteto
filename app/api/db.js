import { neon } from "@neondatabase/serverless";

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nincs beállítva a Vercel környezetben.");
  }
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id TEXT PRIMARY KEY,
      serial TEXT,
      guest_name TEXT,
      used_at TIMESTAMPTZ NULL,
      invalid_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS invalid_at TIMESTAMPTZ NULL
  `;
}
