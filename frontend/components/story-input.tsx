"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Wand2, BookOpen, Loader2 } from "lucide-react"
import { useState } from "react"

const STORY_SUGGESTIONS = [
  "A brave little rabbit who wants to touch the moon",
  "A friendly dragon who is afraid of fire",
  "A magical garden where vegetables come to life",
  "A young wizard learning their first spell",
  "A tiny ant who dreams of flying",
  "A princess who befriends a silly monster",
]

interface StoryInputProps {
  onSubmit: (prompt: string) => void
  isLoading?: boolean
}

export function StoryInput({ onSubmit, isLoading = false }: StoryInputProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim())
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
  }

  return (
    <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950 dark:via-purple-950 dark:to-fuchsia-950 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <BookOpen className="h-6 w-6 text-purple-500" />
          </motion.div>
          <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Your Story
          </CardTitle>
        </div>
        <CardDescription className="text-purple-600 dark:text-purple-400">
          Describe your story idea and watch it come to life as a comic!
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Once upon a time, there was a..."
              className="pr-12 h-12 text-base bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim() || isLoading}
              className="absolute right-1 top-1 h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Need inspiration? Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {STORY_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </form>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </motion.div>
              </div>
              <div>
                <p className="font-medium text-purple-700 dark:text-purple-300">
                  Creating your comic...
                </p>
                <p className="text-sm text-purple-500 dark:text-purple-400">
                  The AI is writing your story, generating images, and adding narration!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

