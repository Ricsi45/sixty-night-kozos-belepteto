import { db, ensureSchema } from "../db";

function norm(v) {
  return String(v ?? "").trim().replace(/\s/g, "").split("|").pop();
}

export async function POST(req) {
  try {
    const { qr } = await req.json();
    const ticket_id = norm(qr);
    if (!ticket_id) return Response.json({ ok:false, status:"invalid" }, {status:400});

    const sql = db();
    await ensureSchema(sql);

    const rows = await sql`
      SELECT ticket_id, serial, guest_name, used_at
      FROM tickets
      WHERE ticket_id = ${ticket_id}
      LIMIT 1
    `;
    if (!rows.length) {
      return Response.json({ ok:true, status:"invalid", ticket_id });
    }

    const t = rows[0];
    if (t.used_at) {
      return Response.json({
        ok:true, status:"used", ticket_id:t.ticket_id,
        serial:t.serial, guest_name:t.guest_name, used_at:t.used_at
      });
    }

    const updated = await sql`
      UPDATE tickets
      SET used_at = NOW()
      WHERE ticket_id = ${ticket_id} AND used_at IS NULL
      RETURNING ticket_id, serial, guest_name, used_at
    `;

    if (!updated.length) {
      const again = await sql`SELECT ticket_id, serial, guest_name, used_at FROM tickets WHERE ticket_id=${ticket_id}`;
      const a = again[0];
      return Response.json({ok:true,status:"used",ticket_id:a.ticket_id,serial:a.serial,guest_name:a.guest_name,used_at:a.used_at});
    }

    const a = updated[0];
    return Response.json({
      ok:true,status:"valid",ticket_id:a.ticket_id,
      serial:a.serial,guest_name:a.guest_name,used_at:a.used_at
    });
  } catch (e) {
    return Response.json({ ok:false, error:e.message }, {status:500});
  }
}
