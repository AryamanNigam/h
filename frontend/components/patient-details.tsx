"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, User, MessageSquare } from "lucide-react"
import { api, type Patient, type AIAnalysis } from "@/lib/api"
import { VitalsChart } from "./vitals-chart"

interface PatientDetailsProps {
  patient: Patient
  onClose: () => void
}

export function PatientDetails({ patient, onClose }: PatientDetailsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const generateAnalysis = async () => {
    setLoadingAnalysis(true)
    try {
      const result = await api.analyzePatient(patient.PatientID)
      setAnalysis(result)
    } catch (error) {
      console.error("Failed to generate analysis:", error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{patient.Name}</h2>
          <p className="text-muted-foreground">ID: {patient.PatientID}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Stable</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{patient.Age || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sex:</span>
                  <span>{patient.Sex || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{patient.Phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span>{patient.Height_cm ? `${patient.Height_cm} cm` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>{patient.Weight_kg ? `${patient.Weight_kg} kg` : "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Medical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span>{patient.Department || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition:</span>
                  <span>{patient.Condition || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission:</span>
                  <span>{patient.AdmissionDate || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Discharge:</span>
                  <span>{patient.ExpectedDischargeDate || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {patient.Diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.Diagnosis}</p>
              </CardContent>
            </Card>
          )}

          {patient.Treatment && (
            <Card>
              <CardHeader>
                <CardTitle>Treatment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.Treatment}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vitals">
          <VitalsChart patientId={patient.PatientID} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medical_history ? (
                <div className="space-y-4">
                  {patient.medical_history.ChronicConditions && (
                    <div>
                      <h4 className="font-semibold mb-2">Chronic Conditions</h4>
                      <p className="text-muted-foreground">{patient.medical_history.ChronicConditions}</p>
                    </div>
                  )}
                  {patient.medical_history.PastSurgeries && (
                    <div>
                      <h4 className="font-semibold mb-2">Past Surgeries</h4>
                      <p className="text-muted-foreground">{patient.medical_history.PastSurgeries}</p>
                    </div>
                  )}
                  {patient.medical_history.KnownAllergies && (
                    <div>
                      <h4 className="font-semibold mb-2">Known Allergies</h4>
                      <p className="text-muted-foreground">{patient.medical_history.KnownAllergies}</p>
                    </div>
                  )}
                  {patient.medical_history.FamilyHistory && (
                    <div>
                      <h4 className="font-semibold mb-2">Family History</h4>
                      <p className="text-muted-foreground">{patient.medical_history.FamilyHistory}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No medical history recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>AI Analysis</span>
              </CardTitle>
              <CardDescription>AI-powered patient condition analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8">
                  <Button onClick={generateAnalysis} disabled={loadingAnalysis}>
                    {loadingAnalysis ? "Generating Analysis..." : "Generate AI Analysis"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.llm_analysis.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-muted-foreground">{analysis.llm_analysis.summary}</p>
                    </div>
                  )}
                  {analysis.llm_analysis.trend && (
                    <div>
                      <h4 className="font-semibold mb-2">Trend</h4>
                      <Badge
                        variant={
                          analysis.llm_analysis.trend === "Improving"
                            ? "default"
                            : analysis.llm_analysis.trend === "Deteriorating"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {analysis.llm_analysis.trend}
                      </Badge>
                    </div>
                  )}
                  {analysis.llm_analysis.explanation && (
                    <div>
                      <h4 className="font-semibold mb-2">Explanation</h4>
                      <p className="text-muted-foreground">{analysis.llm_analysis.explanation}</p>
                    </div>
                  )}
                  {analysis.llm_analysis.predicted_vitals && (
                    <div>
                      <h4 className="font-semibold mb-2">Predicted Vitals (24h)</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(analysis.llm_analysis.predicted_vitals).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.llm_analysis.raw_text && (
                    <div>
                      <h4 className="font-semibold mb-2">Raw Analysis</h4>
                      <p className="text-muted-foreground text-sm">{analysis.llm_analysis.raw_text}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
