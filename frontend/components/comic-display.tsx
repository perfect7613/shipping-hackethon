"use client"

import { motion } from "motion/react"
import { ComicPanel } from "./comic-panel"
import { Button } from "@/components/ui/button"
import { Play, Download, Sparkles } from "lucide-react"
import { useState, useRef } from "react"

export interface Panel {
  panelId: number
  narration: string
  imagePrompt?: string
  imageUrl?: string
  audioBase64?: string
}

export interface ComicDisplayProps {
  title?: string
  theme?: string
  panels: Panel[]
  isLoading?: boolean
}

export function ComicDisplay({ title, theme, panels, isLoading = false }: ComicDisplayProps) {
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [currentPlayingPanel, setCurrentPlayingPanel] = useState<number | null>(null)
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())

  const playAllNarration = async () => {
    if (isPlayingAll) {
      // Stop all
      audioRefs.current.forEach((audio) => audio.pause())
      setIsPlayingAll(false)
      setCurrentPlayingPanel(null)
      return
    }

    setIsPlayingAll(true)
    
    for (const panel of panels) {
      if (!panel.audioBase64) continue
      
      setCurrentPlayingPanel(panel.panelId)
      
      await new Promise<void>((resolve) => {
        const audio = new Audio(`data:audio/wav;base64,${panel.audioBase64}`)
        audioRefs.current.set(panel.panelId, audio)
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
    }
    
    setIsPlayingAll(false)
    setCurrentPlayingPanel(null)
  }

  if (panels.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 shadow-lg">
        <div className="text-center py-16 px-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            Your Comic Awaits! 🎨
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Enter a story idea and watch as AI creates a magical comic adventure just for you!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-amber-200 dark:border-amber-800 bg-white/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {title || "Your Comic Story"}
            </h2>
            {theme && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Theme: {theme}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {panels.some(p => p.audioBase64) && (
              <Button
                variant="outline"
                size="sm"
                onClick={playAllNarration}
                className="border-amber-300 hover:bg-amber-100"
              >
                <Play className="h-4 w-4 mr-1" />
                {isPlayingAll ? "Stop" : "Play All"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 hover:bg-amber-100"
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Panels Container */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {isLoading && panels.length === 0 ? (
            // Show loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <ComicPanel
                key={`loading-${i}`}
                panelId={i + 1}
                narration=""
                isLoading={true}
              />
            ))
          ) : (
            panels.map((panel) => (
              <motion.div
                key={panel.panelId}
                className={currentPlayingPanel === panel.panelId ? "ring-2 ring-amber-500 rounded-xl" : ""}
              >
                <ComicPanel
                  panelId={panel.panelId}
                  narration={panel.narration}
                  imageUrl={panel.imageUrl}
                  audioBase64={panel.audioBase64}
                  imagePrompt={panel.imagePrompt}
                  isLoading={false}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

