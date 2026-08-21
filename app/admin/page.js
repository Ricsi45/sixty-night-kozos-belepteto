"use client";

import { useEffect, useMemo, useState } from "react";

export default function Admin() {
  const [msg, setMsg] = useState(
    "A jegylista feltöltése csak itt történik."
  );
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load(showMessage = false) {
    setLoading(true);

    try {
      const r = await fetch("/api/tickets", {
        cache: "no-store",
      });

      const j = await r.json();

      if (!j.ok) {
        throw new Error(
          j.error || "Nem sikerült betölteni a jegyeket."
        );
      }

      setTickets(j.tickets || []);

      if (showMessage) {
        setMsg(
          `Adatok frissítve: ${j.tickets?.length || 0} jegy.`
        );
      }
    } catch (e) {
      setMsg(`Hiba: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMsg("Jegylista feldolgozása...");

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const r = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const j = await r.json();

      if (!r.ok || !j.ok) {
        throw new Error(
          j.error || "A feltöltés nem sikerült."
        );
      }

      setMsg(
        `Sikeres feltöltés: ${j.count} jegy feldolgozva.`
      );

      await load();
    } catch (e) {
      setMsg(`Hiba: ${e.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function exportCsv() {
    const header = [
      "Jegyszám",
      "Név",
      "Állapot",
      "Belépés ideje",
    ];

    const rows = tickets.map((t) => [
      t.serial || "",
      t.guest_name || "",
      t.used_at
        ? "Belépett"
        : "Nem lépett be",
      t.used_at
        ? new Date(t.used_at).toLocaleString("hu-HU")
        : "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll('"', '""')}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "sixty-night-jegylista.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  const used = tickets.filter(
    (t) => t.used_at
  ).length;

  const remaining =
    tickets.length - used;

  const rate = tickets.length
    ? (
        (used / tickets.length) *
        100
      ).toFixed(1)
    : "0.0";

  const visible = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    return tickets.filter((t) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "used" && t.used_at) ||
        (filter === "unused" && !t.used_at);

      const matchesSearch =
        !q ||
        String(t.serial || "")
          .toLowerCase()
          .includes(q) ||
        String(t.guest_name || "")
          .toLowerCase()
          .includes(q);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [tickets, search, filter]);

  return (
    <main>
      <div className="header">
        <div className="logo">
          SIXTY NIGHT PARTY
        </div>

        <div className="sub">
          JEGYLISTA ADMIN
        </div>
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

          <strong>
            {rate}%
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${rate}%`,
            }}
          />
        </div>
      </div>

      <div className="card">
        <b>ADMIN MŰVELETEK</b>

        <button
          onClick={() => load(true)}
          disabled={loading}
        >
          {loading
            ? "FRISSÍTÉS..."
            : "🔄 ADATOK FRISSÍTÉSE"}
        </button>

        <button
          onClick={exportCsv}
          disabled={!tickets.length}
        >
          📊 JEGYLISTA EXPORTÁLÁSA (CSV)
        </button>
      </div>

      <div className="card">
        <b>JEGYLISTA FELTÖLTÉSE</b>

        <input
          type="file"
          accept=".json,application/json"
          onChange={handleUpload}
          disabled={uploading}
        />

        <div className="small">
          {msg}
        </div>

        <div className="small">
          Az import az API-n keresztül történik;
          azonos jegyazonosítónál az adat frissül.
        </div>
      </div>

      <div className="card">
        <b>
          JEGYEK A KÖZÖS ADATBÁZISBAN:{" "}
          {tickets.length}
        </b>

        <input
          className="search-input"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="🔎 Keresés név vagy jegyszám alapján"
        />

        <div className="filter-row">
          <button
            className={
              filter === "all"
                ? "filter active"
                : "filter"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            Összes ({tickets.length})
          </button>

          <button
            className={
              filter === "used"
                ? "filter active"
                : "filter"
            }
            onClick={() =>
              setFilter("used")
            }
          >
            Belépett ({used})
          </button>

          <button
            className={
              filter === "unused"
                ? "filter active"
                : "filter"
            }
            onClick={() =>
              setFilter("unused")
            }
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
          visible.map((t) => (
            <div
              key={t.ticket_id}
              className="ticket-row"
            >
              <b>
                {t.serial || "-"}
              </b>

              {" · "}

              {t.guest_name ||
                "Név nélkül"}

              <br />

              <span className="small">
                {t.used_at
                  ? "🟢 Belépett · " +
                    new Date(
                      t.used_at
                    ).toLocaleString(
                      "hu-HU"
                    )
                  : "⚪ Nem lépett be"}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
