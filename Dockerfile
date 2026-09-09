# ---------- Build stage ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 usa binari precompilati su glibc; questi tool servono solo da fallback
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Il DB e le immagini NON entrano nell'immagine: sono dati runtime
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/scripts ./scripts

# Directory dati SQLite (montare un volume qui per persistere)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000
ENV PORT=3000
# All'avvio: crea schema DB, popola il catalogo se vuoto, avvia il server
CMD ["sh", "-c", "npm run seed && npm run start"]
