"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Edit, Trash2, Eye } from "lucide-react"
import { api, type Patient } from "@/lib/api"
import { PatientForm } from "./patient-form"
import { PatientDetails } from "./patient-details"

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await api.getPatients()
      setPatients(data)
    } catch (error) {
      console.error("Failed to load patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) return

    try {
      await api.deletePatient(patientId)
      await loadPatients()
    } catch (error) {
      console.error("Failed to delete patient:", error)
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.PatientID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.Department?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading patients...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>Manage patient records and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No patients found matching your search." : "No patients registered yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.PatientID}>
                      <TableCell className="font-mono">{patient.PatientID}</TableCell>
                      <TableCell className="font-medium">{patient.Name}</TableCell>
                      <TableCell>{patient.Age || "N/A"}</TableCell>
                      <TableCell>{patient.Department || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Stable</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient)
                              setShowDetails(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingPatient(patient)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(patient.PatientID)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Patient Modal */}
      {editingPatient && (
        <PatientForm
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSuccess={() => {
            setEditingPatient(null)
            loadPatients()
          }}
        />
      )}

      {/* Patient Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && <PatientDetails patient={selectedPatient} onClose={() => setShowDetails(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
