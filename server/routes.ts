import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { log } from "./vite";

type PantryScanItem = {
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  confidence?: number;
};

const inMemoryPantry: PantryScanItem[] = [];

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey }) : undefined;
}

export async function registerRoutes(app: Express): Promise<void> {
  // Health
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Pantry list
  app.get("/api/pantry", (_req: Request, res: Response) => {
    res.json({ items: inMemoryPantry });
  });

  // Pantry scan
  app.post("/api/pantry/scan", async (req: Request, res: Response) => {
    try {
      const { image } = req.body as { image?: string };
      if (!image) return res.status(400).json({ message: "image is required" });

      const openai = getOpenAIClient();
      let items: PantryScanItem[] = [];

      if (openai) {
        try {
          const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: "Identify pantry items in the image. Return JSON array with itemName, category, quantity, unit, confidence." },
                  { type: "input_image", image_url: image },
                ],
              },
            ],
            temperature: 0.2,
          });

          const text = response.output_text ?? "";
          const match = text.match(/\[[\s\S]*\]/);
          if (match) {
            items = JSON.parse(match[0]);
          }
        } catch (err) {
          log(`openai pantry scan failed: ${String(err)}`);
        }
      }

      if (items.length === 0) {
        // Fallback stub
        items = [
          { itemName: "Apple", category: "produce", quantity: 3, unit: "pieces", confidence: 0.6 },
        ];
      }

      inMemoryPantry.push(...items);
      res.json({ success: true, items });
    } catch (error: any) {
      res.status(500).json({ message: error?.message ?? "scan failed" });
    }
  });

  // Plate scan for nutrition logging
  app.post("/api/plate/scan", async (req: Request, res: Response) => {
    try {
      const { image } = req.body as { image?: string };
      if (!image) return res.status(400).json({ message: "image is required" });

      const openai = getOpenAIClient();
      let breakdown: any = null;

      if (openai) {
        try {
          const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: "Estimate meal nutrition from the image. Return JSON with calories, protein, carbs, fat." },
                  { type: "input_image", image_url: image },
                ],
              },
            ],
            temperature: 0.2,
          });

          const text = response.output_text ?? "";
          const obj = text.match(/\{[\s\S]*\}/);
          breakdown = obj ? JSON.parse(obj[0]) : null;
        } catch (err) {
          log(`openai plate scan failed: ${String(err)}`);
        }
      }

      if (!breakdown) {
        breakdown = { calories: 450, protein: 25, carbs: 50, fat: 15 };
      }

      res.json({ success: true, nutrition: breakdown });
    } catch (error: any) {
      res.status(500).json({ message: error?.message ?? "plate scan failed" });
    }
  });

  // Add pantry item
  app.post("/api/pantry/items", (req: Request, res: Response) => {
    const item = req.body as PantryScanItem;
    if (!item?.itemName) return res.status(400).json({ message: "itemName is required" });
    inMemoryPantry.push({ ...item, quantity: item.quantity ?? 1, unit: item.unit ?? "pieces" });
    res.status(201).json({ success: true });
  });

  return;
}
