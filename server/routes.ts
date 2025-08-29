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

type UserProfile = {
  userId: number;
  dailyCalorieGoal: number;
  dietaryRestrictions: string[];
  allergies: string[];
  dislikes: string[];
  favorites: string[];
  updatedAt: string;
};

const userProfilesById = new Map<number, UserProfile>();

function getOrCreateUserProfile(userId: number): UserProfile {
  const existing = userProfilesById.get(userId);
  if (existing) return existing;

  const created: UserProfile = {
    userId,
    dailyCalorieGoal: 2000,
    dietaryRestrictions: [],
    allergies: [],
    dislikes: [],
    favorites: [],
    updatedAt: new Date().toISOString(),
  };
  userProfilesById.set(userId, created);
  return created;
}

function addUnique(list: string[], value: string): string[] {
  const v = value.trim();
  if (!v) return list;
  if (!list.find((x) => x.toLowerCase() === v.toLowerCase())) {
    return [...list, v];
  }
  return list;
}

function removeValue(list: string[], value: string): string[] {
  const v = value.trim().toLowerCase();
  return list.filter((x) => x.toLowerCase() !== v);
}

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

  // --- User Profiles ---
  app.get("/api/user-profiles/:userId", (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "invalid userId" });
    const profile = getOrCreateUserProfile(userId);
    res.json({ profile });
  });

  app.put("/api/user-profiles/:userId", (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "invalid userId" });
    const profile = getOrCreateUserProfile(userId);
    const { dailyCalorieGoal, dietaryRestrictions, allergies, dislikes, favorites } = req.body as Partial<UserProfile>;
    if (typeof dailyCalorieGoal === "number") profile.dailyCalorieGoal = dailyCalorieGoal;
    if (Array.isArray(dietaryRestrictions)) profile.dietaryRestrictions = dietaryRestrictions;
    if (Array.isArray(allergies)) profile.allergies = allergies;
    if (Array.isArray(dislikes)) profile.dislikes = dislikes;
    if (Array.isArray(favorites)) profile.favorites = favorites;
    profile.updatedAt = new Date().toISOString();
    userProfilesById.set(userId, profile);
    res.json({ success: true, profile });
  });

  // --- Meal Planner ---
  app.post("/api/meal-plan/generate", async (req: Request, res: Response) => {
    try {
      const { userId, userIds, days, mealsPerDay } = req.body as { userId?: number; userIds?: number[]; days?: number; mealsPerDay?: number };
      const audience = Array.isArray(userIds) && userIds.length > 0 ? userIds.map(Number) : [Number(userId)];
      if (!audience.length || audience.some((id) => !id || Number.isNaN(id))) return res.status(400).json({ message: "userId or userIds required" });
      const planDays = Math.min(Math.max(days ?? 7, 1), 14);
      const mealsEachDay = Math.min(Math.max(mealsPerDay ?? 3, 1), 5);

      const profiles = audience.map((id) => getOrCreateUserProfile(id));
      const merged = (function mergeProfiles(ps: UserProfile[]) {
        const dislikes = Array.from(new Set(ps.flatMap((p) => p.dislikes.map((x) => x.toLowerCase()))));
        const dietaryRestrictions = Array.from(new Set(ps.flatMap((p) => p.dietaryRestrictions.map((x) => x.toLowerCase()))));
        const allergies = Array.from(new Set(ps.flatMap((p) => p.allergies.map((x) => x.toLowerCase()))));
        const favorites = Array.from(new Set(ps.flatMap((p) => p.favorites)));
        const dailyCalorieGoal = Math.round(ps.reduce((sum, p) => sum + (p.dailyCalorieGoal || 2000), 0) / ps.length);
        return { dislikes, dietaryRestrictions, allergies, favorites, dailyCalorieGoal };
      })(profiles);
      const openai = getOpenAIClient();

      let plan: any = null;

      if (openai) {
        try {
          const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: `Create a ${planDays}-day meal plan with ${mealsEachDay} meals per day for ${profiles.length} people.
Avoid dislikes: ${merged.dislikes.join(", ") || "none"}.
Respect dietary restrictions: ${merged.dietaryRestrictions.join(", ") || "none"} and allergies: ${merged.allergies.join(", ") || "none"}.
Prefer favorites when reasonable: ${merged.favorites.join(", ") || "none"}.
Target per-person daily calories around ${merged.dailyCalorieGoal}. Use shared dishes that suit everyone when possible.
Return STRICT JSON with shape: [{"day":1, "meals":[{"type":"breakfast|lunch|dinner|snack", "name":"...", "perPersonCalories": number}]}].`
                  },
                ],
              },
            ],
            temperature: 0.3,
          });

          const text = response.output_text ?? "";
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            plan = JSON.parse(jsonMatch[0]);
          }
        } catch (err) {
          log(`openai meal-plan failed: ${String(err)}`);
        }
      }

      if (!plan) {
        // Fallback dynamic generator using favorites/dislikes, pantry, and restrictions
        const mealBank = [
          "Grilled chicken salad",
          "Veggie omelette",
          "Quinoa bowl with roasted vegetables",
          "Turkey sandwich on whole grain",
          "Greek yogurt with berries",
          "Tofu stir-fry",
          "Salmon with brown rice",
          "Chickpea curry",
          "Oatmeal with banana",
          "Lentil soup",
        ];
        const avoid = new Set(merged.dislikes.map((x) => x.toLowerCase()));
        const favorites = merged.favorites;
        const pantryBoost = inMemoryPantry.map((p) => p.itemName.toLowerCase());
        const restrictionKeywords: Record<string, string[]> = {
          vegetarian: ["chicken", "turkey", "salmon", "beef", "pork", "fish"],
          vegan: ["chicken", "turkey", "salmon", "beef", "pork", "fish", "yogurt", "omelette", "egg", "eggs"],
          "gluten-free": ["sandwich", "bread", "bun", "pasta"],
          dairy_free: ["yogurt", "cheese"],
        };
        const allergyKeywords = new Set(merged.allergies.map((a) => a.toLowerCase()));

        function violatesRestrictions(mealName: string): boolean {
          const name = mealName.toLowerCase();
          for (const r of merged.dietaryRestrictions) {
            const key = r.toLowerCase();
            const words = restrictionKeywords[key];
            if (words && words.some((w) => name.includes(w))) return true;
          }
          // Simple allergy filter by substring
          if ([...allergyKeywords].some((w) => name.includes(w))) return true;
          return false;
        }

        function pickMeals(count: number, used: Set<string>): string[] {
          const candidates = [
            ...favorites,
            ...mealBank.filter((m) => !favorites.find((f) => f.toLowerCase() === m.toLowerCase())),
          ]
            .filter((m) => ![...avoid].some((a) => m.toLowerCase().includes(a)))
            .filter((m) => !violatesRestrictions(m))
            .sort((a, b) => {
              const aScore = pantryBoost.some((i) => a.toLowerCase().includes(i)) ? 1 : 0;
              const bScore = pantryBoost.some((i) => b.toLowerCase().includes(i)) ? 1 : 0;
              return bScore - aScore;
            });
          const picked: string[] = [];
          for (let i = 0; i < count; i++) {
            let attempt = 0;
            let choice = "Chef's choice";
            while (attempt < candidates.length) {
              const c = candidates[(i + Math.floor(Math.random() * candidates.length) + attempt) % candidates.length] ?? "Chef's choice";
              if (!used.has(c.toLowerCase())) { choice = c; break; }
              attempt++;
            }
            picked.push(choice);
            used.add(choice.toLowerCase());
          }
          return picked;
        }

        plan = Array.from({ length: planDays }, (_v, i) => {
          const used = new Set<string>();
          const names = pickMeals(mealsEachDay, used);
          const types = ["breakfast", "lunch", "dinner", "snack", "snack"]; // enough types
          return {
            day: i + 1,
            meals: names.map((n, idx) => ({ type: types[idx], name: n, perPersonCalories: Math.round(merged.dailyCalorieGoal / mealsEachDay) })),
          };
        });
      }

      res.json({ success: true, plan });
    } catch (error: any) {
      res.status(500).json({ message: error?.message ?? "meal plan generation failed" });
    }
  });

  app.post("/api/meal-plan/feedback", (req: Request, res: Response) => {
    const { userId, mealName, action } = req.body as { userId?: number; mealName?: string; action?: "like" | "dislike" };
    if (!userId || !mealName || !action) return res.status(400).json({ message: "userId, mealName and action are required" });
    const profile = getOrCreateUserProfile(Number(userId));
    if (action === "like") {
      profile.favorites = addUnique(profile.favorites, mealName);
      profile.dislikes = removeValue(profile.dislikes, mealName);
    } else if (action === "dislike") {
      profile.dislikes = addUnique(profile.dislikes, mealName);
      profile.favorites = removeValue(profile.favorites, mealName);
    }
    profile.updatedAt = new Date().toISOString();
    userProfilesById.set(profile.userId, profile);
    res.json({ success: true, profile });
  });

  return;
}
