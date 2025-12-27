import { SequentialAgent } from "@google/adk";
import { scriptGeneratorAgent } from "./scriptGeneratorAgent";
import { imagePromptAgent } from "./imagePromptAgent";
import { imageGeneratorAgent } from "./imageGeneratorAgent";
import { ttsAgent } from "./ttsAgent";

/**
 * Comic Pipeline Agent (SequentialAgent)
 * Orchestrates the entire comic generation workflow:
 * 1. Script Generator -> Creates comic script with panels
 * 2. Image Prompt Generator -> Creates optimized prompts for each panel
 * 3. Image Generator -> Generates actual images using Replicate
 * 4. TTS Generator -> Generates audio narration using Sarvam AI
 *
 * Each agent's output is stored in session state with outputKey
 * and can be accessed by subsequent agents using {{outputKey}} syntax
 */
export const comicPipelineAgent = new SequentialAgent({
  name: "comic_pipeline",
  description:
    "Sequential pipeline that generates a complete comic with images and audio. Executes script generation, image prompt creation, image generation, and text-to-speech in order.",
  subAgents: [
    scriptGeneratorAgent, // Step 1: Generate comic script -> outputs to 'comic_script'
    imagePromptAgent, // Step 2: Generate image prompts -> outputs to 'image_prompts'
    imageGeneratorAgent, // Step 3: Generate images -> outputs to 'generated_images'
    ttsAgent, // Step 4: Generate audio -> outputs to 'generated_audio'
  ],
});

