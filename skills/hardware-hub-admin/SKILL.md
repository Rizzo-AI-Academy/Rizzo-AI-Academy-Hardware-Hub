---
name: hardware-hub-admin
description: Gestisci il catalogo "Rizzo AI Academy — Hardware Hub" da remoto via API REST admin: aggiungere/modificare/eliminare prodotti hardware AI, caricare immagini prodotto, approvare i PC inviati dagli utenti (coda di moderazione), moderare (nascondere/mostrare/eliminare) i commenti. Usala quando l'utente chiede di aggiungere un prodotto all'Hardware Hub, aggiornare prezzi/specifiche/immagini, approvare inserimenti degli utenti o moderare commenti.
---

# Hardware Hub — Amministrazione da agente

Gestione remota del catalogo Hardware Hub via API REST. **Non serve accesso SSH alla VPS**:
basta l'URL pubblico del sito e il token admin.

## Configurazione (segreti per riferimento — MAI stamparli)

- `HARDWARE_HUB_URL` — URL base del sito, es. `https://hardware.esempio.it` (niente slash finale)
- `HARDWARE_HUB_ADMIN_TOKEN` — il token admin (lo stesso `ADMIN_TOKEN` del `.env` sul server)

Regola zero: usa i valori caricandoli nell'ambiente del processo, mai nel prompt/output.
Verifica solo che esistano: `[ -n "$HARDWARE_HUB_ADMIN_TOKEN" ] && echo presente`.

## Autenticazione

Ogni chiamata admin richiede l'header:

```
Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN
```

Con Bearer non serve nessun cookie né header Origin. Content-Type: `application/json`.

## Operazioni sui prodotti

### Elencare tutti i prodotti (con conteggi commenti)
```bash
curl -s "$HARDWARE_HUB_URL/api/admin/hardware" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"
```

### Creare un prodotto
```bash
curl -s -X POST "$HARDWARE_HUB_URL/api/admin/hardware" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mac mini M5",                  # obbligatorio
    "brand": "Apple",
    "category": "Apple",                    # obbligatorio: Apple | Mini PC Windows | Workstation | Schede sviluppo | Mini PC (o nuova)
    "price_eur": 829,                       # null se non verificabile — MAI inventare prezzi
    "price_note": "Listino Apple Italia",
    "description": "Testo sintetico...",
    "specs": {                              # tutte opzionali
      "cpu": "...", "ram": "...", "gpu_npu": "...", "tops_ai": "...",
      "storage": "...", "power_w": "...", "os": "..."
    },
    "buy_links": [{ "label": "Apple Store", "url": "https://..." }],
    "image_url": "https://sito-ufficiale/immagine.jpg"   # opzionale: scaricata in locale; se assente/fallita → placeholder automatico
  }'
```
- Lo `slug` è generato dal nome (o passalo esplicito con `"slug": "..."`). 409 = slug già in uso.
- Dati non verificabili da fonte ufficiale → marca "da verificare" nel testo o lascia il campo vuoto/null.

### Modificare un prodotto (solo i campi forniti cambiano)
```bash
curl -s -X PATCH "$HARDWARE_HUB_URL/api/admin/hardware/<ID>" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "price_eur": 749, "price_note": "Prezzo aggiornato, fonte: apple.com/it, <data>" }'
```

### Approvare / ritirare un PC inviato dagli utenti (coda di moderazione)
Gli inserimenti pubblici da `/aggiungi` arrivano con `approved: 0` e NON sono visibili
nel catalogo finché un admin non li approva.
```bash
# trova i prodotti in attesa: approved = 0 nella lista GET /api/admin/hardware
curl -s "$HARDWARE_HUB_URL/api/admin/hardware" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" | grep -B2 '"approved":0'

# approva (pubblica) / ritira (rimetti in coda)
curl -s -X PATCH "$HARDWARE_HUB_URL/api/admin/hardware/<ID>" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{ "approved": true }'
```

### Caricare un'immagine per un prodotto esistente (upload file)
```bash
curl -s -X POST "$HARDWARE_HUB_URL/api/admin/hardware/<ID>/image" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" \
  -F "image=@/percorso/locale/foto.jpg"
```
- Formati: PNG, JPEG, WebP — max 5MB. Salvata in locale e servita da `/api/images/`.
- Alternativa senza file: PATCH con `{ "image_url": "https://sito-ufficiale/img.jpg" }`
  (il server la scarica in locale; se fallisce → placeholder automatico).

### Eliminare un prodotto (elimina anche i suoi commenti — irreversibile!)
```bash
curl -s -X DELETE "$HARDWARE_HUB_URL/api/admin/hardware/<ID>" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"
```

## Metriche riassuntive

```bash
curl -s "$HARDWARE_HUB_URL/api/admin/stats" -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"
```
Restituisce: n. prodotti, commenti totali/nascosti/visibili, prodotti per categoria,
ultimi 5 commenti, prodotti con media voto più alta.

## Moderazione commenti

```bash
# Lista completa (inclusi nascosti)
curl -s "$HARDWARE_HUB_URL/api/admin/comments" -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"

# Nascondi / mostra
curl -s -X PATCH "$HARDWARE_HUB_URL/api/admin/comments" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": 12, "hidden": true }'

# Elimina definitivamente
curl -s -X DELETE "$HARDWARE_HUB_URL/api/admin/comments" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": 12 }'
```

## Workflow consigliato per "aggiungi il prodotto X"

1. Web search sul sito ufficiale per specifiche e prezzo (se non ufficiale → `price_eur: null` e nota "da verificare").
2. `POST /api/admin/hardware` con i dati raccolti.
3. Verifica pubblica: `GET $HARDWARE_HUB_URL/api/hardware/<slug>` → scheda online.

## Workflow per la coda di moderazione (PC inviati dagli utenti)

1. `GET /api/admin/hardware` → cerca prodotti con `"approved": 0`.
2. Controlla nome/brand/descrizione/specifiche; se serve correggi con PATCH.
3. Se c'è un'immagine migliore: `POST /api/admin/hardware/<ID>/image` (upload file)
   oppure PATCH con `image_url` ufficiale.
4. Approva: PATCH `{ "approved": true }` → il PC compare nel catalogo pubblico.
5. Se è spam/spazzatura: `DELETE /api/admin/hardware/<ID>`.

## Log trappola anti-bot

Il sito ha path-esca (`/.env`, `/.git`, `/wp-admin`, finto `/api/internal/export`) che loggano
IP, user agent e header di bot/scanner/agenti malevoli. Per consultarli:

```bash
# ultimi 200 accessi sospetti
curl -s "$HARDWARE_HUB_URL/api/admin/trap-logs" -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"

# filtra per IP
curl -s "$HARDWARE_HUB_URL/api/admin/trap-logs?ip=1.2.3.4" -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN"

# svuota i log (chiedi conferma all'utente)
curl -s -X DELETE "$HARDWARE_HUB_URL/api/admin/trap-logs" \
  -H "Authorization: Bearer $HARDWARE_HUB_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'
```

Nota: i commenti pubblici richiedono il captcha "Non sono un robot" (`POST /api/hardware/:slug/comments`
senza `captcha_token` valido → 400). Gli endpoint admin non lo richiedono.

## Errori tipici

| Codice | Significato |
| ------ | ----------- |
| 401    | Token mancante o errato |
| 409    | Slug già esistente |
| 400    | Validazione fallita (leggi `error` nella risposta) |
