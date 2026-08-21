"use client";

import {useEffect,useRef,useState} from "react";

export default function Home(){
  const [msg,setMsg]=useState("Jegylista nincs betöltve.");
  const [result,setResult]=useState(null);
  const [stats,setStats]=useState({total:0,used:0,unused:0});
  const video=useRef(null), canvas=useRef(null), stream=useRef(null), running=useRef(false);

  async function init(){
    await fetch("/api/init",{method:"POST"});
    refresh();
  }
  async function refresh(){
    const r=await fetch("/api/stats",{cache:"no-store"});
    const j=await r.json();
    if(j.ok)setStats(j);
  }
  useEffect(()=>{init(); return ()=>stop();},[]);

  async function check(qr){
    try{
      const r=await fetch("/api/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({qr})});
      const j=await r.json();
      if(j.status==="valid"){
        setResult({ok:true,title:"ÉRVÉNYES JEGY",name:j.guest_name,info:`Sorszám: ${j.serial}<br>Belépés: ${new Date(j.used_at).toLocaleString("hu-HU")}`});
      }else if(j.status==="used"){
        setResult({ok:false,title:"MÁR FELHASZNÁLT JEGY",name:j.guest_name,info:`Sorszám: ${j.serial}<br>Első belépés: ${new Date(j.used_at).toLocaleString("hu-HU")}`});
      }else{
        setResult({ok:false,title:"ÉRVÉNYTELEN JEGY",name:"",info:`Azonosító: ${j.ticket_id||qr}`});
      }
      refresh();
      navigator.vibrate?.(j.status==="valid"?180:[120,70,120]);
    }catch(e){setResult({ok:false,title:"HIBA",name:"",info:e.message});}
  }

  async function start(){
    try{
      if(!window.isSecureContext) throw new Error("A kamera csak HTTPS oldalon működik.");
      if(!window.jsQR){
        await new Promise((res,rej)=>{
          const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);
        });
      }
      stream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      video.current.srcObject=stream.current;
      await video.current.play();
      running.current=true;
      scan();
    }catch(e){alert("Nem sikerült megnyitni a kamerát: "+e.message);}
  }
  function stop(){
    running.current=false;
    stream.current?.getTracks().forEach(t=>t.stop());
    stream.current=null;
  }
  function scan(){
    if(!running.current)return;
    const v=video.current,c=canvas.current;
    if(v?.readyState>=2){
      c.width=v.videoWidth;c.height=v.videoHeight;
      const x=c.getContext("2d",{willReadFrequently:true});
      x.drawImage(v,0,0,c.width,c.height);
      const q=window.jsQR?.(x.getImageData(0,0,c.width,c.height).data,c.width,c.height,{inversionAttempts:"attemptBoth"});
      if(q){ stop(); check(q.data); return; }
    }
    requestAnimationFrame(scan);
  }

  return <main>
    <div className="header"><div className="logo">SIXTY NIGHT PARTY</div><div className="sub">MULAT HATVAN · KÖZÖS QR-BELÉPTETŐ</div></div>
    <div className="card">
      <b>JEGYLISTA</b>
      <div className="small">A jegylista automatikusan a közös online adatbázisból töltődik be. A beléptető telefonokon nincs fájlfeltöltés.</div>
      <button onClick={refresh}>🔄 LISTA FRISSÍTÉSE</button>
    </div>
    <div className="card">
      <b>QR-KÓD BEOLVASÁSA</b>
      <button onClick={start}>📷 KAMERA MEGNYITÁSA</button>
      <button onClick={stop}>⏹ KAMERA LEÁLLÍTÁSA</button>
      <video ref={video} playsInline muted/>
      <canvas ref={canvas} style={{display:"none"}}/>
      <div className="small">A QR-ellenőrzés közvetlenül a közös online adatbázisból történik.</div>
    </div>
    {result && <div className={"result "+(result.ok?"valid":"invalid")}>
      <div className="big">{result.title}</div><div className="name">{result.name}</div><div dangerouslySetInnerHTML={{__html:result.info}}/>
    </div>}
    <div className="card"><b>AKTUÁLIS BELÉPTETÉS</b><div className="stats">
      <div className="stat"><b>{stats.total}</b>összes jegy</div>
      <div className="stat"><b>{stats.used}</b>belépett</div>
      <div className="stat"><b>{stats.unused}</b>hátra</div>
    </div></div>
    <div className="card">2026. szeptember 12. · Kapunyitás: <b>20:30</b><br/>Sixty Night Party Park<br/>3000 Hatvan, Boldogi út 9. (2440 hrsz.)</div>
  </main>
}
