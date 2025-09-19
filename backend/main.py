import os
import json
import re
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# -------------------------
# Load env and init clients
# -------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Please set SUPABASE_URL and SUPABASE_KEY in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hugging Face / MedGemma config
HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "aaditya/Llama3-OpenBioLLM-8B";

if not HF_TOKEN:
    print("WARNING: HF_TOKEN environment variable not set. Inference API calls will fail.")

# -------------------------
# FastAPI app
# -------------------------
app = FastAPI(title="Smart EMR Backend with MedGemma")

# -------------------------
# CORS MIDDLEWARE
# -------------------------
# Using a wildcard for debugging. For production, restrict to your frontend domain.
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Root Endpoint (Health Check)
# -------------------------
@app.get("/")
def read_root():
    """Provides a simple health check endpoint."""
    return {"status": "ok", "message": "Welcome to the Smart EMR Backend API"}

# -------------------------
# Pydantic models
# -------------------------
class PatientCreate(BaseModel):
    PatientID: Optional[str] = None
    Name: str
    Age: Optional[int] = None
    Sex: Optional[str] = None
    Phone: Optional[str] = None
    Department: Optional[str] = None
    Diagnosis: Optional[str] = None
    Treatment: Optional[str] = None
    AdmissionDate: Optional[date] = None
    ExpectedDischargeDate: Optional[date] = None
    Height_cm: Optional[float] = None
    Weight_kg: Optional[float] = None
    Condition: Optional[str] = None

class PatientUpdate(BaseModel):
    Name: Optional[str] = None
    Age: Optional[int] = None
    Sex: Optional[str] = None
    Phone: Optional[str] = None
    Department: Optional[str] = None
    Diagnosis: Optional[str] = None
    Treatment: Optional[str] = None
    AdmissionDate: Optional[date] = None
    ExpectedDischargeDate: Optional[date] = None
    Height_cm: Optional[float] = None
    Weight_kg: Optional[float] = None
    Condition: Optional[str] = None

class MedicalHistoryIn(BaseModel):
    ChronicConditions: Optional[str] = None
    PastSurgeries: Optional[str] = None
    KnownAllergies: Optional[str] = None
    FamilyHistory: Optional[str] = None

class VitalsIn(BaseModel):
    Date: date
    heart_beat: int
    body_temperature: float
    Respitory_rate: int
    blood_pressure: str
    blood_glucose: int

class AnalyzeRequest(BaseModel):
    question: Optional[str] = None

class AskRequest(BaseModel):
    patient_id: str
    question: str

# -------------------------
# Helpers
# -------------------------
def parse_bp(bp_str: str):
    if not bp_str:
        return None, None
    m = re.match(r"^\s*(\d{2,3})\s*/\s*(\d{2,3})\s*$", str(bp_str))
    if not m:
        return None, None
    return int(m.group(1)), int(m.group(2))

def table_exists(table_name: str) -> bool:
    try:
        res = supabase.table(table_name).select("1").limit(1).execute()
        return not (hasattr(res, "error") and res.error)
    except Exception:
        return False

def fetch_patient(patient_id: str):
    res = supabase.table("patients").select("*").eq("PatientID", patient_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return res.data[0]

def fetch_medical_history(patient_id: str):
    res = supabase.table("patient_medical_history").select("*").eq("PatientID", patient_id).execute()
    return (res.data[0] if res.data else {})

def fetch_recent_vitals_timeseries(patient_id: str, days: int = 5):
    """
    Pulls vitals for the patient from the 5 separate day tables: vitals_day_1 ... vitals_day_5.
    Returns the most recent `days` entries sorted by Date ascending.
    """
    rows = []

    for d in range(1, min(days, 5)+1):
        table_name = f"vitals_{d}"
        if table_exists(table_name):
            res = supabase.table(table_name).select("*").eq("patient_id", patient_id).execute()
            if res.data:
                rows.extend(res.data)

    # Sort by Date ascending
    try:
        rows_sorted = sorted(rows, key=lambda r: datetime.fromisoformat(r.get("Date")))
    except Exception:
        rows_sorted = rows

    return rows_sorted[:days]


# -------------------------
# CRUD: Patients
# -------------------------
@app.post("/patients/", status_code=201)
def create_patient(p: PatientCreate):
    payload = p.dict(exclude_none=True)
    if not payload.get("PatientID"):
        allp = supabase.table("patients").select("PatientID").execute()
        nums = []
        for r in allp.data or []:
            pid = r.get("PatientID")
            if pid:
                m = re.search(r"(\d+)$", pid)
                if m:
                    nums.append(int(m.group(1)))
        nextn = (max(nums) + 1) if nums else 1
        payload["PatientID"] = f"PID-{nextn:03d}"
    res = supabase.table("patients").insert(payload).execute()
    return res.data[0]

@app.get("/patients/", status_code=200)
def list_patients():
    res = supabase.table("patients").select("*").execute()
    return res.data or []

@app.get("/patients/{patient_id}", status_code=200)
def get_patient(patient_id: str):
    patient = fetch_patient(patient_id)
    history = fetch_medical_history(patient_id)
    vitals = fetch_recent_vitals_timeseries(patient_id, days=5)
    patient["medical_history"] = history
    patient["recent_vitals"] = vitals
    return patient

@app.put("/patients/{patient_id}", status_code=200)
def update_patient(patient_id: str, p: PatientUpdate):
    payload = p.dict(exclude_none=True)
    res = supabase.table("patients").update(payload).eq("PatientID", patient_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return res.data[0]

@app.delete("/patients/{patient_id}", status_code=200)
def delete_patient(patient_id: str):
    supabase.table("patients").delete().eq("PatientID", patient_id).execute()
    return {"message": "Patient deleted"}

# -------------------------
# CRUD: Medical History
# -------------------------
@app.post("/patients/{patient_id}/history", status_code=201)
def add_history(patient_id: str, h: MedicalHistoryIn):
    payload = h.dict(exclude_none=True)
    payload["PatientID"] = patient_id
    existing = supabase.table("patient_medical_history").select("*").eq("PatientID", patient_id).execute()
    if existing.data:
        res = supabase.table("patient_medical_history").update(payload).eq("PatientID", patient_id).execute()
    else:
        res = supabase.table("patient_medical_history").insert(payload).execute()
    return res.data[0]

@app.get("/patients/{patient_id}/history", status_code=200)
def get_history(patient_id: str):
    return fetch_medical_history(patient_id)

@app.delete("/patients/{patient_id}/history", status_code=200)
def delete_history(patient_id: str):
    supabase.table("patient_medical_history").delete().eq("PatientID", patient_id).execute()
    return {"message": "Medical history deleted"}

# -------------------------
# Vitals: shift-on-insert logic
# -------------------------
def shift_day_tables_and_insert(patient_id: str, vitals_payload: Dict[str, Any]):
    max_day = 5
    if table_exists("vitals_day_5"):
        supabase.table("vitals_day_5").delete().execute()
    for d in range(max_day - 1, 0, -1):
        src = f"vitals_day_{d}"
        dst = f"vitals_day_{d+1}"
        if not table_exists(src):
            continue
        res = supabase.table(src).select("*").execute()
        rows = res.data or []
        for r in rows:
            r_clean = dict(r)
            r_clean.pop("id", None)
            supabase.table(dst).insert(r_clean).execute()
        supabase.table(src).delete().execute()
    if table_exists("vitals_day_1"):
        supabase.table("vitals_day_1").insert(vitals_payload).execute()
    else:
        supabase.table("patient_vitals_timeseries").insert(vitals_payload).execute()

@app.post("/patients/{patient_id}/vitals/shift", status_code=201)
def add_vitals_shift(patient_id: str, v: VitalsIn):
    payload = v.dict()
    payload["patient_id"] = patient_id
    payload["Date"] = payload.pop("Date").isoformat()
    shift_day_tables_and_insert(patient_id, payload)
    return {"message": "Vitals inserted with shift logic"}

# -------------------------
# Vitals timeseries CRUD
# -------------------------
@app.post("/patients/{patient_id}/vitals", status_code=201)
def add_vitals_timeseries(patient_id: str, v: VitalsIn):
    payload = v.dict()
    payload["patient_id"] = patient_id
    payload["Date"] = payload.pop("Date").isoformat()
    res = supabase.table("patient_vitals_timeseries").insert(payload).execute()
    return res.data[0]

@app.get("/patients/{patient_id}/vitals", status_code=200)
def get_recent_vitals(patient_id: str, days: int = Query(5, ge=1, le=30)):
    rows = fetch_recent_vitals_timeseries(patient_id, days=days)
    try:
        rows_sorted = sorted(rows, key=lambda r: datetime.fromisoformat(r.get("Date")), reverse=False)
    except Exception:
        rows_sorted = rows
    return rows_sorted

@app.put("/patients/{patient_id}/vitals", status_code=200)
def update_vitals(patient_id: str, v: VitalsIn):
    payload = v.dict()
    payload["Date"] = payload.pop("Date").isoformat()
    res = supabase.table("patient_vitals_timeseries").update(payload).eq("patient_id", patient_id).eq("Date", payload["Date"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vitals row not found")
    return res.data[0]

@app.delete("/patients/{patient_id}/vitals", status_code=200)
def delete_vitals(patient_id: str, date_str: str = Query(..., description="YYYY-MM-DD")):
    res = supabase.table("patient_vitals_timeseries").delete().eq("patient_id", patient_id).eq("Date", date_str).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vitals row not found")
    return {"message": "Vitals deleted"}

# -------------------------
# Graph Data
# -------------------------@app.get("/patients/{patient_id}/graph-data", status_code=200)
def graph_data(patient_id: str, days: int = Query(14, ge=1, le=365)):
    rows = fetch_recent_vitals_timeseries(patient_id, days=days)
    dates, hr, temp, systolic, diastolic, glucose = [], [], [], [], [], []

    for r in sorted(rows, key=lambda x: x.get("Date")):
        dates.append(r.get("Date"))
        
        # 🟢 CORRECTED KEYS BELOW to match VitalsIn model:
        hr.append(r.get("heart_beat"))
        temp.append(r.get("body_temperature"))
        
        # "blood_pressure" seems correct based on VitalsIn
        s, d = parse_bp(r.get("blood_pressure")) 
        systolic.append(s)
        diastolic.append(d)
        
        glucose.append(r.get("blood_glucose"))

    return {
        "dates": dates,
        "heart_rate": hr,
        "temperature": temp,
        "systolic": systolic,
        "diastolic": diastolic,
        "glucose": glucose
    }
# -------------------------
# MedGemma call
# -------------------------
def build_medgemma_prompt_text(patient, history, vitals, question: Optional[str]=None) -> str:
    lines = [
        f"Patient: {patient.get('Name', 'N/A')} (ID {patient.get('PatientID')})",
        f"Age: {patient.get('Age')}, Sex: {patient.get('Sex','N/A')}" if patient.get("Age") else "",
        "\nMedical History:",
        f"- Chronic conditions: {history.get('ChronicConditions','N/A')}",
        f"- Past surgeries: {history.get('PastSurgeries','N/A')}",
        f"- Allergies: {history.get('KnownAllergies','N/A')}",
        f"- Family history: {history.get('FamilyHistory','N/A')}",
        "\nRecent Vitals (most recent first):"
    ]
    for v in vitals:
        bp = v.get("blood pressure") or v.get("blood_pressure") or "N/A"
        lines.append(f"- {v.get('Date')}: HR={v.get('heart beat') or v.get('heart_beat','N/A')}, Temp={v.get('body temperature') or v.get('body_temperature','N/A')}°C, RR={v.get('Respitory rate') or v.get('respiratory_rate','N/A')}, BP={bp}, Glucose={v.get('blood glucose') or v.get('blood_glucose','N/A')} mg/dL")
    
    lines.extend([
        "\nTasks:",
        "1. Summarize the patient's current condition.",
        "2. Predict the patient's vitals for the next 24 hours.",
        "3. State whether the patient's overall trend is Improving, Stable, or Deteriorating.",
        "4. Provide a brief explanation for the trend assessment."
    ])
    if question:
        lines.append(f"5. Answer the clinician's question: {question}")
    
    lines.append("\nReturn response as JSON with keys: 'summary', 'predicted_vitals', 'trend', 'explanation', 'answer_to_question'.")
    return "\n".join(filter(None, lines))

def call_medgemma(prompt: str) -> Dict[str, Any]:
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN not configured for inference API")
    
    API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 400}}
    
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        if resp.status_code != 200:
            print("--- HUGGING FACE API ERROR ---")
            print(f"Status Code: {resp.status_code}")
            print(f"Response Body: {resp.text}")
            print("-----------------------------")
            raise HTTPException(
                status_code=resp.status_code, 
                detail=f"Hugging Face API error. Check backend terminal for details."
            )
            
        out = resp.json()
        txt = ""
        if isinstance(out, list) and out and "generated_text" in out[0]:
            txt = out[0]["generated_text"]
        else:
            return {"raw_response": out}
        
        try:
            json_match = re.search(r"\{.*\}", txt, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"raw_text": txt}
        except json.JSONDecodeError:
            return {"raw_text": txt, "error": "Failed to parse JSON."}

    except requests.exceptions.RequestException as e:
        print(f"Hugging Face API request failed: {e}")
        raise HTTPException(status_code=503, detail=f"Hugging Face API request failed: {e}")


# -------------------------
# Analysis Endpoints
# -------------------------
@app.post("/patients/{patient_id}/analyze", status_code=200)
def analyze_patient_endpoint(patient_id: str, req: AnalyzeRequest):
    patient = fetch_patient(patient_id)
    history = fetch_medical_history(patient_id)
    vitals = fetch_recent_vitals_timeseries(patient_id, days=5)
    if not vitals:
        raise HTTPException(status_code=404, detail="No vitals found for patient in any day table")
    prompt_text = build_medgemma_prompt_text(patient, history, vitals, req.question)
    llm_out = call_medgemma(prompt_text)
    return {
        "patient_id": patient_id,
        "medical_history": history,
        "recent_vitals": vitals,
        "llm_analysis": llm_out
    }


@app.post("/patients/{patient_id}/ask", status_code=200)
def ask_patient_question(patient_id: str, req: AskRequest):
    patient = fetch_patient(patient_id)
    history = fetch_medical_history(patient_id)
    vitals = fetch_recent_vitals_timeseries(patient_id, days=5)
    prompt_text = build_medgemma_prompt_text(patient, history, vitals, req.question)
    llm_out = call_medgemma(prompt_text)
    return {"patient_id": patient_id, "llm_analysis": llm_out}

# -------------------------
# Startup
# -------------------------
@app.on_event("startup")
def startup_event():
    print("✅ Smart EMR backend started. Supabase connected:", bool(SUPABASE_URL))
    print("Using Hugging Face Inference API for MedGemma.")
    if not HF_TOKEN:
        print("⚠️ WARNING: HF_TOKEN is not set. API calls to MedGemma will fail.")