---
name: hardware-hub-admin
description: Gestisci il catalogo "Rizzo AI Academy — Hardware Hub" da remoto via API REST admin: aggiungere/modificare/eliminare prodotti hardware AI, moderare (nascondere/mostrare/eliminare) i commenti. Usala quando l'utente chiede di aggiungere un prodotto all'Hardware Hub, aggiornare prezzi/specifiche, o moderare commenti.
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

## Errori tipici

| Codice | Significato |
| ------ | ----------- |
| 401    | Token mancante o errato |
| 409    | Slug già esistente |
| 400    | Validazione fallita (leggi `error` nella risposta) |
