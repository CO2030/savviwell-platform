# Architecture Decision: Monorepo vs Separate Repositories

## Recommended: Single Root (Monorepo)

### Current Structure (Recommended)


### Benefits of Monorepo
- **Simplified deployment**: One repository to manage
- **Shared types**: Easy import between frontend/backend
- **Atomic commits**: Frontend/backend changes in sync
- **Single dependency management**: Shared tools and configs
- **Easier development**: Everything in one place

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "tsc server/**/*.ts --outDir dist/server",
    "start": "node dist/server/index.js",
    "test": "npm run test:client && npm run test:server",
    "test:client": "cd client && npm run test",
    "test:server": "jest server/"
  }
}

smart-voice-assistant-frontend/
├── package.json
├── src/
└── dist/

smart-voice-assistant-backend/
├── package.json
├── src/
└── dist/

smart-voice-assistant-types/
├── package.json
└── src/

# Root .env (backend secrets)
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...

# client/.env (frontend config)
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Smart Voice Assistant

# Start everything
npm run dev

# Work on frontend
cd client && npm run dev

# Work on backend  
cd server && npm run dev

# Deploy
npm run build && npm run start


Upload this as `ARCHITECTURE.md` in your repository root.
