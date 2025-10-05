FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
