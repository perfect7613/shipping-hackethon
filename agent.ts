/**
 * AI Children Comic Generator - Main Agent Entry Point
 *
 * This file exports the rootAgent for the ADK web dashboard.
 * Run with: npx @google/adk-devtools web
 *
 * The agent system consists of:
 * - rootAgent: Gathers requirements from parents (lesson, age, language)
 * - comicPipelineAgent (SequentialAgent): Orchestrates comic generation
 *   - scriptGeneratorAgent: Creates comic script with panels
 *   - imagePromptAgent: Generates optimized image prompts
 *   - imageGeneratorAgent: Uses Replicate API (Nano Banana Pro) for images
 *   - ttsAgent: Uses Sarvam AI API for text-to-speech
 */

import { rootAgent } from "./src/agents/rootAgent";

// Export the root agent for ADK web dashboard
export { rootAgent };

