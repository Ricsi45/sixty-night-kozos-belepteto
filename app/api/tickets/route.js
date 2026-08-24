import { db, ensureSchema } from "../db";

export async function GET() {
  try {
    const sql = db();
    await ensureSchema(sql);
    const rows = await sql`
      SELECT ticket_id, serial, guest_name, used_at, invalid_at
      FROM tickets ORDER BY serial, ticket_id
    `;
    return Response.json({ ok: true, tickets: rows });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { ticket_id, invalid } = await req.json();
    if (!ticket_id) return Response.json({ ok: false, error: "Hiányzó ticket_id." }, { status: 400 });

    const sql = db();
    await ensureSchema(sql);

    const rows = await sql`
      UPDATE tickets
      SET invalid_at = ${invalid ? new Date() : null}
      WHERE ticket_id = ${ticket_id}
      RETURNING ticket_id, serial, guest_name, used_at, invalid_at
    `;

    if (!rows.length) return Response.json({ ok: false, error: "A jegy nem található." }, { status: 404 });
    return Response.json({ ok: true, ticket: rows[0] });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
