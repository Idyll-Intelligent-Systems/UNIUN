FROM node:20-slim
WORKDIR /app
# Copy only package.json to avoid stale lockfile bringing native bcrypt
COPY package.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
