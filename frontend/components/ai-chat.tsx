"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react"
import { api, type Patient } from "@/lib/api"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  patientId?: string
  patientName?: string
}

export function AIChat() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !selectedPatient) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      patientId: selectedPatient,
      patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const analysis = await api.askQuestion(selectedPatient, inputMessage)

      let aiResponse = "I apologize, but I was unable to generate a response."

      if (analysis.llm_analysis) {
        if (analysis.llm_analysis.answer_to_question) {
          aiResponse = analysis.llm_analysis.answer_to_question
        } else if (analysis.llm_analysis.summary) {
          aiResponse = analysis.llm_analysis.summary
        } else if (analysis.llm_analysis.raw_text) {
          aiResponse = analysis.llm_analysis.raw_text
        }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
        patientId: selectedPatient,
        patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Failed to get AI response:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        patientId: selectedPatient,
        patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const generatePatientAnalysis = async () => {
    if (!selectedPatient) return

    setLoading(true)
    const analysisMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: "Generate a comprehensive analysis of this patient",
      timestamp: new Date(),
      patientId: selectedPatient,
      patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
    }

    setMessages((prev) => [...prev, analysisMessage])

    try {
      const analysis = await api.analyzePatient(selectedPatient)

      let aiResponse = "Analysis completed:\n\n"

      if (analysis.llm_analysis.summary) {
        aiResponse += `**Summary:** ${analysis.llm_analysis.summary}\n\n`
      }

      if (analysis.llm_analysis.trend) {
        aiResponse += `**Trend:** ${analysis.llm_analysis.trend}\n\n`
      }

      if (analysis.llm_analysis.explanation) {
        aiResponse += `**Explanation:** ${analysis.llm_analysis.explanation}\n\n`
      }

      if (analysis.llm_analysis.predicted_vitals) {
        aiResponse += `\n**Predicted Vitals (24h):**\n`
        Object.entries(analysis.llm_analysis.predicted_vitals).forEach(([key, value]) => {
          aiResponse += `- ${key}: ${value}\n`
        })
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
        patientId: selectedPatient,
        patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Failed to generate analysis:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I apologize, but I encountered an error while generating the analysis. Please try again.",
        timestamp: new Date(),
        patientId: selectedPatient,
        patientName: patients.find((p) => p.PatientID === selectedPatient)?.Name,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>AI Medical Assistant</span>
          </CardTitle>
          <CardDescription>
            Ask questions about patient conditions, get AI-powered analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="patient-select">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient for AI analysis" />
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
            <Button onClick={generatePatientAnalysis} disabled={!selectedPatient || loading} variant="outline">
              Generate Analysis
            </Button>
            <Button onClick={clearChat} disabled={messages.length === 0} variant="outline">
              Clear Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <Card className="h-96">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a patient and start asking questions</p>
                    <p className="text-sm mt-2">
                      Try asking: "What is the patient's current condition?" or "Analyze the vital trends"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type === "ai" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.patientName && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {message.patientName}
                          </Badge>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                      </div>
                      {message.type === "user" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 mt-4">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedPatient
                  ? "Ask about patient condition, vitals, or treatment recommendations..."
                  : "Select a patient first..."
              }
              disabled={!selectedPatient || loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!selectedPatient || !inputMessage.trim() || loading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Questions */}
          {selectedPatient && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Quick Questions:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "What is the patient's current condition?",
                  "Analyze the vital sign trends",
                  "What are the treatment recommendations?",
                  "Is the patient improving or deteriorating?",
                  "What should I monitor closely?",
                ].map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage(question)}
                    disabled={loading}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
