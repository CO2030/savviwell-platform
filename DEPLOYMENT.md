# Deployment Guide

## Quick Start

1. **Clone and Setup**
```bash
git clone https://github.com/CO2030/savviwell-platform.git
cd savviwell-platform
npm install

cp .env.example .env
# Edit .env with your actual values

# Use your PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:port/database

# Use your PostgreSQL connection string
DATABASE_URL=postgresql://username:password@host:port/database

npm run dev

# Server setup
sudo apt update
sudo apt install nodejs npm postgresql

# Clone and setup
git clone https://github.com/CO2030/savviwell-platform.git
cd savviwell-platform
npm install

# Database setup
sudo -u postgres createdb smart_assistant
sudo -u postgres createuser --interactive

# Environment
cp .env.example .env
# Edit .env

# Start with PM2
npm install -g pm2
pm2 start "npm run start" --name smart-assistant
pm2 startup
pm2 save

# Push schema changes
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# Development
npm run dev

# Production build
npm run build

# Start production
npm run start

NODE_ENV=development npm run dev


Upload this as `DEPLOYMENT.md` in your repository root.


