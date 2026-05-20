var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "15mb" }));
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.post("/api/gemini/parse-image", async (req, res) => {
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
            mimeType,
            data: cleanedBase64
          }
        },
        "Analyze this receipt or purchase image. Perform high-accuracy OCR to extract: 1. Real total purchase amount (usually prefixed by 'TOTAL', 'AMOUNT', 'RM', 'CASH', 'SUBTOTAL', or 'NET').\n2. Merchant or Shop name written at the top (e.g. 'RESTORAN ABC', 'MCDONALDS', 'STARBUCKS'). Form the final description as '[Merchant Name] receipt' (e.g., 'RESTORAN ABC receipt').\n3. Date of the transaction in YYYY-MM-DD format (if visible).\n4. Standard budget category: 'food' (if it looks like food, snacks, Restaurant, Restoran, drinks, cafe, boba, meal), 'transport' (gas, fuel, petrol, LRT, MRT, Grab, Uber, bus), 'study' (books, print, stationery, school, library), 'social' (cinema, movie, concert, gift), 'rent' (apartment, hostel, room, bills), or 'others'.\nReturn the output as valid JSON matching the schema."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            amount: {
              type: import_genai.Type.NUMBER,
              description: "The total payment/spent amount parsed from the photo in RM (float/number format, e.g. 12.50)."
            },
            category: {
              type: import_genai.Type.STRING,
              description: "Must be exactly one of: 'food', 'transport', 'study', 'social', 'rent', or 'others'."
            },
            description: {
              type: import_genai.Type.STRING,
              description: "Brief clear details or '[Merchant Name] receipt' (e.g. 'RESTORAN ABC receipt')."
            },
            date: {
              type: import_genai.Type.STRING,
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
  } catch (error) {
    console.error("Gemini Image Parsing Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process receipt image using Gemini." });
  }
});
app.post("/api/gemini/parse-voice", async (req, res) => {
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
            mimeType,
            data: cleanedBase64
          }
        },
        `The audio contains a student describing an expense/spent record they just made. Extract the spent amount numerically in RM, identify the purchase description, and classify it into one of these specific student budget categories: 'food', 'transport', 'study', 'social', 'rent', 'others'. Return the transacted date if mentioned, otherwise leave it blank.`
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            amount: {
              type: import_genai.Type.NUMBER,
              description: "The numerical cash amount spent in RM."
            },
            category: {
              type: import_genai.Type.STRING,
              description: "Must be exactly one of: 'food', 'transport', 'study', 'social', 'rent', or 'others'."
            },
            description: {
              type: import_genai.Type.STRING,
              description: "Detail of the expense mentioned in the voice memo (e.g., Dinner at Mamak stalls, Book printing)."
            },
            date: {
              type: import_genai.Type.STRING,
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
  } catch (error) {
    console.error("Gemini Voice Parsing Error:", error);
    return res.status(500).json({ error: error.message || "Failed to interpret voice memo using Gemini." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const __dirname = import_path.default.resolve();
    const distPath = import_path.default.join(__dirname, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
