// API configuration and helper functions
import axios, { type AxiosResponse } from "axios"

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
console.log("[v0] API Base URL:", baseURL)

const api_client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
})

api_client.interceptors.request.use(
  (config) => {
    console.log("[v0] Making API request:", config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.log("[v0] Request error:", error)
    return Promise.reject(error)
  },
)

api_client.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[v0] API response success:", response.status, response.config.url)
    return response
  },
  (error) => {
    console.log("[v0] API response error:", error.code, error.message)
    console.log("[v0] Error details:", {
      response: error.response?.status,
      request: !!error.request,
      message: error.message,
    })

    let errorMessage = "Network error occurred"

    if (error.response) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`
      if (error.response.data?.detail) {
        errorMessage = error.response.data.detail
      }
    } else if (error.request) {
      errorMessage = "No response from server. Please check if the backend is running."
    } else {
      errorMessage = error.message
    }

    throw new Error(errorMessage)
  },
)

export interface Patient {
  PatientID: string
  Name: string
  Age?: number
  Sex?: string
  Phone?: string
  Department?: string
  Diagnosis?: string
  Treatment?: string
  AdmissionDate?: string
  ExpectedDischargeDate?: string
  Height_cm?: number
  Weight_kg?: number
  Condition?: string
  medical_history?: MedicalHistory
  recent_vitals?: Vital[]
}

export interface MedicalHistory {
  PatientID: string
  ChronicConditions?: string
  PastSurgeries?: string
  KnownAllergies?: string
  FamilyHistory?: string
}

export interface Vital {
  Date: string
  heart_beat?: number
  body_temperature?: number
  Respitory_rate?: number
  blood_pressure?: string
  blood_glucose?: number
  "patient id": string
}

export interface GraphData {
  dates: string[]
  heart_rate: (number | null)[]
  temperature: (number | null)[]
  systolic: (number | null)[]
  diastolic: (number | null)[]
  glucose: (number | null)[]
}

export interface AIAnalysis {
  patient_id: string
  medical_history: MedicalHistory
  recent_vitals: Vital[]
  llm_analysis: {
    summary?: string
    predicted_vitals?: Record<string, any>
    trend?: string
    explanation?: string
    answer_to_question?: string
    raw_text?: string
    error?: string
  }
}

// Mock data for v0 preview when backend is unavailable
const mockPatients: Patient[] = [
  {
    PatientID: "P001",
    Name: "John Smith",
    Age: 45,
    Sex: "Male",
    Phone: "+1-555-0123",
    Department: "Cardiology",
    Diagnosis: "Hypertension",
    Treatment: "ACE inhibitors, lifestyle changes",
    AdmissionDate: "2024-01-15",
    ExpectedDischargeDate: "2024-01-20",
    Height_cm: 175,
    Weight_kg: 80,
    Condition: "Stable",
    recent_vitals: [
      {
        Date: "2024-01-18",
        heart_beat: 78,
        body_temperature: 98.6,
        Respitory_rate: 16,
        blood_pressure: "140/90",
        blood_glucose: 110,
        "patient id": "P001",
      },
    ],
  },
  {
    PatientID: "P002",
    Name: "Sarah Johnson",
    Age: 32,
    Sex: "Female",
    Phone: "+1-555-0124",
    Department: "Emergency",
    Diagnosis: "Acute appendicitis",
    Treatment: "Emergency surgery scheduled",
    AdmissionDate: "2024-01-18",
    ExpectedDischargeDate: "2024-01-22",
    Height_cm: 165,
    Weight_kg: 65,
    Condition: "Stable",
    recent_vitals: [
      {
        Date: "2024-01-18",
        heart_beat: 95,
        body_temperature: 102.3,
        Respitory_rate: 22,
        blood_pressure: "120/80",
        blood_glucose: 95,
        "patient id": "P002",
      },
    ],
  },
  {
    PatientID: "P003",
    Name: "Michael Davis",
    Age: 67,
    Sex: "Male",
    Phone: "+1-555-0125",
    Department: "Orthopedics",
    Diagnosis: "Hip fracture",
    Treatment: "Hip replacement surgery",
    AdmissionDate: "2024-01-16",
    ExpectedDischargeDate: "2024-01-25",
    Height_cm: 180,
    Weight_kg: 85,
    Condition: "Stable",
    recent_vitals: [
      {
        Date: "2024-01-18",
        heart_beat: 72,
        body_temperature: 98.4,
        Respitory_rate: 18,
        blood_pressure: "130/85",
        blood_glucose: 105,
        "patient id": "P003",
      },
    ],
  },
]

const isV0Preview = () => {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.app") ||
      window.location.hostname.includes("v0.dev") ||
      window.location.hostname.includes("localhost:3000") ||
      !process.env.NEXT_PUBLIC_API_URL)
  )
}

// API functions
export const api = {
  // Patients
  async getPatients(): Promise<Patient[]> {
    if (isV0Preview()) {
      console.log("[v0] Using mock data for v0 preview")
      return mockPatients
    }

    try {
      const response = await api_client.get("/patients/")
      return response.data
    } catch (error) {
      console.error("API Error - getPatients:", error)
      throw new Error(`Failed to fetch patients: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getPatient(patientId: string): Promise<Patient> {
    if (isV0Preview()) {
      const mockPatient = mockPatients.find((p) => p.PatientID === patientId)
      if (mockPatient) return mockPatient
      throw new Error("Patient not found")
    }

    try {
      const response = await api_client.get(`/patients/${patientId}`)
      return response.data
    } catch (error) {
      console.error("API Error - getPatient:", error)
      throw new Error(`Failed to fetch patient: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async createPatient(patient: Omit<Patient, "PatientID">): Promise<Patient> {
    try {
      const response = await api_client.post("/patients/", patient)
      return response.data
    } catch (error) {
      console.error("API Error - createPatient:", error)
      throw new Error(`Failed to create patient: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async updatePatient(patientId: string, patient: Partial<Patient>): Promise<Patient> {
    try {
      const response = await api_client.put(`/patients/${patientId}`, patient)
      return response.data
    } catch (error) {
      console.error("API Error - updatePatient:", error)
      throw new Error(`Failed to update patient: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async deletePatient(patientId: string): Promise<void> {
    try {
      await api_client.delete(`/patients/${patientId}`)
    } catch (error) {
      console.error("API Error - deletePatient:", error)
      throw new Error(`Failed to delete patient: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  // Medical History
  async addMedicalHistory(patientId: string, history: Omit<MedicalHistory, "PatientID">): Promise<MedicalHistory> {
    try {
      const response = await api_client.post(`/patients/${patientId}/history`, history)
      return response.data
    } catch (error) {
      console.error("API Error - addMedicalHistory:", error)
      throw new Error(`Failed to add medical history: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getMedicalHistory(patientId: string): Promise<MedicalHistory> {
    try {
      const response = await api_client.get(`/patients/${patientId}/history`)
      return response.data
    } catch (error) {
      console.error("API Error - getMedicalHistory:", error)
      throw new Error(`Failed to fetch medical history: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  // Vitals
  async addVitals(patientId: string, vitals: Omit<Vital, "patient id">): Promise<Vital> {
    try {
      const response = await api_client.post(`/patients/${patientId}/vitals/shift`, vitals)
      return response.data
    } catch (error) {
      console.error("API Error - addVitals:", error)
      throw new Error(`Failed to add vitals: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getVitals(patientId: string, days = 5): Promise<Vital[]> {
    try {
      const response = await api_client.get(`/patients/${patientId}/vitals?days=${days}`)
      return response.data
    } catch (error) {
      console.error("API Error - getVitals:", error)
      throw new Error(`Failed to fetch vitals: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getGraphData(patientId: string, days = 14): Promise<GraphData> {
    try {
      const response = await api_client.get(`/patients/${patientId}/graph-data?days=${days}`)
      return response.data
    } catch (error) {
      console.error("API Error - getGraphData:", error)
      throw new Error(`Failed to fetch graph data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  // AI Analysis
  async analyzePatient(patientId: string, question?: string): Promise<AIAnalysis> {
    try {
      const response = await api_client.post(`/patients/${patientId}/analyze`, { question })
      return response.data
    } catch (error) {
      console.error("API Error - analyzePatient:", error)
      throw new Error(`Failed to analyze patient: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async askQuestion(patientId: string, question: string): Promise<AIAnalysis> {
    try {
      const response = await api_client.post(`/patients/${patientId}/ask`, { patient_id: patientId, question })
      return response.data
    } catch (error) {
      console.error("API Error - askQuestion:", error)
      throw new Error(`Failed to ask question: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },
}
