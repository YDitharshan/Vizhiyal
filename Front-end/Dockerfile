FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# --host binds Vite to 0.0.0.0 so it is reachable outside the container
CMD ["npm", "run", "dev", "--", "--host"]
