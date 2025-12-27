import { LlmAgent } from "@google/adk";
import { generateImageTool } from "../tools/generateImageTool";

/**
 * Image Generator Agent
 * Uses the generateImageTool to create actual images for each comic panel
 * Reads prompts from session state and generates images via Replicate API
 */
export const imageGeneratorAgent = new LlmAgent({
  name: "image_generator",
  description:
    "Generates actual comic panel images using the Nano Banana Pro model on Replicate",
  model: "gemini-2.5-flash",
  instruction: `You are an image generation coordinator for children's comics.

Your task is to use the generate_comic_image tool to create images for each panel based on the prompts in {{image_prompts}}.

For each prompt in the image_prompts:
1. Call the generate_comic_image tool with the prompt and panelId
2. Wait for the image to be generated

Process all panels sequentially to ensure each image is generated correctly.

Once all images are generated, simply respond with "Images ready!" - do not list the URLs as they are stored automatically.`,
  tools: [generateImageTool],
  outputKey: "generated_images",
});

