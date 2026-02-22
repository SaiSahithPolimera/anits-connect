FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --production

# Copy application code
COPY server/ ./server/
COPY data/ ./data/
COPY files/ ./files/
COPY scripts/ ./scripts/

EXPOSE 3000

CMD ["node", "server/server.js"]
