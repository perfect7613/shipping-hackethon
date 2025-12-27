"use client"

import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Pause, Volume2 } from "lucide-react"
import { useState, useRef } from "react"

export interface ComicPanelProps {
  panelId: number
  narration: string
  imageUrl?: string
  audioBase64?: string
  isLoading?: boolean
  imagePrompt?: string
}

export function ComicPanel({
  panelId,
  narration,
  imageUrl,
  audioBase64,
  isLoading = false,
  imagePrompt,
}: ComicPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayAudio = () => {
    if (!audioRef.current || !audioBase64) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: panelId * 0.1 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full">
                Panel {panelId}
              </span>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="w-full aspect-square rounded-lg mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: panelId * 0.15, type: "spring" }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-full">
              ✨ Panel {panelId}
            </span>
            {audioBase64 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayAudio}
                className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {imageUrl ? (
            <motion.div
              className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 border-4 border-white dark:border-gray-800 shadow-inner"
              whileHover={{ scale: 1.01 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Comic panel ${panelId}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ) : imagePrompt ? (
            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-3 border-4 border-white dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4 italic">
                {imagePrompt}
              </p>
            </div>
          ) : null}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <Volume2 className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {narration}
              </p>
            </div>
          </motion.div>

          {audioBase64 && (
            <audio
              ref={audioRef}
              src={audioBase64.startsWith('http') ? audioBase64 : `data:audio/wav;base64,${audioBase64}`}
              onEnded={handleAudioEnded}
              onError={(e) => console.error('Audio playback error:', e)}
              className="hidden"
            />
          )}
        </div>
      </Card>
    </motion.div>
  )
}

