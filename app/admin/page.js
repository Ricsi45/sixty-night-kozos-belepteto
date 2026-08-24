// Cseréld erre: app/admin/page.js
"use client";
import { useEffect, useMemo, useState } from "react";

export default function Admin() {
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  async function load(showMessage = false) {
    setLoading(true);
    try {
      const r = await fetch("/api/tickets", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Nem sikerült betölteni a jegyeket.");
      setTickets(j.tickets || []);
      if (showMessage) setMsg(`Adatok frissítve: ${j.tickets?.length || 0} jegy.`);
    } catch (e) {
      setMsg(`Hiba: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setValidity(ticketId, invalid) {
    if (!window.confirm(invalid
      ? "Biztosan érvényteleníted ezt a jegyet?"
      : "Biztosan újra érvényessé teszed ezt a jegyet?")) return;

    setAction(ticketId);
    try {
      const r = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, invalid }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "A művelet nem sikerült.");
      setMsg(invalid ? "A jegy érvénytelenítve." : "A jegy újra érvényes.");
      await load();
    } catch (e) {
      setMsg(`Hiba: ${e.message}`);
    } finally {
      setAction(null);
    }
  }

  const used = tickets.filter(t => t.used_at).length;
  const invalid = tickets.filter(t => t.invalid_at).length;
  const remaining = tickets.length - used - invalid;
  const rate = tickets.length ? ((used / tickets.length) * 100).toFixed(1) : "0.0";

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(t => {
      const mf =
        filter === "all" ||
        (filter === "used" && t.used_at) ||
        (filter === "unused" && !t.used_at && !t.invalid_at) ||
        (filter === "invalid" && t.invalid_at);
      const ms =
        !q ||
        String(t.serial || "").toLowerCase().includes(q) ||
        String(t.guest_name || "").toLowerCase().includes(q);
      return mf && ms;
    });
  }, [tickets, search, filter]);

  return (
    <main>
      <div className="header">
        <div className="logo">SIXTY NIGHT PARTY</div>
        <div className="sub">JEGYLISTA ADMIN</div>
      </div>

      <div className="stats">
        <div className="stat"><span>🎟️ Összes</span><b>{tickets.length}</b></div>
        <div className="stat"><span>🟢 Belépett</span><b>{used}</b></div>
        <div className="stat"><span>⚪ Hátra</span><b>{remaining}</b></div>
      </div>

      <div className="card">
        <div className="progress-head"><b>BELÉPTETÉSI ARÁNY</b><strong>{rate}%</strong></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${rate}%` }} /></div>
      </div>

      <div className="card">
        <b>ADMIN MŰVELETEK</b>
        <button onClick={() => load(true)} disabled={loading}>
          {loading ? "FRISSÍTÉS..." : "🔄 ADATOK FRISSÍTÉSE"}
        </button>
        <div className="small">{msg}</div>
      </div>

      <div className="card">
        <b>JEGYEK A KÖZÖS ADATBÁZISBAN: {tickets.length}</b>
        <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔎 Keresés név vagy jegyszám alapján" />

        <div className="filter-row">
          <button className={filter === "all" ? "filter active" : "filter"} onClick={() => setFilter("all")}>Összes ({tickets.length})</button>
          <button className={filter === "used" ? "filter active" : "filter"} onClick={() => setFilter("used")}>Belépett ({used})</button>
          <button className={filter === "unused" ? "filter active" : "filter"} onClick={() => setFilter("unused")}>Hátra ({remaining})</button>
          <button className={filter === "invalid" ? "filter active" : "filter"} onClick={() => setFilter("invalid")}>Érvénytelen ({invalid})</button>
        </div>

        <div className="small">{visible.length} találat</div>
        <hr />

        {visible.length === 0 ? <div className="empty">Nincs a keresésnek megfelelő jegy.</div> :
          visible.map(t => (
            <div key={t.ticket_id} className="ticket-row">
              <b>{t.serial || "-"}</b>{" · "}{t.guest_name || "Név nélkül"}<br />
              <span className="small">
                {t.invalid_at ? "🔴 ÉRVÉNYTELEN" :
                 t.used_at ? "🟢 Belépett · " + new Date(t.used_at).toLocaleString("hu-HU") :
                 "⚪ Nem lépett be"}
              </span><br />
              <button className="filter" disabled={action === t.ticket_id}
                onClick={() => setValidity(t.ticket_id, !t.invalid_at)}>
                {action === t.ticket_id ? "FELDOLGOZÁS..." :
                 t.invalid_at ? "↩️ ÉRVÉNYESÍTÉS" : "🚫 ÉRVÉNYTELENÍTÉS"}
              </button>
            </div>
          ))}
      </div>
    </main>
  );
}
