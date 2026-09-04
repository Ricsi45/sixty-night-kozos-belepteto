"use client";
import {useEffect,useMemo,useRef,useState} from "react";

export default function Admin(){
  const[msg,setMsg]=useState("");
  const[tickets,setTickets]=useState([]);
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("all");
  const[loading,setLoading]=useState(false);
  const[action,setAction]=useState(null);
  const[uploading,setUploading]=useState(false);
  const fileRef=useRef(null);

  async function load(show=false){
    setLoading(true);
    try{
      const r=await fetch("/api/tickets",{cache:"no-store"}),j=await r.json();
      if(!j.ok)throw new Error(j.error);
      setTickets(j.tickets||[]);
      if(show)setMsg(`Adatok frissítve: ${j.tickets?.length||0} jegy.`);
    }catch(e){setMsg(`Hiba: ${e.message}`)}finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  async function importFile(file){
    if(!file)return;
    const name=file.name.toLowerCase();
    if(!name.endsWith(".json")&&!name.endsWith(".csv")){
      setMsg("Csak JSON vagy CSV jegylista tölthető fel.");
      return;
    }
    setUploading(true);
    setMsg("Jegylista feltöltése folyamatban...");
    try{
      const content=await file.text();
      const r=await fetch("/api/import",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({filename:file.name,content})
      });
      const j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.error||"Sikertelen feltöltés");
      setMsg(`Sikeres feltöltés: ${j.imported} jegy. Kihagyva: ${j.skipped}.`);
      await load();
    }catch(e){setMsg(`Feltöltési hiba: ${e.message}`)}
    finally{
      setUploading(false);
      if(fileRef.current)fileRef.current.value="";
    }
  }

  async function setValidity(t,invalid){
    let reason="";
    if(invalid){
      reason=window.prompt("Miért lett érvénytelenítve a jegy?\n\nAz ok kötelező.","");
      if(reason===null)return;
      reason=reason.trim();
      if(!reason){setMsg("Az érvénytelenítés megszakítva: az ok kötelező.");return}
      if(!window.confirm(`Érvénytelenítés oka:\n\n${reason}\n\nBiztosan mented?`))return
    }else if(!window.confirm("Biztosan újra érvényessé teszed ezt a jegyet?"))return;

    setAction(t.ticket_id);
    try{
      const r=await fetch("/api/tickets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticket_id:t.ticket_id,invalid,reason})}),j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.error);
      setMsg(invalid?"A jegy érvénytelenítve.":"A jegy újra érvényes.");
      await load();
    }catch(e){setMsg(`Hiba: ${e.message}`)}finally{setAction(null)}
  }

  async function deleteTicket(t){
    const label=[t.serial,t.guest_name].filter(Boolean).join(" · ")||t.ticket_id;
    if(!window.confirm(`FIGYELEM!\n\nVéglegesen törlöd ezt a jegyet?\n\n${label}\n\nEz a művelet nem vonható vissza.`))return;
    setAction(`delete:${t.ticket_id}`);
    try{
      const r=await fetch("/api/tickets",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticket_id:t.ticket_id})}),j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.error);
      setMsg("A jegy véglegesen törölve.");
      await load();
    }catch(e){setMsg(`Törlési hiba: ${e.message}`)}finally{setAction(null)}
  }

  const used=tickets.filter(t=>t.used_at).length;
  const invalid=tickets.filter(t=>t.invalid_at).length;
  const remaining=tickets.length-used-invalid;
  const rate=tickets.length?((used/tickets.length)*100).toFixed(1):"0.0";

  const visible=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return tickets.filter(t=>{
      const mf=filter==="all"||(filter==="used"&&t.used_at)||(filter==="unused"&&!t.used_at&&!t.invalid_at)||(filter==="invalid"&&t.invalid_at);
      const hay=[t.serial,t.guest_name,t.invalid_reason].filter(Boolean).join(" ").toLowerCase();
      return mf&&(!q||hay.includes(q));
    })
  },[tickets,search,filter]);

  return <main>
    <div className="header"><div className="logo">SIXTY NIGHT PARTY</div><div className="sub">JEGYLISTA ADMIN</div></div>

    <div className="stats">
      <div className="stat"><span>🎟️ Összes</span><b>{tickets.length}</b></div>
      <div className="stat"><span>🟢 Belépett</span><b>{used}</b></div>
      <div className="stat"><span>⚪ Hátra</span><b>{remaining}</b></div>
      <div className="stat"><span>🔴 Érvénytelen</span><b>{invalid}</b></div>
    </div>

    <div className="card">
      <div className="progress-head"><b>BELÉPTETÉSI ARÁNY</b><strong>{rate}%</strong></div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${rate}%`}}/></div>
    </div>

    <div className="card">
      <b>ADMIN MŰVELETEK</b>
      <button onClick={()=>load(true)} disabled={loading}>{loading?"FRISSÍTÉS...":"🔄 ADATOK FRISSÍTÉSE"}</button>
      <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" style={{display:"none"}} onChange={e=>importFile(e.target.files?.[0])}/>
      <button onClick={()=>fileRef.current?.click()} disabled={uploading}>{uploading?"FELTÖLTÉS...":"📥 JEGYLISTA FELTÖLTÉSE"}</button>
      <div className="small">JSON: a jegygenerátor `tickets_export.json` fájlja. CSV is támogatott. A feltöltés nem törli a korábbi belépési vagy érvénytelenítési állapotokat.</div>
      <div className="small">{msg}</div>
    </div>

    <div className="card">
      <b>JEGYEK A KÖZÖS ADATBÁZISBAN: {tickets.length}</b>
      <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔎 Keresés név, jegyszám vagy érvénytelenítés oka alapján"/>
      <div className="filter-row">
        <button className={filter==="all"?"filter active":"filter"} onClick={()=>setFilter("all")}>Összes ({tickets.length})</button>
        <button className={filter==="used"?"filter active":"filter"} onClick={()=>setFilter("used")}>Belépett ({used})</button>
        <button className={filter==="unused"?"filter active":"filter"} onClick={()=>setFilter("unused")}>Hátra ({remaining})</button>
        <button className={filter==="invalid"?"filter active":"filter"} onClick={()=>setFilter("invalid")}>Érvénytelen ({invalid})</button>
      </div>
      <div className="small">{visible.length} találat</div><hr/>
      {visible.length===0?<div className="empty">Nincs a keresésnek megfelelő jegy.</div>:visible.map(t=><div key={t.ticket_id} className="ticket-row">
        <b>{t.serial||"-"}</b>{" · "}{t.guest_name||"Név nélkül"}<br/>
        <span className="small">{t.invalid_at?<>🔴 ÉRVÉNYTELEN<br/><b>Ok:</b> {t.invalid_reason||"Nincs megadva"}<br/><b>Időpont:</b> {new Date(t.invalid_at).toLocaleString("hu-HU")}</>:t.used_at?<>🟢 Belépett · {new Date(t.used_at).toLocaleString("hu-HU")}</>:"⚪ Nem lépett be"}</span><br/>
        <button className="filter" disabled={action===t.ticket_id||action===`delete:${t.ticket_id}`} onClick={()=>setValidity(t,!t.invalid_at)}>{action===t.ticket_id?"FELDOLGOZÁS...":t.invalid_at?"↩️ ÉRVÉNYESÍTÉS":"🚫 ÉRVÉNYTELENÍTÉS"}</button>
        <button className="filter" style={{marginTop:"8px",background:"#4b171d",borderColor:"#7f2a34"}} disabled={action===t.ticket_id||action===`delete:${t.ticket_id}`} onClick={()=>deleteTicket(t)}>{action===`delete:${t.ticket_id}`?"TÖRLÉS...":"🗑️ JEGY TÖRLÉSE"}</button>
      </div>)}
    </div>
  </main>
}
