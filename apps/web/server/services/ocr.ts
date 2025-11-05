import OpenAI from "openai";

// Question type from the form schema
type Question = {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "rating";
  label: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
};

// Initialize OpenAI client configured for OpenRouter
const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    "X-Title": "Mentorship Feedback Platform",
  },
});

const OCR_PROMPT = `You are an expert at analyzing feedback forms and extracting questions in a structured format.

Analyze this feedback form image and extract ALL questions. Return ONLY a JSON array with this exact structure:

[
  {
    "type": "text|textarea|select|radio|rating",
    "label": "the complete question text",
    "required": true/false,
    "options": ["option1", "option2"],  // only for select/radio
    "minRating": 1,  // only for rating questions
    "maxRating": 10  // only for rating questions
  }
]

**Question Type Detection Rules**:
- **text**: Short answer fields, single-line inputs, brief responses
- **textarea**: Long answer fields, multi-line text areas, essay questions, comments
- **select**: Dropdown lists, "choose one from list", single selection with many options
- **radio**: Multiple choice (choose one), radio buttons, single selection with 2-5 options
- **rating**: Star ratings, numeric scales (1-5, 1-10), Likert scales, satisfaction ratings

**Required Field Detection**:
- Mark as required if you see: asterisk (*), "required", "mandatory", "(required)", red indicators
- Default to false if not explicitly marked

**For Select/Radio Questions**:
- Extract ALL visible options as an array of strings
- Include exactly what's written, preserve capitalization

**For Rating Questions**:
- Detect the scale (e.g., 1-5, 1-10)
- Set minRating and maxRating accordingly
- Default to 1-5 if unclear

**Important**:
- Extract the COMPLETE question text, including any sub-text or instructions
- Preserve question numbering if present (e.g., "1. How satisfied are you?")
- If a question has multiple parts, create separate questions
- Return valid JSON ONLY - no markdown, no code blocks, no explanations
- If you cannot extract any questions, return an empty array: []`;

/**
 * Extract questions from a form image using OpenRouter AI
 * @param imageBase64 - Base64 encoded image data (with or without data URL prefix)
 * @returns Array of extracted questions in the application's Question format
 * @throws Error if API call fails or response cannot be parsed
 */
export async function extractQuestionsFromImage(
  imageBase64: string
): Promise<Question[]> {
  // Validate API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Please add it to your .env file."
    );
  }

  // Ensure base64 data has proper data URL prefix
  const imageData = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  try {
    // Call OpenRouter API with vision model
    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: OCR_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.2, // Low temperature for more consistent extraction
    });

    // Extract the response content
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse JSON response
    // Remove markdown code blocks if present
    const jsonStr = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const extractedQuestions = JSON.parse(jsonStr);

    // Validate response is an array
    if (!Array.isArray(extractedQuestions)) {
      throw new Error("AI response is not an array");
    }

    // Generate unique IDs for each question and validate structure
    const validatedQuestions: Question[] = extractedQuestions.map(
      (q: any, index: number) => {
        // Validate required fields
        if (!q.type || !q.label) {
          throw new Error(
            `Question ${index + 1} is missing required fields (type or label)`
          );
        }

        // Validate question type
        const validTypes = ["text", "textarea", "select", "radio", "rating"];
        if (!validTypes.includes(q.type)) {
          throw new Error(
            `Question ${index + 1} has invalid type: ${q.type}`
          );
        }

        // Validate select/radio have options
        if (["select", "radio"].includes(q.type)) {
          if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
            throw new Error(
              `Question ${index + 1} (${q.type}) must have options array`
            );
          }
        }

        // Validate rating has min/max
        if (q.type === "rating") {
          if (
            typeof q.minRating !== "number" ||
            typeof q.maxRating !== "number"
          ) {
            throw new Error(
              `Question ${index + 1} (rating) must have minRating and maxRating numbers`
            );
          }
          if (q.minRating >= q.maxRating) {
            throw new Error(
              `Question ${index + 1}: minRating must be less than maxRating`
            );
          }
        }

        // Return validated question with generated ID
        return {
          id: `q${Date.now()}_${index}`,
          type: q.type,
          label: q.label.trim(),
          required: Boolean(q.required),
          ...(q.options && { options: q.options }),
          ...(q.minRating && { minRating: q.minRating }),
          ...(q.maxRating && { maxRating: q.maxRating }),
        };
      }
    );

    return validatedQuestions;
  } catch (error: any) {
    // Provide helpful error messages
    if (error.name === "SyntaxError") {
      throw new Error(
        "Failed to parse AI response. The image might be unclear or not contain a valid form."
      );
    }

    if (error.code === "invalid_api_key") {
      throw new Error(
        "Invalid OpenRouter API key. Please check your OPENROUTER_API_KEY environment variable."
      );
    }

    if (error.status === 429) {
      throw new Error(
        "Rate limit exceeded. Please try again in a few moments."
      );
    }

    if (error.status === 402) {
      throw new Error(
        "Insufficient credits on OpenRouter. Please add credits to your account."
      );
    }

    // Re-throw with more context
    throw new Error(
      `OCR extraction failed: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Validate image data before processing
 * @param base64Data - Base64 encoded image data
 * @returns True if valid, throws Error if invalid
 */
export function validateImageData(base64Data: string): boolean {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64)) {
    throw new Error("Invalid base64 image data");
  }

  // Estimate file size (base64 is ~33% larger than original)
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  // Maximum 4MB
  if (sizeInMB > 4) {
    throw new Error(
      `Image size (${sizeInMB.toFixed(2)}MB) exceeds 4MB limit. Please compress the image.`
    );
  }

  return true;
}
