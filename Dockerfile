# ---- Stage 1: Build Frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npx vite build

# ---- Stage 2: Build Server (compile TypeScript) ----
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---- Stage 3: Production Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled server
COPY --from=server-builder /app/server/dist/ ./server/dist/

# Copy database schema (must be next to compiled connection.js in dist/db/)
COPY --from=server-builder /app/server/src/db/schema.sql ./server/dist/db/

# Copy built frontend static files
COPY --from=frontend-builder /app/client/dist/ ./client/dist/

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/notes.db

CMD ["node", "server/dist/index.js"]
