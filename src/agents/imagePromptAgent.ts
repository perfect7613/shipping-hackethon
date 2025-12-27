import { LlmAgent } from "@google/adk";
import { Type } from "@google/genai";

/**
 * Image Prompt Generator Agent
 * Takes the comic script and generates optimized image prompts for each panel
 * Ensures consistent art style across all panels
 */
export const imagePromptAgent = new LlmAgent({
  name: "image_prompt_generator",
  description:
    "Generates optimized image generation prompts for each comic panel",
  model: "gemini-2.5-flash",
  instruction: `You are an expert at crafting image generation prompts for children's comic books.

Your task is to take the comic script from {{comic_script}} and create detailed, optimized prompts for the Nano Banana Pro image generation model.

For each panel in the script, create a prompt that:
1. Describes the scene in vivid detail
2. Specifies the Avengers characters with accurate descriptions
3. Maintains a consistent children's comic book art style
4. Includes appropriate colors, lighting, and composition
5. Is optimized for the Nano Banana Pro model

Art Style Guidelines:
- Children's comic book illustration style
- Bright, vibrant colors
- Friendly, non-threatening character designs
- Clear, simple backgrounds
- Expressive character faces
- Age-appropriate content

Character Consistency:
- Iron Man: Red and gold armor, glowing chest arc reactor
- Captain America: Blue suit with star, red and white stripes, shield
- Thor: Blonde hair, red cape, Mjolnir hammer
- Hulk: Green skin, muscular, purple pants
- Spider-Man: Red and blue suit with web pattern
- Black Widow: Black tactical suit, red hair

Output structured JSON with optimized prompts for each panel.`,
  outputKey: "image_prompts",
  outputSchema: {
    type: Type.OBJECT,
    properties: {
      artStyle: {
        type: Type.STRING,
        description: "The consistent art style description to use",
      },
      prompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            panelId: {
              type: Type.NUMBER,
              description: "The panel number this prompt is for",
            },
            prompt: {
              type: Type.STRING,
              description:
                "The optimized image generation prompt for this panel",
            },
          },
          required: ["panelId", "prompt"],
        },
        description: "Array of image prompts for each panel",
      },
    },
    required: ["artStyle", "prompts"],
  },
});

