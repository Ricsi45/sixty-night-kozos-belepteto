"use client";

import { useEffect, useMemo, useState } from "react";

export default function Admin() {
  const [msg, setMsg] = useState("A jegylista feltöltése csak itt történik.");
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const r = await fetch("/api/tickets", { cache: "no-store" });
    const j = await r.json();

    if (j.ok) {
      setTickets(j.tickets);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const d = JSON.parse(await f.text());

      const r = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(d)
      });

      const j = await r.json();

      if (!j.ok) {
        throw Error(j.error);
      }

      setMsg(`${j.count} jegy feltöltve/frissítve a közös adatbázisban.`);
      load();
    } catch (x) {
      setMsg("Hiba: " + x.message);
    }

    e.target.value = "";
  }

  const used = tickets.filter(t => t.used_at).length;
  const remaining = tickets.length - used;
  const rate = tickets.length
    ? ((used / tickets.length) * 100).toFixed(1)
    : "0.0";

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter(t => {
      const matchesFilter =
        filter === "all" ||
        (filter === "used" && t.used_at) ||
        (filter === "unused" && !t.used_at);

      const matchesSearch =
        !q ||
        String(t.serial || "").toLowerCase().includes(q) ||
        String(t.guest_name || "").toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [tickets, search, filter]);

  return (
    <main>

      <div className="header">
        <div className="logo">SIXTY NIGHT PARTY</div>
        <div className="sub">JEGYLISTA ADMIN</div>
      </div>

      <div className="stats">

        <div className="stat">
          <span>🎟️ Összes</span>
          <b>{tickets.length}</b>
        </div>

        <div className="stat">
          <span>🟢 Belépett</span>
          <b>{used}</b>
        </div>

        <div className="stat">
          <span>⚪ Hátra</span>
          <b>{remaining}</b>
        </div>

      </div>

      <div className="card">
        <div className="progress-head">
          <b>BELÉPTETÉSI ARÁNY</b>
          <strong>{rate}%</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      <div className="card">

        <b>JEGYLISTA FELTÖLTÉSE</b>

        <input
          type="file"
          accept=".json,application/json"
          onChange={upload}
        />

        <div className="small">
          {msg}
        </div>

      </div>

      <div className="card">

        <b>
          JEGYEK A KÖZÖS ADATBÁZISBAN: {tickets.length}
        </b>

        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔎 Keresés név vagy jegyszám alapján"
        />

        <div className="filter-row">

          <button
            className={filter === "all" ? "filter active" : "filter"}
            onClick={() => setFilter("all")}
          >
            Összes ({tickets.length})
          </button>

          <button
            className={filter === "used" ? "filter active" : "filter"}
            onClick={() => setFilter("used")}
          >
            Belépett ({used})
          </button>

          <button
            className={filter === "unused" ? "filter active" : "filter"}
            onClick={() => setFilter("unused")}
          >
            Hátra ({remaining})
          </button>

        </div>

        <div className="small">
          {visible.length} találat
        </div>

        <hr />

        {visible.length === 0 ? (
          <div className="empty">
            Nincs a keresésnek megfelelő jegy.
          </div>
        ) : (
          visible.map(t => (
            <div key={t.ticket_id} className="ticket-row">

              <b>{t.serial || "-"}</b>
              {" · "}
              {t.guest_name || "Név nélkül"}

              <br />

              <span className="small">
                {t.used_at
                  ? "🟢 Belépett · " +
                    new Date(t.used_at).toLocaleString("hu-HU")
                  : "⚪ Nem lépett be"}
              </span>

            </div>
          ))
        )}

      </div>

    </main>
  );
}
