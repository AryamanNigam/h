"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type Patient } from "@/lib/api"

interface PatientFormProps {
  patient?: Patient
  onClose: () => void
  onSuccess?: () => void
}

export function PatientForm({ patient, onClose, onSuccess }: PatientFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    Name: "",
    Age: "",
    Sex: "",
    Phone: "",
    Department: "",
    Diagnosis: "",
    Treatment: "",
    AdmissionDate: "",
    ExpectedDischargeDate: "",
    Height_cm: "",
    Weight_kg: "",
    Condition: "",
  })

  const [medicalHistory, setMedicalHistory] = useState({
    ChronicConditions: "",
    PastSurgeries: "",
    KnownAllergies: "",
    FamilyHistory: "",
  })

  useEffect(() => {
    if (patient) {
      setFormData({
        Name: patient.Name || "",
        Age: patient.Age?.toString() || "",
        Sex: patient.Sex || "",
        Phone: patient.Phone || "",
        Department: patient.Department || "",
        Diagnosis: patient.Diagnosis || "",
        Treatment: patient.Treatment || "",
        AdmissionDate: patient.AdmissionDate || "",
        ExpectedDischargeDate: patient.ExpectedDischargeDate || "",
        Height_cm: patient.Height_cm?.toString() || "",
        Weight_kg: patient.Weight_kg?.toString() || "",
        Condition: patient.Condition || "",
      })

      if (patient.medical_history) {
        setMedicalHistory({
          ChronicConditions: patient.medical_history.ChronicConditions || "",
          PastSurgeries: patient.medical_history.PastSurgeries || "",
          KnownAllergies: patient.medical_history.KnownAllergies || "",
          FamilyHistory: patient.medical_history.FamilyHistory || "",
        })
      }
    }
  }, [patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const patientData = {
        ...formData,
        Age: formData.Age ? Number.parseInt(formData.Age) : undefined,
        Height_cm: formData.Height_cm ? Number.parseFloat(formData.Height_cm) : undefined,
        Weight_kg: formData.Weight_kg ? Number.parseFloat(formData.Weight_kg) : undefined,
      }

      let savedPatient: Patient
      if (patient) {
        savedPatient = await api.updatePatient(patient.PatientID, patientData)
      } else {
        savedPatient = await api.createPatient(patientData)
      }

      // Save medical history if provided
      if (Object.values(medicalHistory).some((value) => value.trim())) {
        await api.addMedicalHistory(savedPatient.PatientID, medicalHistory)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Failed to save patient:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic patient details</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.Age}
                      onChange={(e) => setFormData({ ...formData, Age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex</Label>
                    <Select value={formData.Sex} onValueChange={(value) => setFormData({ ...formData, Sex: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.Phone}
                      onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                  <CardDescription>Clinical details and measurements</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.Department}
                      onValueChange={(value) => setFormData({ ...formData, Department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.Condition}
                      onValueChange={(value) => setFormData({ ...formData, Condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="Improving">Improving</SelectItem>
                        <SelectItem value="Deteriorating">Deteriorating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={formData.Height_cm}
                      onChange={(e) => setFormData({ ...formData, Height_cm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.Weight_kg}
                      onChange={(e) => setFormData({ ...formData, Weight_kg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admission">Admission Date</Label>
                    <Input
                      id="admission"
                      type="date"
                      value={formData.AdmissionDate}
                      onChange={(e) => setFormData({ ...formData, AdmissionDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discharge">Expected Discharge</Label>
                    <Input
                      id="discharge"
                      type="date"
                      value={formData.ExpectedDischargeDate}
                      onChange={(e) => setFormData({ ...formData, ExpectedDischargeDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      value={formData.Diagnosis}
                      onChange={(e) => setFormData({ ...formData, Diagnosis: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="treatment">Treatment</Label>
                    <Textarea
                      id="treatment"
                      value={formData.Treatment}
                      onChange={(e) => setFormData({ ...formData, Treatment: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Patient's past medical information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chronic">Chronic Conditions</Label>
                    <Textarea
                      id="chronic"
                      value={medicalHistory.ChronicConditions}
                      onChange={(e) => setMedicalHistory({ ...medicalHistory, ChronicConditions: e.target.value })}
                      placeholder="List any chronic conditions..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surgeries">Past Surgeries</Label>
                    <Textarea
                      id="surgeries"
                      value={medicalHistory.PastSurgeries}
                      onChange={(e) => setMedicalHistory({ ...medicalHistory, PastSurgeries: e.target.value })}
                      placeholder="List any past surgeries..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={medicalHistory.KnownAllergies}
                      onChange={(e) => setMedicalHistory({ ...medicalHistory, KnownAllergies: e.target.value })}
                      placeholder="List any known allergies..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family">Family History</Label>
                    <Textarea
                      id="family"
                      value={medicalHistory.FamilyHistory}
                      onChange={(e) => setMedicalHistory({ ...medicalHistory, FamilyHistory: e.target.value })}
                      placeholder="Relevant family medical history..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : patient ? "Update Patient" : "Add Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
