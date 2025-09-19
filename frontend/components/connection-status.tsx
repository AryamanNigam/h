"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function ConnectionStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    setStatus("checking")
    try {
      const response = await fetch(`${API_BASE_URL}/patients/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setStatus("connected")
      } else {
        setStatus("disconnected")
      }
    } catch (error) {
      setStatus("disconnected")
    }
    setLastChecked(new Date())
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "disconnected":
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "checking":
        return <Badge variant="secondary">Checking...</Badge>
      case "connected":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
    }
  }

  if (status === "connected") {
    return null // Don't show anything when connected
  }

  return (
    <Card className="border-destructive bg-destructive/5 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">Backend Connection</span>
            {getStatusBadge()}
          </div>
          <Button onClick={checkConnection} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        {status === "disconnected" && (
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Cannot connect to backend</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Trying to connect to: <code className="bg-muted px-1 rounded">{API_BASE_URL}</code>
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Setup Checklist:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-muted-foreground rounded-sm"></div>
                  <span>Python FastAPI backend is running on port 8000</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-muted-foreground rounded-sm"></div>
                  <span>CORS middleware is added to your FastAPI app</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-muted-foreground rounded-sm"></div>
                  <span>Environment variables are set in Project Settings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-muted-foreground rounded-sm"></div>
                  <span>Supabase database is configured and accessible</span>
                </div>
              </div>
            </div>

            <details className="bg-muted p-4 rounded-lg">
              <summary className="font-medium cursor-pointer">Show detailed setup instructions</summary>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <h5 className="font-medium">1. Add CORS to your Python backend:</h5>
                  <pre className="bg-background p-2 rounded mt-1 text-xs overflow-x-auto">
                    {`from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`}
                  </pre>
                </div>

                <div>
                  <h5 className="font-medium">2. Install dependencies and run backend:</h5>
                  <pre className="bg-background p-2 rounded mt-1 text-xs">
                    {`pip install fastapi uvicorn supabase python-dotenv requests
uvicorn your_backend_file:app --reload --port 8000`}
                  </pre>
                </div>

                <div>
                  <h5 className="font-medium">3. Set environment variables in v0 Project Settings:</h5>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      <code>NEXT_PUBLIC_API_URL</code> = <code>http://localhost:8000</code>
                    </li>
                    <li>
                      <code>HF_TOKEN</code> = Your Hugging Face API token
                    </li>
                    <li>
                      <code>SUPABASE_URL</code> = Your Supabase project URL
                    </li>
                    <li>
                      <code>SUPABASE_KEY</code> = Your Supabase anon key
                    </li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}

        {lastChecked && (
          <p className="text-xs text-muted-foreground mt-4">Last checked: {lastChecked.toLocaleTimeString()}</p>
        )}
      </CardContent>
    </Card>
  )
}
