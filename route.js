import { db, ensureSchema } from "../db";

function norm(v) {
  return String(v ?? "").trim().replace(/\s/g, "").split("|").pop();
}

function parseCsv(text) {
  const rows=[];
  let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c==='"'){
      if(quoted&&n==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(c===','&&!quoted){row.push(cell);cell="";}
    else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&n==='\n')i++;
      row.push(cell);cell="";
      if(row.some(v=>String(v).trim()!=="")){rows.push(row)}
      row=[];
    }else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);if(row.some(v=>String(v).trim()!==""))rows.push(row)}
  if(rows.length<2)return [];
  const headers=rows[0].map(h=>String(h).trim().toLowerCase());
  return rows.slice(1).map(cols=>Object.fromEntries(headers.map((h,i)=>[h,cols[i]??""])));
}

function getRows(filename,content){
  if(String(filename||"").toLowerCase().endsWith(".csv"))return parseCsv(content);
  const data=JSON.parse(content);
  return Array.isArray(data)?data:(Array.isArray(data?.tickets)?data.tickets:[]);
}

export async function POST(req) {
  try {
    const body=await req.json();
    if(!body?.content) return Response.json({ok:false,error:"Hiányzó fájltartalom."},{status:400});
    const rows=getRows(body.filename,body.content);
    if(!rows.length) return Response.json({ok:false,error:"A fájlban nem található jegy."},{status:400});

    const sql=db();
    await ensureSchema(sql);
    let imported=0,skipped=0;

    for(const r of rows){
      const ticket_id=norm(r.ticket_id||r.qr_value||r.id);
      if(!ticket_id){skipped++;continue;}
      const serial=String(r.serial??"").trim();
      const guest_name=String(r.guest_name??r.name??"").trim();
      await sql`
        INSERT INTO tickets (ticket_id, serial, guest_name)
        VALUES (${ticket_id}, ${serial}, ${guest_name})
        ON CONFLICT (ticket_id) DO UPDATE SET
          serial=EXCLUDED.serial,
          guest_name=EXCLUDED.guest_name
      `;
      imported++;
    }

    return Response.json({ok:true,imported,skipped});
  }catch(e){
    return Response.json({ok:false,error:e.message},{status:500});
  }
}
