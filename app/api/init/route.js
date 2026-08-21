import { db, ensureSchema } from "../db";

export async function POST() {
  try {
    const sql = db();
    await ensureSchema(sql);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
