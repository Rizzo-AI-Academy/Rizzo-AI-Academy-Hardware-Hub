// Server MCP (stdio) per amministrare da remoto l'Hardware Hub.
// Gira in LOCALE sulla macchina dell'agente e chiama le API REST del sito pubblico:
// non serve alcun accesso alla VPS.
//
// Configurazione (variabili d'ambiente, MAI nel codice):
//   HARDWARE_HUB_URL          es. https://hardware.esempio.it
//   HARDWARE_HUB_ADMIN_TOKEN  il token admin (ADMIN_TOKEN del server)
//
// Esempio configurazione Claude Desktop (claude_desktop_config.json):
//   "hardware-hub": {
//     "command": "node",
//     "args": ["C:/percorso/Rizzo-AI-Academy-Hardware-Hub/mcp-server/server.mjs"],
//     "env": { "HARDWARE_HUB_URL": "https://...", "HARDWARE_HUB_ADMIN_TOKEN": "..." }
//   }
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE = (process.env.HARDWARE_HUB_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.HARDWARE_HUB_ADMIN_TOKEN || '';

if (!BASE || !TOKEN) {
  console.error('Configura HARDWARE_HUB_URL e HARDWARE_HUB_ADMIN_TOKEN nelle variabili d\'ambiente.');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

const specsSchema = z
  .object({
    cpu: z.string().optional(),
    ram: z.string().optional(),
    gpu_npu: z.string().optional(),
    tops_ai: z.string().optional(),
    storage: z.string().optional(),
    power_w: z.string().optional(),
    os: z.string().optional(),
  })
  .optional();

const server = new McpServer({ name: 'hardware-hub-admin', version: '1.0.0' });

server.tool(
  'list_products',
  'Elenca tutti i prodotti hardware del catalogo (con conteggi commenti, anche nascosti)',
  {},
  async () => ok(await api('GET', '/api/admin/hardware'))
);

server.tool(
  'create_product',
  'Crea un nuovo prodotto hardware AI nel catalogo. NON inventare prezzi: price_eur null se non verificabile da fonte ufficiale.',
  {
    name: z.string().describe('Nome prodotto, es. "Mac mini M5"'),
    brand: z.string().optional().describe('Marca, es. "Apple"'),
    category: z
      .string()
      .describe('Categoria: Apple | Mini PC | Mini PC Windows | Workstation | Schede sviluppo (o nuova)'),
    price_eur: z.number().nullable().optional().describe('Prezzo in euro; null se non verificabile'),
    price_note: z.string().optional().describe('Fonte/data del prezzo, es. "Listino Apple Italia, ottobre 2024"'),
    description: z.string().optional(),
    specs: specsSchema,
    buy_links: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional()
      .describe('Link "Dove comprarlo" (siti ufficiali)'),
    image_url: z.string().url().optional().describe('URL immagine ufficiale da scaricare in locale'),
    slug: z.string().optional().describe('Slug URL (default: generato dal nome)'),
  },
  async (input) => ok(await api('POST', '/api/admin/hardware', input))
);

server.tool(
  'update_product',
  'Aggiorna i campi di un prodotto esistente (solo i campi forniti cambiano)',
  {
    id: z.number().int().positive(),
    name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    price_eur: z.number().nullable().optional(),
    price_note: z.string().optional(),
    description: z.string().optional(),
    specs: specsSchema,
    buy_links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
    image_url: z.string().optional().describe('URL nuova immagine, oppure "" per rigenerare il placeholder'),
  },
  async ({ id, ...fields }) => ok(await api('PATCH', `/api/admin/hardware/${id}`, fields))
);

server.tool(
  'delete_product',
  'Elimina un prodotto e TUTTI i suoi commenti (irreversibile — chiedi conferma all\'utente prima)',
  { id: z.number().int().positive() },
  async ({ id }) => ok(await api('DELETE', `/api/admin/hardware/${id}`))
);

server.tool(
  'list_comments',
  'Elenca tutti i commenti del sito, inclusi quelli nascosti, dal più recente',
  {},
  async () => ok(await api('GET', '/api/admin/comments'))
);

server.tool(
  'set_comment_visibility',
  'Nascondi o mostra un commento (moderazione soft, consigliata rispetto all\'eliminazione)',
  {
    id: z.number().int().positive(),
    hidden: z.boolean().describe('true = nascondi al pubblico, false = mostra'),
  },
  async (input) => ok(await api('PATCH', '/api/admin/comments', input))
);

server.tool(
  'delete_comment',
  'Elimina definitivamente un commento (irreversibile — chiedi conferma all\'utente prima)',
  { id: z.number().int().positive() },
  async ({ id }) => ok(await api('DELETE', '/api/admin/comments', { id }))
);

const transport = new StdioServerTransport();
await server.connect(transport);
