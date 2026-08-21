"use client";
import {useEffect,useState} from "react";
export default function Admin(){
 const [msg,setMsg]=useState("A jegylista feltöltése csak itt történik.");
 const [tickets,setTickets]=useState([]);
 async function load(){const r=await fetch("/api/tickets",{cache:"no-store"});const j=await r.json();if(j.ok)setTickets(j.tickets);}
 useEffect(()=>{load()},[]);
 async function upload(e){const f=e.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());const r=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});const j=await r.json();if(!j.ok)throw Error(j.error);setMsg(`${j.count} jegy feltöltve/frissítve a közös adatbázisban.`);load();}catch(x){setMsg("Hiba: "+x.message)}e.target.value=""}
 return <main><div className="header"><div className="logo">SIXTY NIGHT PARTY</div><div className="sub">JEGYLISTA ADMIN</div></div><div className="card"><b>JEGYLISTA FELTÖLTÉSE</b><input type="file" accept=".json,application/json" onChange={upload}/><div className="small">{msg}</div></div><div className="card"><b>JEGYEK A KÖZÖS ADATBÁZISBAN: {tickets.length}</b><hr/>{tickets.map(t=><div key={t.ticket_id} style={{padding:"9px 0",borderBottom:"1px solid #333"}}><b>{t.serial||"-"}</b> · {t.guest_name||"Név nélkül"}<br/><span className="small">{t.used_at?"🟢 Belépett · "+new Date(t.used_at).toLocaleString("hu-HU"):"⚪ Nem lépett be"}</span></div>)}</div></main>
}
