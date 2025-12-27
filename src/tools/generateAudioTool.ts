import { FunctionTool } from "@google/adk";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Output directory for generated audio
const OUTPUT_DIR = path.join(process.cwd(), "output", "audio");

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * FunctionTool to generate audio using Sarvam AI Text-to-Speech API
 * This tool is used by the TTS Agent to create audio narration for comic panels
 * Audio files are saved to the output/audio folder
 */
export const generateAudioTool = new FunctionTool({
  name: "generate_panel_audio",
  description:
    "Converts text to speech using Sarvam AI TTS API. Use this to generate audio narration for each comic panel. Supports 11 Indian languages: English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, and Odia. Audio is saved locally.",
  parameters: z.object({
    text: z
      .string()
      .describe("The narration text to convert to speech for the comic panel"),
    language: z
      .enum([
        "en-IN", // English
        "hi-IN", // Hindi
        "bn-IN", // Bengali
        "ta-IN", // Tamil
        "te-IN", // Telugu
        "kn-IN", // Kannada
        "ml-IN", // Malayalam
        "mr-IN", // Marathi
        "gu-IN", // Gujarati
        "pa-IN", // Punjabi
        "od-IN", // Odia
      ])
      .describe(
        "Target language BCP-47 code. Supports: English (en-IN), Hindi (hi-IN), Bengali (bn-IN), Tamil (ta-IN), Telugu (te-IN), Kannada (kn-IN), Malayalam (ml-IN), Marathi (mr-IN), Gujarati (gu-IN), Punjabi (pa-IN), Odia (od-IN)"
      ),
    panelId: z
      .number()
      .describe("The panel number/ID this audio is being generated for"),
    speaker: z
      .enum(["anushka", "manisha", "vidya", "arya", "abhilash", "karun", "hitesh"])
      .optional()
      .describe("Voice speaker name. Defaults to 'anushka' (female voice)"),
  }),
  execute: async ({ text, language, panelId, speaker = "anushka" }) => {
    try {
      console.log(`[generateAudioTool] Generating audio for panel ${panelId}`);
      console.log(`[generateAudioTool] Text: ${text.substring(0, 100)}...`);
      console.log(`[generateAudioTool] Language: ${language}, Speaker: ${speaker}`);

      ensureOutputDir();

      const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY || "",
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: language,
          speaker: speaker,
          model: "bulbul:v2",
          pitch: 0,
          pace: 1.0,
          loudness: 1.0,
          enable_preprocessing: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const audioBase64 = data.audios?.[0] || null;

      // Save audio to local file
      const timestamp = Date.now();
      const filename = `panel_${panelId}_${timestamp}.wav`;
      const filePath = path.join(OUTPUT_DIR, filename);

      if (audioBase64) {
        const audioBuffer = Buffer.from(audioBase64, "base64");
        fs.writeFileSync(filePath, audioBuffer);
        console.log(`[generateAudioTool] Saved audio to: ${filePath}`);
      }

      console.log(
        `[generateAudioTool] Generated audio for panel ${panelId}, base64 length: ${audioBase64?.length || 0}`
      );

      return {
        success: true,
        panelId,
        audioBase64,
        localPath: filePath,
        filename,
        message: `Successfully generated and saved audio for panel ${panelId}`,
      };
    } catch (error) {
      console.error(`[generateAudioTool] Error:`, error);
      return {
        success: false,
        panelId,
        audioBase64: null,
        localPath: null,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to generate audio for panel ${panelId}`,
      };
    }
  },
});

