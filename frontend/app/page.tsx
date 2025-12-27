"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "motion/react"
import { ChatInterface, ChatMessage } from "@/components/chat-interface"
import { ComicDisplay, Panel } from "@/components/comic-display"
import { generateSessionId, generateUserId, runComicAgent, createSession, AgentEvent } from "@/lib/api"
import { Sparkles, BookOpen, Image as ImageIcon, Volume2, RefreshCcw } from "lucide-react"
import { UserAuthButton } from "@/components/auth/user-auth-button"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { uploadImageFromUrl, uploadAudioFromBase64 } from "@/lib/supabase/storage"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [panels, setPanels] = useState<Panel[]>([])
  const [storyTitle, setStoryTitle] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userId] = useState(() => generateUserId())
  const [sessionId, setSessionId] = useState(() => generateSessionId())
  const [sessionCreated, setSessionCreated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  // Track authenticated user for storage uploads
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Upload panel media to Supabase Storage
  const uploadPanelMedia = async (panels: Panel[], comicId: string): Promise<Panel[]> => {
    if (!user) {
      console.log("[Storage] User not authenticated, skipping upload")
      return panels
    }

    console.log("[Storage] Uploading media for", panels.length, "panels")

    const uploadedPanels = await Promise.all(
      panels.map(async (panel) => {
        const updatedPanel = { ...panel }

        // Upload image if it exists and is a URL (not already a Supabase URL)
        if (panel.imageUrl && !panel.imageUrl.includes('supabase')) {
          const imagePath = `${user.id}/${comicId}/panel_${panel.panelId}.png`
          console.log(`[Storage] Uploading image for panel ${panel.panelId}...`)
          const { url, error } = await uploadImageFromUrl(panel.imageUrl, imagePath)
          if (url && !error) {
            console.log(`[Storage] Image uploaded: ${url}`)
            updatedPanel.imageUrl = url
          } else {
            console.error(`[Storage] Image upload failed:`, error)
          }
        }

        // Upload audio if it exists as base64
        if (panel.audioBase64 && !panel.audioBase64.startsWith('http')) {
          const audioPath = `${user.id}/${comicId}/panel_${panel.panelId}.wav`
          console.log(`[Storage] Uploading audio for panel ${panel.panelId}...`)
          const { url, error } = await uploadAudioFromBase64(panel.audioBase64, audioPath)
          if (url && !error) {
            console.log(`[Storage] Audio uploaded: ${url}`)
            // Replace base64 with URL for storage efficiency
            updatedPanel.audioBase64 = url
          } else {
            console.error(`[Storage] Audio upload failed:`, error)
          }
        }

        return updatedPanel
      })
    )

    return uploadedPanels
  }

  // Extract text response from agent events
  const extractResponse = (events: AgentEvent[]): string => {
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i]
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) return part.text
        }
      }
    }
    return ""
  }

  // Extract comic panels from agent events
  const extractPanels = (events: AgentEvent[]): Panel[] => {
    console.log("[extractPanels] Processing", events.length, "events")

    // First pass: collect all panel data from all events
    let basePanels: Panel[] = []
    const imageMap = new Map<number, string>()
    const audioMap = new Map<number, string>()
    let foundTitle = ""

    for (const event of events) {
      // Check state delta for comic data
      if (event.actions?.stateDelta) {
        const delta = event.actions.stateDelta as Record<string, unknown>

        // Log state delta for debugging
        console.log("[extractPanels] State delta keys:", Object.keys(delta))

        // Look for comic_script - contains base panel data
        if (delta.comic_script) {
          console.log("[extractPanels] Found comic_script:", delta.comic_script)
          const script = delta.comic_script as {
            title?: string; panels?: Array<{
              panelId: number
              narration?: string
              imagePrompt?: string
              scene?: string
              dialogue?: string
            }>
          }
          if (script.title) foundTitle = script.title
          if (script.panels && script.panels.length > 0) {
            basePanels = script.panels.map(p => ({
              panelId: p.panelId,
              narration: p.narration || p.dialogue || "",
              imagePrompt: p.imagePrompt || p.scene || "",
            }))
            console.log("[extractPanels] Extracted base panels:", basePanels)
          }
        }

        // Look for generated images - can be array or markdown text with URLs
        if (delta.generated_images) {
          console.log("[extractPanels] Found generated_images:", delta.generated_images)

          if (Array.isArray(delta.generated_images)) {
            // Handle array format
            const images = delta.generated_images as Array<{ panelId: number; imageUrl?: string; url?: string }>
            images.forEach(img => {
              const url = img.imageUrl || img.url
              if (url && img.panelId) {
                imageMap.set(img.panelId, url)
              }
            })
          } else if (typeof delta.generated_images === 'string') {
            // Parse markdown text format: "**Panel 1:**\n    *   **Image URL:** https://..."
            const text = delta.generated_images as string
            // Match patterns like "Panel 1:" followed by a URL
            const panelUrlRegex = /Panel\s*(\d+)[^]*?(?:Image URL:|URL:)\s*(https?:\/\/[^\s\n]+)/gi
            let match
            while ((match = panelUrlRegex.exec(text)) !== null) {
              const panelId = parseInt(match[1], 10)
              const url = match[2].trim()
              if (panelId && url) {
                console.log(`[extractPanels] Parsed image - Panel ${panelId}: ${url}`)
                imageMap.set(panelId, url)
              }
            }
          }
        }

        // Look for generated audio - currently just filenames in markdown, no base64 in state
        // The audio base64 would need to be returned by the tool in the state
        if (delta.generated_audio) {
          console.log("[extractPanels] Found generated_audio:", delta.generated_audio)

          if (Array.isArray(delta.generated_audio)) {
            // Handle array format
            const audios = delta.generated_audio as Array<{ panelId: number; audioBase64?: string; audio?: string }>
            audios.forEach(audio => {
              const audioData = audio.audioBase64 || audio.audio
              if (audioData && audio.panelId) {
                audioMap.set(audio.panelId, audioData)
              }
            })
          }
          // Note: If generated_audio is a string (markdown), we can't extract base64 from it
          // The backend would need to store the actual audio data in state
        }
      }

      // Also check content.parts for function responses and JSON text
      if (event.content?.parts) {
        for (const part of event.content.parts as Array<{
          text?: string
          functionResponse?: {
            name: string
            response: Record<string, unknown>
          }
        }>) {
          // Check for function responses (tool results)
          if (part.functionResponse) {
            const { name, response } = part.functionResponse

            // Handle image generation tool response
            if (name === 'generate_comic_image' && response.success) {
              const panelId = response.panelId as number
              const imageUrl = response.imageUrl as string
              if (panelId && imageUrl) {
                console.log(`[extractPanels] Tool response - Image for panel ${panelId}: ${imageUrl}`)
                imageMap.set(panelId, imageUrl)
              }
            }

            // Handle audio generation tool response
            if (name === 'generate_panel_audio' && response.success) {
              const panelId = response.panelId as number
              const audioBase64 = response.audioBase64 as string
              if (panelId && audioBase64) {
                console.log(`[extractPanels] Tool response - Audio for panel ${panelId}: ${audioBase64.length} chars`)
                audioMap.set(panelId, audioBase64)
              }
            }
          }

          // Check for JSON text responses
          if (part.text) {
            try {
              const parsed = JSON.parse(part.text)
              // Check if it's a comic script response
              if (parsed.panels && Array.isArray(parsed.panels)) {
                if (parsed.title) foundTitle = parsed.title
                basePanels = parsed.panels.map((p: { panelId: number; narration?: string; imagePrompt?: string; scene?: string; dialogue?: string }) => ({
                  panelId: p.panelId,
                  narration: p.narration || p.dialogue || "",
                  imagePrompt: p.imagePrompt || p.scene || "",
                }))
              }
              // Check if it's image results
              if (parsed.images && Array.isArray(parsed.images)) {
                parsed.images.forEach((img: { panelId: number; imageUrl?: string; url?: string }) => {
                  const url = img.imageUrl || img.url
                  if (url && img.panelId) imageMap.set(img.panelId, url)
                })
              }
            } catch {
              // Not JSON, continue
            }
          }
        }
      }
    }

    // Set title if found
    if (foundTitle) {
      setStoryTitle(foundTitle)
    }

    console.log("[extractPanels] Summary - basePanels:", basePanels.length, "images:", imageMap.size, "audios:", audioMap.size)

    // Merge images and audio into base panels
    const mergedPanels = basePanels.map(panel => ({
      ...panel,
      imageUrl: imageMap.get(panel.panelId) || panel.imageUrl,
      audioBase64: audioMap.get(panel.panelId) || panel.audioBase64,
    }))

    console.log("[extractPanels] Final merged panels:", mergedPanels)
    return mergedPanels
  }

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Create session if this is the first message
      if (!sessionCreated) {
        await createSession(userId, sessionId)
        setSessionCreated(true)
      }

      const events = await runComicAgent(message, userId, sessionId)

      // Debug: Log all events to understand the response structure
      console.log("[Comic Generator] Received events:", JSON.stringify(events, null, 2))

      // Extract assistant response
      const responseText = extractResponse(events)
      if (responseText) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }

      // Check if comic generation started
      const newPanels = extractPanels(events)
      if (newPanels.length > 0) {
        setIsGenerating(true)
        setPanels(newPanels)

        // Upload media to Supabase Storage if user is authenticated
        if (user) {
          const comicId = `comic_${Date.now()}`
          const uploadedPanels = await uploadPanelMedia(newPanels, comicId)
          setPanels(uploadedPanels)
        }

        setIsGenerating(false)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please make sure the ADK backend is running on localhost:8000.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [userId, sessionId, sessionCreated])

  const handleNewChat = () => {
    setMessages([])
    setPanels([])
    setStoryTitle("")
    setSessionId(generateSessionId())
    setSessionCreated(false)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-7 w-7 text-purple-500" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  AI Comic Generator
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create magical stories with AI ✨
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Story Writer</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image Generator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Voice Narrator</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="border-purple-300 hover:bg-purple-100"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              <UserAuthButton />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Panel - Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="min-h-0 h-full"
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isGenerating={isGenerating}
            />
          </motion.div>

          {/* Right Panel - Comic Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="min-h-0 h-full hidden lg:block"
          >
            <ComicDisplay
              title={storyTitle}
              panels={panels}
              isLoading={isGenerating}
            />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with ❤️ using Google ADK, Gemini, Replicate & Sarvam AI</p>
        </div>
      </footer>
    </div>
  )
}
