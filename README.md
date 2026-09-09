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

### Percorso principale: Docker Compose

```bash
cp .env.example .env
# edita .env e imposta un ADMIN_TOKEN lungo e casuale
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

## Gestione da agenti AI (Skill o MCP)

Il sito è gestibile interamente da un agente AI remoto, in due modi:

1. **Skill (consigliata, universale)** — `skills/hardware-hub-admin/SKILL.md`:
   istruzioni pronte per qualsiasi agente (Kimi, Claude, ecc.) per chiamare le API REST
   con `curl`. Configura le variabili `HARDWARE_HUB_URL` e `HARDWARE_HUB_ADMIN_TOKEN`
   nell'ambiente dell'agente (mai nei prompt: vedi la Regola Zero in AGENTS.md).
2. **Server MCP (opzionale)** — `mcp-server/`: gira **in locale** sulla macchina
   dell'agente e parla con le API pubbliche. Setup:

```bash
cd mcp-server && npm install
# nell'agente (es. claude_desktop_config.json):
#   "hardware-hub": { "command": "node", "args": ["<percorso>/mcp-server/server.mjs"],
#     "env": { "HARDWARE_HUB_URL": "https://...", "HARDWARE_HUB_ADMIN_TOKEN": "..." } }
```

Tool MCP esposti: `list_products`, `create_product`, `update_product`, `delete_product`,
`list_comments`, `set_comment_visibility`, `delete_comment`.

## Pubblicazione su VPS Ubuntu (passo-passo)

Pensato per una persona non tecnica o per un agente AI. Prerequisito: un VPS Ubuntu 22.04+
con accesso SSH e (consigliato) un dominio che punta all'IP del VPS.

### 1. Installa Docker

```bash
sudo apt update && sudo apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # poi esci e rientra in SSH
```

### 2. Scarica il codice

```bash
git clone https://github.com/<tuo-utente>/Rizzo-AI-Academy-Hardware-Hub.git
cd Rizzo-AI-Academy-Hardware-Hub
```

### 3. Configura i segreti

```bash
cp .env.example .env
nano .env
# imposta ADMIN_TOKEN con un valore casuale, ad esempio generato con: openssl rand -hex 32
```

### 4. Avvia

```bash
docker compose up -d --build
docker compose logs -f   # per vedere i log (Ctrl+C per uscire)
```

L'app è attiva sulla porta 3000. Il DB SQLite persiste nel volume `hardware-hub-data`:
per vederlo, `docker volume inspect hardware-hub-data`.

### 5. (Consigliato) HTTPS con Caddy

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
