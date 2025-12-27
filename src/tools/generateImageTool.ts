import { FunctionTool } from "@google/adk";
import { z } from "zod";
import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Output directory for generated images
const OUTPUT_DIR = path.join(process.cwd(), "output", "images");

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * FunctionTool to generate images using Replicate's Nano Banana Pro model
 * This tool is used by the Image Generator Agent to create comic panel images
 * Images are saved to the output/images folder
 */
export const generateImageTool = new FunctionTool({
  name: "generate_comic_image",
  description:
    "Generates a comic panel image using Google's Nano Banana Pro model on Replicate. Use this to create images for each comic panel based on the provided prompt. Images are saved locally.",
  parameters: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed image generation prompt describing the comic panel scene, characters, and style"
      ),
    panelId: z
      .number()
      .describe("The panel number/ID this image is being generated for"),
    aspectRatio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16"])
      .optional()
      .describe("Aspect ratio for the image. Defaults to 4:3 for comic panels"),
    resolution: z
      .enum(["1K", "2K"])
      .optional()
      .describe("Image resolution. Defaults to 2K"),
  }),
  execute: async ({ prompt, panelId, aspectRatio = "4:3", resolution = "2K" }) => {
    try {
      console.log(`[generateImageTool] Generating image for panel ${panelId}`);
      console.log(`[generateImageTool] Prompt: ${prompt}`);

      ensureOutputDir();

      const input = {
        prompt: prompt,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        output_format: "png",
        safety_filter_level: "block_only_high",
      };

      const output = await replicate.run("google/nano-banana-pro", { input });

      // The output has a .url() method to get the file URL
      const imageUrl =
        output && typeof (output as any).url === "function"
          ? (output as any).url()
          : String(output);

      console.log(`[generateImageTool] Generated image URL: ${imageUrl}`);

      // Download and save the image locally
      const timestamp = Date.now();
      const filename = `panel_${panelId}_${timestamp}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);

      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      fs.writeFileSync(filePath, imageBuffer);

      console.log(`[generateImageTool] Saved image to: ${filePath}`);

      return {
        success: true,
        panelId,
        imageUrl,
        localPath: filePath,
        filename,
        message: `Successfully generated and saved image for panel ${panelId}`,
      };
    } catch (error) {
      console.error(`[generateImageTool] Error:`, error);
      return {
        success: false,
        panelId,
        imageUrl: null,
        localPath: null,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to generate image for panel ${panelId}`,
      };
    }
  },
});

