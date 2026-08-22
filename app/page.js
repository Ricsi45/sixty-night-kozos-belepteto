"use client";

import {useEffect,useRef,useState} from "react";

export default function Home(){
  const [stats,setStats]=useState({under:0,over:0,total:0});
  const [message,setMessage]=useState("A kezdéshez engedélyezd a kamerát.");
  const [messageType,setMessageType]=useState("");
  const video=useRef(null), canvas=useRef(null), stream=useRef(null);
  const running=useRef(false), locked=useRef(false), last=useRef("");

  async function refresh(){
    try{
      const r=await fetch("/api/stats",{cache:"no-store"});
      const j=await r.json();
      if(j.ok)setStats({
        under:j.under||0,
        over:j.over||0,
        total:j.total||0
      });
    }catch{}
  }

  useEffect(()=>{
    refresh();
    return ()=>stop();
  },[]);

  async function check(qr){
    try{
      const r=await fetch("/api/scan",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({qr})
      });

      const j=await r.json();

      if(j.status==="under"){
        show("🟢 18 ÉV ALATTI KARSZALAG +1","under");
      }else if(j.status==="over"){
        show("🔴 18+ KARSZALAG +1","over");
      }else{
        show("❌ ISMERETLEN QR-KÓD – NEM SZÁMOLTAM","bad");
      }

      refresh();

      navigator.vibrate?.(
        j.status==="under"||j.status==="over"
        ?120
        :[120,70,120]
      );

    }catch(e){
      show("❌ HIBA: "+e.message,"bad");
    }
  }

  function show(text,type){
    setMessage(text);
    setMessageType(type);
    locked.current=true;

    setTimeout(()=>{
      locked.current=false;
      setMessage("Következő karszalag beolvasható.");
      setMessageType("");
    },1100);
  }

  async function start(){
    try{
      if(!window.isSecureContext){
        throw new Error("A kamera csak HTTPS oldalon működik.");
      }

      if(!window.jsQR){
        await new Promise((res,rej)=>{
          const s=document.createElement("script");
          s.src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
          s.onload=res;
          s.onerror=rej;
          document.head.appendChild(s);
        });
      }

      stream.current=await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:{ideal:"environment"},
          width:{ideal:1280},
          height:{ideal:720}
        },
        audio:false
      });

      video.current.srcObject=stream.current;
      await video.current.play();

      running.current=true;
      setMessage("Kamera aktív – tartsd elé a QR-kódot.");

      scan();

    }catch(e){
      show(
        "❌ A kamera nem engedélyezhető. Engedélyezd a kamerát a böngésző beállításaiban.",
        "bad"
      );
    }
  }

  function stop(){
    running.current=false;

    stream.current?.getTracks().forEach(t=>t.stop());

    stream.current=null;

    if(video.current){
      video.current.srcObject=null;
    }
  }

  function scan(){
    if(!running.current)return;

    const v=video.current;
    const c=canvas.current;

    if(v?.readyState>=2){

      c.width=v.videoWidth;
      c.height=v.videoHeight;

      const x=c.getContext("2d",{
        willReadFrequently:true
      });

      x.drawImage(
        v,
        0,
        0,
        c.width,
        c.height
      );

      const q=window.jsQR?.(
        x.getImageData(
          0,
          0,
          c.width,
          c.height
        ).data,
        c.width,
        c.height,
        {
          inversionAttempts:"attemptBoth"
        }
      );

      if(q && q.data!==last.current){

        last.current=q.data;

        if(!locked.current){
          check(q.data);
        }

        setTimeout(()=>{
          last.current="";
        },1000);
      }
    }

    requestAnimationFrame(scan);
  }

  return <main>

    <div className="header">
      <div className="logo">
        SIXTY NIGHT PARTY
      </div>

      <div className="sub">
        KARSZALAG-REGISZTRÁCIÓ
      </div>
    </div>

    <div className="statsGrid">

      <div className="card green">
        <div className="label">
          🟢 18 év alatt
        </div>

        <div className="number">
          {stats.under}
        </div>
      </div>

      <div className="card red">
        <div className="label">
          🔴 18+
        </div>

        <div className="number">
          {stats.over}
        </div>
      </div>

    </div>

    <div className="card total">

      <div className="label">
        🎟️ Összes karszalag
      </div>

      <div className="number">
        {stats.total}
      </div>

    </div>

    <div className="card scanCard">

      <video
        ref={video}
        playsInline
        muted
      />

      <canvas
        ref={canvas}
        style={{display:"none"}}
      />

      <button onClick={start}>
        📷 KAMERA ENGEDÉLYEZÉSE
      </button>

      <div className={"status "+messageType}>
        {message}
      </div>

    </div>

    <button
      className="reset"
      onClick={refresh}
    >
      🔄 SZÁMLÁLÓ FRISSÍTÉSE
    </button>

    <div className="small">
      Közös online számláló: minden telefon ugyanazt az eredményt látja.
    </div>

    <div className="small">
      🟢 Zöld QR = 18 év alatt · 🔴 Piros QR = 18+
    </div>

  </main>
}
