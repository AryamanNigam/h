"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Activity, AlertTriangle } from "lucide-react"
import { api, type Patient, type Vital } from "@/lib/api"
import { VitalsChart } from "./vitals-chart"

export function VitalsTracking() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [showVitalsForm, setShowVitalsForm] = useState(false)
  const [vitalsData, setVitalsData] = useState<Vital[]>([])
  const [loading, setLoading] = useState(false)

  const [vitalsForm, setVitalsForm] = useState({
    Date: new Date().toISOString().split("T")[0],
    heart_beat: "",
    body_temperature: "",
    Respitory_rate: "",
    blood_pressure: "",
    blood_glucose: "",
  })

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      loadVitals(selectedPatient)
    }
  }, [selectedPatient])

  const loadPatients = async () => {
    try {
      const data = await api.getPatients()
      
      // Normalize ID field to `patientId`
      const normalized = data.map(p => ({
        ...p,
        patientId: p.PatientID // convert main table ID to frontend-friendly name
      }))
      
      setPatients(normalized)
    } catch (error) {
      console.error("Failed to load patients:", error)
    }
  }
  

  const loadVitals = async (patientId: string) => {
    try {
      setLoading(true)
      const data = await api.getVitals(patientId, 14) // Get last 14 days
      setVitalsData(data)
    } catch (error) {
      console.error("Failed to load vitals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      setLoading(true)
      const vitalsPayload = {
        Date: vitalsForm.Date,
        heart_beat: Number.parseInt(vitalsForm.heart_beat),
        body_temperature: Number.parseFloat(vitalsForm.body_temperature),
        Respitory_rate: Number.parseInt(vitalsForm.Respitory_rate),
        blood_pressure: vitalsForm.blood_pressure,
        blood_glucose: Number.parseInt(vitalsForm.blood_glucose),
      }

      await api.addVitals(selectedPatient, vitalsPayload)
      await loadVitals(selectedPatient)
      setShowVitalsForm(false)
      setVitalsForm({
        Date: new Date().toISOString().split("T")[0],
        heart_beat: "",
        body_temperature: "",
        Respitory_rate: "",
        blood_pressure: "",
        blood_glucose: "",
      })
    } catch (error) {
      console.error("Failed to add vitals:", error)
    } finally {
      setLoading(false)
    }
  }

  const getVitalStatus = (vital: Vital) => {
    const reasons = []

    // Check temperature
    if (vital.body_temperature && vital.body_temperature >= 39.0) {
      reasons.push("High fever")
    }

    // Check blood glucose
    if (vital.blood_glucose && vital.blood_glucose >= 300) {
      reasons.push("Very high glucose")
    }

    // Check blood pressure
    if (vital.blood_pressure) {
      const [systolic, diastolic] = vital.blood_pressure.split("/").map(Number)
      if (systolic >= 180 || diastolic >= 120) {
        reasons.push("Hypertensive crisis")
      }
    }

    // Check heart rate
    if (vital.heart_beat && (vital.heart_beat >= 140 || vital.heart_beat <= 30)) {
      reasons.push("Abnormal heart rate")
    }

    return reasons
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Vitals Tracking</span>
          </CardTitle>
          <CardDescription>Monitor and record patient vital signs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="patient-select">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.PatientID} value={patient.PatientID}>
                      {patient.Name} ({patient.PatientID})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setShowVitalsForm(true)}
              disabled={!selectedPatient}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vitals</span>
            </Button>
          </div>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Vitals Chart */}
              <VitalsChart patientId={selectedPatient} />

              {/* Recent Vitals Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Vitals</CardTitle>
                  <CardDescription>Last 14 days of vital signs</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading vitals...</p>
                    </div>
                  ) : vitalsData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No vitals recorded for this patient</div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Heart Rate</TableHead>
                            <TableHead>Temperature</TableHead>
                            <TableHead>Respiratory Rate</TableHead>
                            <TableHead>Blood Pressure</TableHead>
                            <TableHead>Blood Glucose</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vitalsData.map((vital, index) => {
                            const criticalReasons = getVitalStatus(vital)
                            return (
                              <TableRow key={index}>
                                <TableCell>{vital.Date}</TableCell>
                                <TableCell>{vital.heart_beat || "N/A"} bpm</TableCell>
                                <TableCell>{vital.body_temperature || "N/A"}°C</TableCell>
                                <TableCell>{vital.Respitory_rate || "N/A"} /min</TableCell>
                                <TableCell>{vital.blood_pressure || "N/A"} mmHg</TableCell>
                                <TableCell>{vital.blood_glucose || "N/A"} mg/dL</TableCell>
                                <TableCell>
                                  {criticalReasons.length > 0 ? (
                                    <Badge variant="destructive" className="flex items-center space-x-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>Critical</span>
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Normal</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vitals Modal */}
      <Dialog open={showVitalsForm} onOpenChange={setShowVitalsForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vital Signs</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitVitals} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={vitalsForm.Date}
                onChange={(e) => setVitalsForm({ ...vitalsForm, Date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heart-rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart-rate"
                  type="number"
                  value={vitalsForm.heart_beat}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, heart_beat: e.target.value })}
                  placeholder="e.g., 72"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Body Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={vitalsForm.body_temperature}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, body_temperature: e.target.value })}
                  placeholder="e.g., 36.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respiratory">Respiratory Rate (/min)</Label>
                <Input
                  id="respiratory"
                  type="number"
                  value={vitalsForm.Respitory_rate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, Respitory_rate: e.target.value })}
                  placeholder="e.g., 16"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood-pressure">Blood Pressure (mmHg)</Label>
                <Input
                  id="blood-pressure"
                  value={vitalsForm.blood_pressure}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                  placeholder="e.g., 120/80"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
                <Input
                  id="glucose"
                  type="number"
                  value={vitalsForm.blood_glucose}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, blood_glucose: e.target.value })}
                  placeholder="e.g., 95"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setShowVitalsForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Vitals"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
