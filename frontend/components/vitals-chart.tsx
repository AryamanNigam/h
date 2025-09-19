"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { api, type GraphData } from "@/lib/api"

interface VitalsChartProps {
  patientId: string
}

export function VitalsChart({ patientId }: VitalsChartProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState("all")
  const [days, setDays] = useState(14)

  useEffect(() => {
    if (patientId) loadGraphData()
  }, [patientId, days])

  const loadGraphData = async () => {
    try {
      setLoading(true)
      const data = await api.getGraphData(patientId, days)
      console.log("Graph API response:", data)
      setGraphData(data)
    } catch (error) {
      console.error("Failed to load graph data:", error)
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!graphData || !graphData.dates || graphData.dates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vitals Trends</CardTitle>
          <CardDescription>No data available for visualization</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No vitals data to display
        </CardContent>
      </Card>
    )
  }

  // Transform parallel arrays into objects for Recharts
  const chartData = graphData.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(),
    heartRate: graphData.heart_rate?.[index] ?? null,
    temperature: graphData.temperature?.[index] ?? null,
    systolic: graphData.systolic?.[index] ?? null,
    diastolic: graphData.diastolic?.[index] ?? null,
    glucose: graphData.glucose?.[index] ?? null,
  }))

  const renderChart = () => {
    switch (selectedMetric) {
      case "heart-rate":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="hsl(var(--chart-1))"
                name="Heart Rate (bpm)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case "temperature":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="hsl(var(--chart-2))"
                name="Temperature (°C)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case "blood-pressure":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="hsl(var(--chart-3))"
                name="Systolic (mmHg)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-3))" }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="hsl(var(--chart-4))"
                name="Diastolic (mmHg)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-4))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case "glucose":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="glucose"
                stroke="hsl(var(--chart-5))"
                name="Blood Glucose (mg/dL)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-5))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="heartRate"
                stroke="hsl(var(--chart-1))"
                name="Heart Rate (bpm)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="hsl(var(--chart-2))"
                name="Temperature (°C)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="systolic"
                stroke="hsl(var(--chart-3))"
                name="Systolic (mmHg)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="diastolic"
                stroke="hsl(var(--chart-4))"
                name="Diastolic (mmHg)"
                strokeWidth={2}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="glucose"
                stroke="hsl(var(--chart-5))"
                name="Blood Glucose (mg/dL)"
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vitals Trends</CardTitle>
        <CardDescription>Patient vital signs over time</CardDescription>
        <div className="flex items-center space-x-4 mt-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vitals</SelectItem>
              <SelectItem value="heart-rate">Heart Rate</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="blood-pressure">Blood Pressure</SelectItem>
              <SelectItem value="glucose">Blood Glucose</SelectItem>
            </SelectContent>
          </Select>
          <Select value={days.toString()} onValueChange={(value) => setDays(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="py-4 h-[400px]">{renderChart()}</CardContent>
    </Card>
  )
}
