"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Activity, MessageSquare, Plus } from "lucide-react"
import { PatientList } from "@/components/patient-list"
import { PatientForm } from "@/components/patient-form"
import { VitalsTracking } from "@/components/vitals-tracking"
import { AIChat } from "@/components/ai-chat"
import { api, type Patient } from "@/lib/api"
import { ConnectionStatus } from "@/components/connection-status"

export default function EMRDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    recentVitals: 0,
    aiAnalyses: 0,
  })
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setConnectionError(null)

      const patients = await api.getPatients()

      setDashboardStats({
        totalPatients: patients.length,
        recentVitals: patients.filter((p) => p.recent_vitals && p.recent_vitals.length > 0).length,
        aiAnalyses: 0, // This would need to be tracked separately
      })

      setRecentPatients(patients.slice(0, 5)) // Show last 5 patients
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "Not set"
      setConnectionError(`Cannot connect to backend at ${apiUrl}. Please check your setup.`)

      setDashboardStats({
        totalPatients: 0,
        recentVitals: 0,
        aiAnalyses: 0,
      })
      setRecentPatients([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-card-foreground">Smart EMR</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowPatientForm(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Patient</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {connectionError && (
          <Card className="border-destructive bg-destructive/5 mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Backend Connection Error</h3>
                <p className="text-destructive mb-4">{connectionError}</p>
                <div className="text-left max-w-2xl mx-auto space-y-3 text-sm bg-card p-4 rounded-lg">
                  <h4 className="font-semibold">Setup Instructions:</h4>
                  <div className="space-y-2">
                    <p>
                      <strong>1. Set Environment Variable:</strong>
                    </p>
                    <p className="ml-4 text-muted-foreground">
                      Go to Project Settings (gear icon) → Environment Variables
                    </p>
                    <p className="ml-4 text-muted-foreground">
                      Add: <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL = http://localhost:8000</code>
                    </p>

                    <p>
                      <strong>2. Start Python Backend:</strong>
                    </p>
                    <p className="ml-4 text-muted-foreground">Add CORS to your Python file, then run:</p>
                    <p className="ml-4 text-muted-foreground">
                      <code className="bg-muted px-1 rounded">uvicorn main:app --reload --port 8000</code>
                    </p>

                    <p>
                      <strong>3. Check Connection:</strong>
                    </p>
                    <p className="ml-4 text-muted-foreground">
                      Backend should be accessible at:{" "}
                      <code className="bg-muted px-1 rounded">http://localhost:8000</code>
                    </p>
                  </div>
                </div>
                <Button onClick={loadDashboardData} className="mt-4">
                  Retry Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <ConnectionStatus />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Patients</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Vitals</span>
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : dashboardStats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">Active patients</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Vitals</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : dashboardStats.recentVitals}</div>
                  <p className="text-xs text-muted-foreground">Patients with vitals</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.aiAnalyses}</div>
                  <p className="text-xs text-muted-foreground">Generated today</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patients</CardTitle>
                  <CardDescription>Latest patient registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : recentPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No patients registered yet</div>
                  ) : (
                    <div className="space-y-3">
                      {recentPatients.map((patient) => (
                        <div
                          key={patient.PatientID}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{patient.Name}</div>
                            <div className="text-sm text-muted-foreground">{patient.PatientID}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{patient.Department || "N/A"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="vitals">
            <VitalsTracking />
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChat />
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Form Modal */}
      {showPatientForm && (
        <PatientForm
          onClose={() => setShowPatientForm(false)}
          onSuccess={() => {
            setShowPatientForm(false)
            loadDashboardData() // Refresh dashboard data
          }}
        />
      )}
    </div>
  )
}
