# --- Builder stage: install full deps and compile TypeScript ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# --- Runtime stage: smaller image with prod deps only ---
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
# Copy build artifacts and necessary static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/avatars ./avatars
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]
EXPOSE 4000
CMD ["node", "dist/index.js"]
