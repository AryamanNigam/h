# EMR Full-Stack Application

This is a comprehensive Electronic Medical Records (EMR) system with a Next.js frontend and Python FastAPI backend.

## 🚀 Quick Local Setup

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed

### 1. Download Frontend
1. **Download ZIP** from v0 (three dots → Download ZIP)
2. **Extract** to your desired location
3. **Install dependencies:**
   \`\`\`bash
   cd your-frontend-folder
   npm install
   \`\`\`

### 2. Configure Frontend Environment
Create `.env.local` in the frontend root:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
HF_TOKEN=your_hugging_face_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
\`\`\`

### 3. Setup Python Backend
1. **Create backend folder** (separate from frontend)
2. **Copy your Python backend file** to this folder
3. **Install dependencies:**
   \`\`\`bash
   pip install fastapi uvicorn python-dotenv supabase requests
   \`\`\`
4. **Add CORS to your Python file:**
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

### 4. Run Both Services

**Terminal 1 - Backend:**
\`\`\`bash
cd your-backend-folder
uvicorn your_backend_file:app --reload --port 8000
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd your-frontend-folder
npm run dev
\`\`\`

### 5. Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ✨ Features
- Patient Management (CRUD operations)
- Vitals Tracking with Interactive Charts
- Medical History Management
- AI Chat with MedGemma Integration
- Real-time Data Visualization
- Responsive Design with Dark/Light Mode

## 🔧 Troubleshooting

**CORS Errors**: Ensure CORS middleware is added to your Python backend
**Environment Variables**: Check `.env.local` file is in frontend root
**Port Conflicts**: Change ports if 3000 or 8000 are already in use
**Dependencies**: Run `npm install` in frontend and `pip install` for backend

## 📡 API Endpoints
Your backend provides these endpoints:
- `GET /patients` - List all patients
- `POST /patients` - Create new patient
- `GET /patients/{id}` - Get patient details
- `PUT /patients/{id}` - Update patient
- `DELETE /patients/{id}` - Delete patient
- `POST /patients/{id}/vitals` - Add vitals
- `GET /patients/{id}/vitals` - Get vitals history
- `POST /patients/{id}/medical-history` - Add medical history
- `POST /ai/analyze-patient/{id}` - AI patient analysis
- `POST /ai/chat` - AI chat interface

Your EMR system will be fully functional locally with real-time data sync! 🏥
