"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { api, type Patient } from "@/lib/api"

export function DashboardCharts() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const data = await api.getPatients()
      setPatients(data)
    } catch (error) {
      console.error("Failed to load patients:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Department distribution
  const departmentData = patients.reduce(
    (acc, patient) => {
      const dept = patient.Department || "Unassigned"
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const departmentChartData = Object.entries(departmentData).map(([name, value]) => ({
    name,
    value,
    patients: value,
  }))

  // Condition distribution
  const conditionData = patients.reduce(
    (acc, patient) => {
      const condition = patient.Condition || "Unknown"
      acc[condition] = (acc[condition] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const conditionChartData = Object.entries(conditionData).map(([name, value]) => ({
    name,
    value,
  }))

  // Age distribution
  const ageRanges = {
    "0-18": 0,
    "19-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
    Unknown: 0,
  }

  patients.forEach((patient) => {
    if (!patient.Age) {
      ageRanges["Unknown"]++
    } else if (patient.Age <= 18) {
      ageRanges["0-18"]++
    } else if (patient.Age <= 35) {
      ageRanges["19-35"]++
    } else if (patient.Age <= 50) {
      ageRanges["36-50"]++
    } else if (patient.Age <= 65) {
      ageRanges["51-65"]++
    } else {
      ageRanges["65+"]++
    }
  })

  const ageChartData = Object.entries(ageRanges).map(([range, count]) => ({
    range,
    count,
  }))

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Patients by Department</CardTitle>
          <CardDescription>Distribution of patients across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="patients" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Conditions</CardTitle>
          <CardDescription>Current patient condition status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conditionChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {conditionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Age Distribution</CardTitle>
          <CardDescription>Patient age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critical vs Stable</CardTitle>
          <CardDescription>Patient status overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="hsl(var(--destructive))" />
                <Cell fill="hsl(var(--chart-1))" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Status</CardTitle>
          <CardDescription>Overall patient condition overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Stable",
                    value: patients.length,
                  },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="hsl(var(--chart-1))" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
