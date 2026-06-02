#!/bin/sh
set -e

echo "⏳  Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss

echo "🌱  Seeding default superadmin..."
node prisma/seed.js

echo "🚀  Starting Vizhiyal API in dev mode (nodemon)..."
exec npm run dev
