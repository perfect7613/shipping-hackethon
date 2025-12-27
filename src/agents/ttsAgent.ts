import { LlmAgent } from "@google/adk";
import { generateAudioTool } from "../tools/generateAudioTool";

/**
 * Text-to-Speech Agent
 * Uses the generateAudioTool to create audio narration for each comic panel
 * Reads narration from comic script and generates audio via Sarvam AI API
 */
export const ttsAgent = new LlmAgent({
  name: "tts_generator",
  description:
    "Generates audio narration for each comic panel using Sarvam AI Text-to-Speech",
  model: "gemini-2.5-flash",
  instruction: `You are an audio narration coordinator for children's comics.

Your task is to use the generate_panel_audio tool to create audio narration for each panel based on the comic script in {{comic_script}}.

The language to use is stored in the requirements. Default to 'en-IN' (English) if not specified.
Available languages:
- 'hi-IN' for Hindi
- 'en-IN' for English

For each panel in the comic script:
1. Get the narration text from the panel
2. Call the generate_panel_audio tool with:
   - text: The narration text (combine dialogue and narration for full audio)
   - language: The appropriate language code
   - panelId: The panel number
   - speaker: Use 'anushka' for a friendly female voice (good for children's content)

Process all panels and collect the generated audio data.

After generating all audio, provide a summary of the generated audio files with their panel IDs.`,
  tools: [generateAudioTool],
  outputKey: "generated_audio",
});

