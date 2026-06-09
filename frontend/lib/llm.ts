import Groq from "groq-sdk";
import { z } from "zod";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

export class LLMParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMParseError";
  }
}

/**
 * Strips markdown code block formatting (e.g. ```json ... ```) from a string.
 */
function stripJsonMarkdown(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Calls Groq, parses the JSON response, and validates it against a Zod schema.
 * Implements up to 2 retries on parsing/validation failure, passing the error back to the LLM.
 */
export async function callLLM<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string = "llama-3.1-8b-instant",
  maxRetries = 2
): Promise<T> {
  let attempts = 0;
  let currentPrompt = prompt;

  while (attempts <= maxRetries) {
    try {
      const response = await getGroq().chat.completions.create({
        messages: [{ role: "user", content: currentPrompt }],
        model,
        response_format: { type: "json_object" },
        temperature: 0.2, // Low temperature for consistent JSON output
      }, { timeout: 45000 }); // 45 second strict timeout

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Empty response from Groq API");
      }

      const cleanJsonStr = stripJsonMarkdown(rawContent);
      const parsedJson = JSON.parse(cleanJsonStr);

      // Validate against Zod schema
      const result = schema.safeParse(parsedJson);
      
      if (!result.success) {
        // Validation failed, throw so we can catch and retry
        throw new LLMParseError(
          `Zod Validation Failed: ${JSON.stringify(result.error.issues)}`
        );
      }

      return result.data;
    } catch (error) {
      attempts++;
      console.error(`LLM Call Attempt ${attempts} Failed:`, error);

      if (attempts > maxRetries) {
        throw new Error(
          `LLM call failed after ${maxRetries + 1} attempts. Last error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // If it's a parsing/validation error, append it to the prompt and try again
      if (error instanceof SyntaxError || error instanceof LLMParseError) {
        currentPrompt += `\n\n--- PREVIOUS ATTEMPT FAILED ---\nYou returned invalid JSON or it did not match the required schema. Error details: ${
          error.message
        }\nPlease try again and strictly ensure your output is valid JSON matching the requested schema.`;
      } else {
        // For network errors or 429s, we should implement a small backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw new Error("Unexpected end of callLLM loop");
}
