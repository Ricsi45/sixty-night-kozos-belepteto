# Sixty Night – közös online QR-beléptető

A rendszer Neon PostgreSQL adatbázist használ. A Vercel–Neon integráció után a Vercel Production környezetben a `DATABASE_URL` változónak elérhetőnek kell lennie.

## Funkciók
- több telefonról ugyanaz a jegyállapot
- kamera QR-olvasás HTTPS-en
- első beolvasás: ÉRVÉNYES JEGY
- későbbi beolvasás: MÁR FELHASZNÁLT JEGY
- érvénytelen azonosító kezelése
- tickets_export.json import
- közös beléptetési számláló

## Indítás
`npm install`
`npm run dev`

A Vercel deploy után nyisd meg a projekt HTTPS címét telefonon.

## Fontos
A `DATABASE_URL` értékét nem kell a kódba beírni. A Vercel–Neon integráció kezeli környezeti változóként.
