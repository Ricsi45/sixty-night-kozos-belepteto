import { db, ensureSchema } from "../db";

function norm(v) {
  return String(v ?? "").trim().replace(/\s/g, "").split("|").pop();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body) ? body : (body.tickets || []);
    const sql = db();
    await ensureSchema(sql);

    let count = 0;
    for (const r of rows) {
      const ticket_id = norm(r.ticket_id || r.qr_value || r.id);
      if (!ticket_id) continue;
      await sql`
        INSERT INTO tickets (ticket_id, serial, guest_name)
        VALUES (${ticket_id}, ${String(r.serial ?? "")}, ${String(r.guest_name ?? r.name ?? "")})
        ON CONFLICT (ticket_id) DO UPDATE SET
          serial = EXCLUDED.serial,
          guest_name = EXCLUDED.guest_name
      `;
      count++;
    }
    return Response.json({ ok: true, count });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
