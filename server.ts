import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for base64 photo/audio payloads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini client using server-side environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper validation for categories
const VALID_CATEGORIES = ['food', 'transport', 'study', 'social', 'rent', 'others'];

// AI Parsing Endpoint: Receipt / Captured Image
app.post("/api/gemini/parse-image", async (req, res): Promise<any> => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing required image content or mime type." });
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanedBase64,
          },
        },
        "Analyze this receipt or purchase image. Perform high-accuracy OCR to extract: " +
        "1. Real total purchase amount (usually prefixed by 'TOTAL', 'AMOUNT', 'RM', 'CASH', 'SUBTOTAL', or 'NET').\n" +
        "2. Merchant or Shop name written at the top (e.g. 'RESTORAN ABC', 'MCDONALDS', 'STARBUCKS'). Form the final description as '[Merchant Name] receipt' (e.g., 'RESTORAN ABC receipt').\n" +
        "3. Date of the transaction in YYYY-MM-DD format (if visible).\n" +
        "4. Standard budget category: 'food' (if it looks like food, snacks, Restaurant, Restoran, drinks, cafe, boba, meal), " +
        "'transport' (gas, fuel, petrol, LRT, MRT, Grab, Uber, bus), 'study' (books, print, stationery, school, library), " +
        "'social' (cinema, movie, concert, gift), 'rent' (apartment, hostel, room, bills), or 'others'.\n" +
        "Return the output as valid JSON matching the schema."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { 
              type: Type.NUMBER, 
              description: "The total payment/spent amount parsed from the photo in RM (float/number format, e.g. 12.50)." 
            },
            category: { 
              type: Type.STRING, 
              description: "Must be exactly one of: 'food', 'transport', 'study', 'social', 'rent', or 'others'." 
            },
            description: { 
              type: Type.STRING, 
              description: "Brief clear details or '[Merchant Name] receipt' (e.g. 'RESTORAN ABC receipt')." 
            },
            date: { 
              type: Type.STRING, 
              description: "The exact date of transaction formatted as YYYY-MM-DD if explicitly visible, otherwise empty string." 
            }
          },
          required: ["amount", "category", "description"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const result = JSON.parse(resultText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini Image Parsing Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process receipt image using Gemini." });
  }
});

// AI Parsing Endpoint: Voice / Sound Capture
app.post("/api/gemini/parse-voice", async (req, res): Promise<any> => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing required audio content or mime type." });
    }

    const cleanedBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanedBase64,
          },
        },
        "The audio contains a student describing an expense/spent record they just made. " +
        "Extract the spent amount numerically in RM, identify the purchase description, and classify it into one of these specific student budget categories: " +
        `'food', 'transport', 'study', 'social', 'rent', 'others'. Return the transacted date if mentioned, otherwise leave it blank.`
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { 
              type: Type.NUMBER, 
              description: "The numerical cash amount spent in RM." 
            },
            category: { 
              type: Type.STRING, 
              description: "Must be exactly one of: 'food', 'transport', 'study', 'social', 'rent', or 'others'." 
            },
            description: { 
              type: Type.STRING, 
              description: "Detail of the expense mentioned in the voice memo (e.g., Dinner at Mamak stalls, Book printing)." 
            },
            date: { 
              type: Type.STRING, 
              description: "Date formatted as YYYY-MM-DD if mentioned, otherwise empty string." 
            }
          },
          required: ["amount", "category", "description"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const result = JSON.parse(resultText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini Voice Parsing Error:", error);
    return res.status(500).json({ error: error.message || "Failed to interpret voice memo using Gemini." });
  }
});

// Start our custom server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const __dirname = path.resolve();
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
