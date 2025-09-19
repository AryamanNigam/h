# Local Development Setup Guide

## Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Your Python backend file ready

## Step 1: Download and Setup Frontend

1. **Download the ZIP** from v0 (three dots → Download ZIP)
2. **Extract** the ZIP file to your desired location
3. **Navigate** to the frontend directory:
   \`\`\`bash
   cd your-frontend-folder
   npm install
   \`\`\`

## Step 2: Configure Environment Variables

Create a `.env.local` file in the frontend root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
HF_TOKEN=your_hugging_face_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
\`\`\`

## Step 3: Setup Python Backend

1. **Create a backend folder** (separate from frontend)
2. **Copy your Python backend file** to this folder
3. **Install Python dependencies**:
   \`\`\`bash
   pip install fastapi uvicorn python-dotenv supabase requests
   \`\`\`

4. **Add CORS to your Python backend** (if not already added):
   \`\`\`python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   \`\`\`

## Step 4: Run Both Services

### Terminal 1 - Backend:
\`\`\`bash
cd your-backend-folder
uvicorn your_backend_file:app --reload --port 8000
\`\`\`

### Terminal 2 - Frontend:
\`\`\`bash
cd your-frontend-folder
npm run dev
\`\`\`

## Step 5: Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Troubleshooting

- **CORS errors**: Make sure CORS middleware is added to your Python backend
- **Environment variables**: Ensure `.env.local` file is in the frontend root
- **Port conflicts**: Change ports if 3000 or 8000 are already in use
- **Dependencies**: Run `npm install` in frontend and `pip install` for backend

Your EMR system will be fully functional locally with real-time data sync between frontend and backend!
\`\`\`

```json file="" isHidden
