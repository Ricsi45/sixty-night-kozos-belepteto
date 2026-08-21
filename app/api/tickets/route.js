import { db, ensureSchema } from "../db";

export async function GET() {
  try {
    const sql = db();
    await ensureSchema(sql);
    const rows = await sql`SELECT ticket_id, serial, guest_name, used_at FROM tickets ORDER BY serial, ticket_id`;
    return Response.json({ok:true, tickets:rows});
  } catch(e) {
    return Response.json({ok:false,error:e.message},{status:500});
  }
}
