FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# postgresql client provides pg_dump for the Backup & Recovery feature.
# pg_dump must be >= the database server version, so install the newest client
# available (works against older servers too). Falls back across majors.
# Placed after npm install so changing it doesn't bust the slow deps layer.
RUN apk add --no-cache postgresql18-client \
 || apk add --no-cache postgresql17-client \
 || apk add --no-cache postgresql16-client

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["sh", "entrypoint.sh"]
