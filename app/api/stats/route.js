import { db, ensureSchema } from "../db";

export async function GET() {
  try {
    const sql = db();
    await ensureSchema(sql);
    const r = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE used_at IS NOT NULL)::int AS used,
        COUNT(*) FILTER (WHERE used_at IS NULL)::int AS unused
      FROM tickets
    `;
    return Response.json({ok:true,...r[0]});
  } catch(e) {
    return Response.json({ok:false,error:e.message},{status:500});
  }
}
