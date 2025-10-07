FROM node:20-slim
WORKDIR /app
# Use lockfile when available for reproducible installs
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
RUN npm run build
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]
EXPOSE 4000
CMD ["node", "dist/index.js"]
