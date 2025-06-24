# Development Guide

## Architecture Overview

### Current Setup
The project uses a monorepo structure with frontend and backend in the same repository but clearly separated:


### Frontend-Backend Separation

#### Frontend (`/client`)
- **Purpose**: User interface, user experience, client-side logic
- **Technology**: React, TypeScript, Tailwind CSS, Vite
- **Responsibilities**:
  - UI components and pages
  - Client-side state management
  - API calls to backend
  - Image processing and compression
  - Camera/media device handling

#### Backend (`/server`) 
- **Purpose**: API server, business logic, external integrations
- **Technology**: Express, TypeScript, Node.js
- **Responsibilities**:
  - API endpoints and routing
  - Database operations
  - OpenAI API integration
  - Authentication and authorization
  - File upload handling
  - Data validation and processing

## API Key Management

### Current Implementation
```javascript
// server/index.ts - API keys are server-side only
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

# .env (never commit to git)
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_...

// ❌ NEVER do this in frontend
const openai = new OpenAI({ 
  apiKey: 'sk-...' // Exposed to browser!
});

// ✅ Correct: Backend only
// server/routes.ts
const response = await openai.chat.completions.create({...});

// ✅ Frontend calls backend endpoints
const response = await apiRequest("POST", "/api/pantry/scan", { image });
// Backend handles OpenAI integration internally

smart-voice-assistant/
├── frontend/           # React app (port 3000)
├── api-server/         # Express API (port 5000)
├── ai-service/         # OpenAI integration (port 5001)
├── auth-service/       # Authentication (port 5002)
└── shared-types/       # Common TypeScript types

smart-voice-assistant-frontend/    # React repo
smart-voice-assistant-backend/     # Express repo  
smart-voice-assistant-shared/      # Shared types npm package

NODE_ENV=production
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://prod-db-url
API_BASE_URL=https://your-api.com
FRONTEND_URL=https://your-app.com

// User management
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

// Pantry operations
GET    /api/pantry
POST   /api/pantry/scan
POST   /api/pantry/items
PUT    /api/pantry/items/:id
DELETE /api/pantry/items/:id

// Nutrition tracking
GET    /api/nutrition/today
POST   /api/nutrition/log-meal
GET    /api/nutrition/history

// Consistent error responses
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE",
    "message": "The uploaded image format is not supported",
    "details": "Only JPEG and PNG formats are allowed"
  }
}

// server/services/new-service.ts
import { ApiClient } from './base-client';

export class NewService {
  private client: ApiClient;
  
  constructor() {
    this.client = new ApiClient({
      apiKey: process.env.NEW_SERVICE_API_KEY,
      baseUrl: process.env.NEW_SERVICE_BASE_URL
    });
  }
  
  async processData(input: any) {
    try {
      const response = await this.client.post('/endpoint', input);
      return response.data;
    } catch (error) {
      console.error('New service error:', error);
      throw new Error('Failed to process data');
    }
  }
}

# New Service Configuration
NEW_SERVICE_API_KEY=your-key-here
NEW_SERVICE_BASE_URL=https://api.newservice.com
NEW_SERVICE_TIMEOUT=30000
NEW_SERVICE_RATE_LIMIT=100

// Test frontend without real API calls
describe('Scanner Component', () => {
  beforeEach(() => {
    // Mock API responses
    fetchMock.post('/api/pantry/scan', { success: true, items: [] });
  });
  
  it('should handle scan results', async () => {
    render(<PantryScanner />);
    // Test UI interactions
  });
});


