# Rizzo AI Academy — Hardware Hub

Catalogo **community-driven** di hardware per AI (mini PC, Mac, workstation, schede di
sviluppo) con schede prodotto illustrate e **commenti aperti senza login**.

Sostituisce il vecchio Google Sheet condiviso: qui i commenti si possono **solo aggiungere** —
nessun edit/delete lato pubblico, quindi nessuno può cancellare i commenti degli altri.

## Funzionalità

- **Catalogo** con card: immagine, nome, brand, categoria, prezzo indicativo, media voti, n° commenti
- **Filtri per categoria** e ricerca per nome/brand
- **Scheda prodotto**: galleria, tabella specifiche (CPU, RAM, GPU/NPU, TOPS AI, storage, consumo, OS),
  prezzo indicativo, link "Dove comprarlo", descrizione
- **Commenti senza login**: nome + testo + voto opzionale 1-5 stelle, più recenti prima
- **Anti-abuso**: rate limit per IP (max 2 commenti / 30 sec per hardware), honeypot anti-bot,
  sanitizzazione input + escaping output (anti-XSS), header di sicurezza
- **Moderazione admin**: dashboard web a `/admin` + endpoint protetti da token per gestire
  prodotti (crea/modifica/elimina) e commenti (nascondi/mostra/elimina)
- Tema dark, responsive mobile-first, tutto in italiano

## Stack

- **Next.js 15** (App Router, full-stack: pagine + API routes)
- **SQLite** via `better-sqlite3` (file singolo, zero servizi esterni)
- CSS puro (nessun framework UI), Node 20+

## Sviluppo su Windows (o qualsiasi OS)

Prerequisiti: [Node.js 20+](https://nodejs.org) installato.

```bash
npm install
cp .env.example .env     # su Windows: copy .env.example .env
npm run seed             # popola il catalogo (13 prodotti + immagini locali)
npm run dev              # http://localhost:3000
```

## Produzione

> 🚀 **Vuoi metterla online?** Vai direttamente alla sezione
> [Installazione sulla VPS — per Simone (o il suo Agente AI)](#-installazione-sulla-vps--per-simone-o-il-suo-agente-ai).

### Percorso principale: Docker Compose

```bash
cp .env.example .env
# genera ADMIN_TOKEN SENZA stamparlo (vedi sezione "Gestione dei segreti"):
sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=$(openssl rand -hex 32)|" .env
docker compose up -d --build
```

L'app è su `http://localhost:3000`. Il database SQLite vive nel volume Docker
`hardware-hub-data` (montato su `/app/data` nel container): i dati **sopravvivono**
a rebuild e restart. Il seed è idempotente e gira a ogni avvio (non cancella i commenti).

### Alternativa: Node 20 + pm2

```bash
npm ci
npm run build
npm run seed
PORT=3000 pm2 start npm --name hardware-hub -- start
pm2 save && pm2 startup
```

Il file SQLite è in `./data/hardware-hub.db` (o dove punta `DATABASE_PATH`): **fanne backup
periodici** (basta copiare il file ad app ferma, oppure usa `sqlite3 ... ".backup"`).

## Variabili d'ambiente (.env)

| Variabile       | Default                    | Descrizione                              |
| --------------- | -------------------------- | ---------------------------------------- |
| `PORT`          | `3000`                     | Porta del server                         |
| `ADMIN_TOKEN`   | —                          | Token Bearer per la moderazione admin    |
| `DATABASE_PATH` | `./data/hardware-hub.db`   | Percorso del file SQLite                 |

⚠️ `.env` è gitignored: **mai committare segreti**.

## API principali

| Metodo | Endpoint                             | Descrizione                                    |
| ------ | ------------------------------------ | ---------------------------------------------- |
| GET    | `/api/hardware`                      | Lista catalogo (con media voti e n° commenti)  |
| GET    | `/api/hardware/:slug`                | Dettaglio prodotto + commenti visibili         |
| GET    | `/api/hardware/:slug/comments`       | Lista commenti visibili                        |
| POST   | `/api/hardware/:slug/comments`       | Nuovo commento (nome, testo, voto opzionale)   |
| GET    | `/api/admin/comments` 🔒             | Lista completa (inclusi nascosti)              |
| PATCH  | `/api/admin/comments` 🔒             | `{ "id": N, "hidden": true/false }`            |
| DELETE | `/api/admin/comments` 🔒             | `{ "id": N }` elimina definitivamente          |
| GET    | `/api/admin/hardware` 🔒             | Lista prodotti con conteggi commenti           |
| POST   | `/api/admin/hardware` 🔒             | Crea prodotto (immagine auto o da `image_url`) |
| PATCH  | `/api/admin/hardware/:id` 🔒         | Modifica i campi forniti                       |
| DELETE | `/api/admin/hardware/:id` 🔒         | Elimina prodotto + suoi commenti               |
| GET    | `/api/admin/stats` 🔒                | Metriche: prodotti, commenti, top rated        |
| POST   | `/api/admin/login`                   | Login dashboard (token → cookie), rate limited |
| POST   | `/api/admin/logout`                  | Logout dashboard                               |

🔒 = `Authorization: Bearer <ADMIN_TOKEN>` oppure cookie di sessione della dashboard.

### Esempio moderazione

```bash
curl -X PATCH http://localhost:3000/api/admin/comments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": 42, "hidden": true}'
```

## Dashboard admin (`/admin`)

L'URL `/admin` è raggiungibile da chiunque, ma **protetto da password**: serve il
`ADMIN_TOKEN` (condividilo solo con chi gestisce il sito, es. tu e Simone). Dopo il login
viene impostato un cookie firmato (HttpOnly, 7 giorni); il login è rate-limited
(5 tentativi/min per IP) contro il brute force.

Dalla dashboard puoi:

- **Prodotti**: creare (nome, categoria, prezzo, specifiche, link d'acquisto, immagine da
  URL ufficiale o placeholder automatico), modificare, eliminare (con i suoi commenti)
- **Commenti**: vedere tutti (anche nascosti), nascondere/mostrare, eliminare

Tutto funziona via HTTPS pubblico: **non serve accesso SSH alla VPS** per gestire il sito.

## 🤖 Gestione da agenti AI (Skill o MCP) — guida completa

Il sito è gestibile interamente da un agente AI remoto (Carloss non accede mai alla VPS):
l'agente chiama le API admin via HTTPS usando URL pubblico + token admin.
**Due modi alternativi** — consigliamo la Skill (universale), l'MCP è un optional.

### Cosa possono fare gli agenti

| Funzione | Via REST (Skill) | Tool MCP |
| --- | --- | --- |
| Metriche sito (prodotti, commenti, categorie, top rated) | `GET /api/admin/stats` | `get_stats` |
| Elencare prodotti (con conteggi commenti) | `GET /api/admin/hardware` | `list_products` |
| Creare un prodotto (con ricerca fonti e placeholder immagine) | `POST /api/admin/hardware` | `create_product` |
| Modificare un prodotto (prezzo, spec, descrizione…) | `PATCH /api/admin/hardware/:id` | `update_product` |
| Eliminare un prodotto (+ i suoi commenti) | `DELETE /api/admin/hardware/:id` | `delete_product` |
| Elencare tutti i commenti (anche nascosti) | `GET /api/admin/comments` | `list_comments` |
| Nascondere/mostrare un commento | `PATCH /api/admin/comments` | `set_comment_visibility` |
| Eliminare un commento | `DELETE /api/admin/comments` | `delete_comment` |

### Opzione A — Skill (consigliata, funziona con qualsiasi agente)

La skill è il file [`skills/hardware-hub-admin/SKILL.md`](skills/hardware-hub-admin/SKILL.md):
contiene istruzioni e comandi `curl` pronti. Setup:

1. **Installa la skill nel tuo agente** copiando la cartella `skills/hardware-hub-admin/`
   nella directory skills del tuo agente, ad esempio:
   - Kimi CLI / Claude Code: `~/.agents/skills/hardware-hub-admin/` (oppure `.agents/skills/` nel progetto)
   - altri agenti: incolla il contenuto di `SKILL.md` nel system prompt o nelle istruzioni personalizzate
2. **Imposta le variabili d'ambiente** (mai nel prompt! Regola Zero):
   ```bash
   # Linux/macOS — aggiungi a ~/.bashrc o ~/.zshrc
   export HARDWARE_HUB_URL="https://hardware.iltuodominio.it"
   export HARDWARE_HUB_ADMIN_TOKEN="<token dal tuo password manager>"
   ```
   Su Windows (PowerShell, permanente per l'utente):
   ```powershell
   [Environment]::SetEnvironmentVariable('HARDWARE_HUB_URL', 'https://hardware.iltuodominio.it', 'User')
   [Environment]::SetEnvironmentVariable('HARDWARE_HUB_ADMIN_TOKEN', '<token>', 'User')
   ```
3. **Usala con prompt in linguaggio naturale**, ad esempio:
   - *"Aggiungi all'Hardware Hub il Minisforum MS-A2: cerca specifiche e prezzo ufficiale,
     poi crealo nel catalogo"*
   - *"Mostrami le statistiche del sito e gli ultimi commenti"*
   - *"Nascondi il commento 34 del DGX Spark, è spam"*
   - *"Aggiorna il prezzo del Mac mini M4 prendendolo da apple.com/it"*

### Opzione B — Server MCP (opzionale, per agenti compatibili MCP)

Il server MCP gira **in locale sul tuo PC** (niente da installare sul VPS) e traduce i
tool MCP in chiamate REST. Setup:

```bash
cd mcp-server && npm install
```

Poi configura l'agente:

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "hardware-hub": {
      "command": "node",
      "args": ["<percorso-assoluto>/mcp-server/server.mjs"],
      "env": {
        "HARDWARE_HUB_URL": "https://hardware.iltuodominio.it",
        "HARDWARE_HUB_ADMIN_TOKEN": "<token>"
      }
    }
  }
}
```

**Kimi CLI** (`.kimi/mcp.json` nel progetto o config utente — stessa struttura):
```json
{
  "mcpServers": {
    "hardware-hub": {
      "command": "node",
      "args": ["<percorso-assoluto>/mcp-server/server.mjs"],
      "env": {
        "HARDWARE_HUB_URL": "https://hardware.iltuodominio.it",
        "HARDWARE_HUB_ADMIN_TOKEN": "<token>"
      }
    }
  }
}
```

Tool MCP esposti: `get_stats`, `list_products`, `create_product`, `update_product`,
`delete_product`, `list_comments`, `set_comment_visibility`, `delete_comment`.

### Regole per gli agenti (già dentro la skill/MCP)

- **Mai inventare prezzi**: se non c'è fonte ufficiale → `price_eur: null` + nota "da verificare"
- **Mai stampare il token**: va solo nelle variabili d'ambiente / config MCP
- Le **eliminazioni** sono irreversibili: l'agente deve chiederti conferma prima
  (i tool MCP `delete_*` hanno descrizioni che lo impongono)

## 🚀 Installazione sulla VPS — per Simone (o il suo Agente AI)

**Simone, non serve che tu sappia programmare.** Apri il tuo agente AI (Kimi, Claude, ChatGPT
con accesso shell, ecc.) sulla VPS via SSH e incolla il brief qui sotto. L'agente farà tutto da solo.

### Prerequisiti (li prepara Carlos)

1. Un **VPS Ubuntu 22.04+** con accesso SSH
2. Un **dominio** (es. `hardware.esempio.it`) con record A che punta all'IP del VPS.
   **Non ce l'hai ancora? Nessun problema**: vedi "Prova senza dominio" qui sotto —
   il dominio si può aggiungere dopo senza reinstallare nulla.
3. Carlos ti ha aggiunto come **collaboratore** della repo privata GitHub
4. Carlos ti ha detto il dominio da usare (quando lo avrete)

### Prova senza dominio (solo per Simone, prima di andare online)

Per testare l'installazione **senza dominio e senza aprire porte**, basta un tunnel SSH
dal PC di Simone:

```bash
ssh -L 3000:localhost:3000 utente@IP-DELLA-VPS
# lascia aperto il terminale, poi apri nel browser: http://localhost:3000
```

Così vedi catalogo e dashboard (`http://localhost:3000/admin`) in totale sicurezza:
il traffico passa cifrato dentro SSH. ⚠️ Evita invece `http://IP-VPS:3000` diretto:
senza HTTPS il token admin viaggerebbe in chiaro. Quando il sito diventa pubblico per
la community, il dominio + Caddy (HTTPS) è obbligatorio — sono le 3 righe nel brief.

### 📋 Brief da incollare all'agente AI (copia tutto il blocco)

````text
Devi installare la webapp "Rizzo AI Academy — Hardware Hub" su questo server Ubuntu
in produzione, seguendo il README del repo. Repo: https://github.com/WolCarloss/Rizzo-AI-Academy-Hardware-Hub
Dominio da usare: <DOMINIO, es. hardware.esempio.it>

REGOLE SUI SEGRETI (vincolanti, dal AGENTS.md del progetto):
- I segreti si GENERANO e si USANO, non si leggono MAI.
- NON stampare mai a video token o password: niente `cat .env`, niente `echo $TOKEN`,
  niente segreti nei log o nei tuoi messaggi.
- Genera ADMIN_TOKEN con `openssl rand -hex 32` scrivendolo DIRETTAMENTE nel file,
  senza farlo transitare nel tuo contesto (vedi comando al punto 3).
- Per verificare che un segreto esiste usa solo test strutturali:
  `grep -c '^ADMIN_TOKEN=.' .env` deve stampare 1, oppure `[ -s .env ] && echo presente`.

PASSI:
1. Installa Docker: `curl -fsSL https://get.docker.com | sudo sh` e
   `sudo usermod -aG docker $USER` (poi rientra in SSH se serve).
2. Clona la repo (è privata: se serve, `gh auth login` oppure chiedimi un access token
   da usare solo per il clone, poi cancellalo dalla history della shell).
   `git clone https://github.com/WolCarloss/Rizzo-AI-Academy-Hardware-Hub.git && cd Rizzo-AI-Academy-Hardware-Hub`
3. Crea i segreti SENZA leggerli né stamparli:
     cp .env.example .env
     sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=$(openssl rand -hex 32)|" .env
     chmod 600 .env
   Verifica SOLO la struttura: `grep -c '^ADMIN_TOKEN=.' .env` (atteso: 1).
4. Consegna il token al proprietario in modo sicuro: salvalo in un file FUORI dalla repo
   sulla macchina locale di Simone (es. con `ssh` inverso o chiedendo a Simone di eseguire
   un comando che lo copia), file che Simone metterà nel suo password manager e poi
   cancellerà. Il token NON va mai stampato a video né scritto in chat.
5. Avvia: `docker compose up -d --build` e controlla `docker compose logs --tail=20`.
6. HTTPS: installa Caddy (`sudo apt install -y caddy`), scrivi in /etc/caddy/Caddyfile:
     <DOMINIO> {
         reverse_proxy localhost:3000
     }
   poi `sudo systemctl reload caddy`. Apri solo 80/443/22 con ufw.
7. VERIFICHE (riporta solo questi esiti, mai segreti):
   - `curl -s -o /dev/null -w "%{http_code}" https://<DOMINIO>/` → 200
   - `curl -s https://<DOMINIO>/api/hardware | grep -o '"slug"' | wc -l` → ≥ 13
   - `curl -s -o /dev/null -w "%{http_code}" https://<DOMINIO>/api/admin/comments` → 401
   - `docker compose ps` → container "running"
8. Report finale per Simone: solo URL del sito, esito dei 4 check, e conferma che
   `.env` esiste con ADMIN_TOKEN impostato (senza mostrarlo).
````

### Dopo l'installazione

- Simone riceve dall'agente **solo l'URL del sito** e l'esito dei check.
- Il **token admin** arriva a Carlos tramite il file sicuro (punto 4 del brief):
  Simone lo salva nel password manager, lo condivide con Carlos (es. Bitwarden Send),
  poi **cancella il file**.
- Carlos usa il token su `https://<dominio>/admin` per la dashboard, oppure lo mette
  come `HARDWARE_HUB_ADMIN_TOKEN` nel suo agente AI (vedi sezione "Gestione da agenti AI").

---

## 🔐 Gestione dei segreti (regole per TUTTI, umani e agenti)

Vale per `ADMIN_TOKEN` e qualsiasi credenziale del progetto:

1. **Un segreto si genera e si usa, non si legge.** Non va mai stampato a video, scritto
   in chat, committato o copiato in file temporanei.
2. **Generazione** (direttamente nel file, senza output):
   ```bash
   sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=$(openssl rand -hex 32)|" .env && chmod 600 .env
   ```
3. **Verifica solo strutturale** (mai il valore):
   ```bash
   grep -c '^ADMIN_TOKEN=.' .env   # atteso: 1
   ```
4. **Dove vive**: solo nel file `.env` sul VPS (gitignored, permessi 600) e nel password
   manager di Carlos/Simone. Mai nel repo, mai nel README.
5. **Rotazione**: se un token finisce per errore in un log, in chat o nel contesto di un
   modello AI → è compromesso: rigenerarlo subito col comando al punto 2 e riavviare
   (`docker compose restart`). Le sessioni dashboard attive verranno invalidate.
6. **Passaggio tra persone**: solo via password manager / link monouso (Bitwarden Send).
   Mai via WhatsApp/email in chiaro.

---

## Pubblicazione su VPS Ubuntu (passo-passo manuale, per riferimento)

Questi sono i passi che l'agente AI di Simone esegue seguendo il brief qui sopra.
Prerequisito: VPS Ubuntu 22.04+ con accesso SSH e un dominio che punta all'IP del VPS.

### 1. Installa Docker

```bash
sudo apt update && sudo apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # poi esci e rientra in SSH
```

### 2. Scarica il codice

```bash
git clone https://github.com/WolCarloss/Rizzo-AI-Academy-Hardware-Hub.git
cd Rizzo-AI-Academy-Hardware-Hub
```

### 3. Configura i segreti (senza mai leggerli — vedi sezione dedicata)

```bash
cp .env.example .env
sed -i "s|^ADMIN_TOKEN=.*|ADMIN_TOKEN=$(openssl rand -hex 32)|" .env
chmod 600 .env
grep -c '^ADMIN_TOKEN=.' .env   # atteso: 1 — NON stampare il valore
```

### 4. Avvia

```bash
docker compose up -d --build
docker compose logs -f   # per vedere i log (Ctrl+C per uscire)
```

L'app è attiva sulla porta 3000. Il DB SQLite persiste nel volume `hardware-hub-data`:
per vederlo, `docker volume inspect hardware-hub-data`.

### 5. HTTPS con Caddy (consigliato)

Caddy è il reverse proxy più semplice: configura HTTPS automatico con Let's Encrypt.

```bash
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

Contenuto (sostituisci il dominio):

```
hardware.iltuodominio.it {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

Fatto: l'app è online in HTTPS. Caddy passa automaticamente `X-Forwarded-For`,
quindi il rate limit per IP funziona correttamente.

### 6. Operazioni comuni

```bash
docker compose up -d --build   # aggiornare dopo un `git pull`
docker compose restart         # riavvio
docker compose down            # stop (i dati restano nel volume)
docker compose exec hardware-hub sh   # shell dentro il container
```

### 7. Backup del database

I commenti della community sono il dato prezioso. Backup settimanale consigliato:

```bash
docker run --rm -v hardware-hub-data:/data -v $(pwd):/backup alpine \
  cp /data/hardware-hub.db /backup/backup-$(date +%Y%m%d).db
```

(oppure un cron con lo stesso comando).

## Immagini dei prodotti

Il seed scarica le immagini in `public/hardware-images` quando il prodotto ha URL
immagine configurati in `scripts/seed-data.mjs` (campo `image_urls`); se il download
fallisce genera automaticamente un **placeholder SVG locale** con nome e brand.
I file locali non si rompono mai (niente hotlink).

## Struttura

```
app/                    # Next.js App Router
  page.jsx              # home: catalogo con filtri
  hardware/[slug]/      # scheda prodotto + commenti
  admin/                # dashboard admin (protetta da token)
  api/hardware/...      # API pubbliche
  api/admin/...         # CRUD prodotti + moderazione (token o cookie)
  components/           # Card, Catalogo, Form commenti, Galleria, Stelle, Admin*
lib/                    # db.js (SQLite), rate-limit.js, security.js, admin-auth.js, placeholder.mjs
scripts/                # seed.mjs (+ seed-data.mjs), ensure-db.mjs
skills/                 # SKILL.md per agenti AI (gestione via REST)
mcp-server/             # server MCP opzionale (stdio, gira in locale all'agente)
public/hardware-images/ # immagini locali dei prodotti
data/                   # file SQLite (gitignored)
```
