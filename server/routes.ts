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
const nutritionLogsByUserId = new Map<number, { dateIso: string; calories: number; protein: number; carbs: number; fat: number; mealName?: string }[]>();
const conversationsById = new Map<string, { messages: { role: "user" | "assistant"; content: string }[]; currentPlan?: any }>();

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

// --- Shared dietary/allergy helpers ---
const restrictionKeywords: Record<string, string[]> = {
  vegetarian: ["chicken", "turkey", "salmon", "beef", "pork", "fish"],
  vegan: ["chicken", "turkey", "salmon", "beef", "pork", "fish", "yogurt", "omelette", "egg", "eggs", "cheese"],
  "gluten-free": ["sandwich", "bread", "bun", "pasta"],
  dairy_free: ["yogurt", "cheese"],
};

function violatesProfile(mealName: string, profile: UserProfile): boolean {
  const name = mealName.toLowerCase();
  if (profile.dislikes.some((d) => name.includes(d.toLowerCase()))) return true;
  for (const r of profile.dietaryRestrictions) {
    const words = restrictionKeywords[r.toLowerCase()];
    if (words && words.some((w) => name.includes(w))) return true;
  }
  if (profile.allergies.some((a) => name.includes(a.toLowerCase()))) return true;
  return false;
}

function generateAlternatives(
  profile: UserProfile,
  favorites: string[],
  mealBank: string[],
  pantryBoost: string[],
  exclude: Set<string>,
  max: number,
): string[] {
  const candidates = [
    ...favorites,
    ...mealBank.filter((m) => !favorites.find((f) => f.toLowerCase() === m.toLowerCase())),
  ]
    .filter((m) => !violatesProfile(m, profile))
    .filter((m) => !exclude.has(m.toLowerCase()))
    .sort((a, b) => {
      const aScore = pantryBoost.some((i) => a.toLowerCase().includes(i)) ? 1 : 0;
      const bScore = pantryBoost.some((i) => b.toLowerCase().includes(i)) ? 1 : 0;
      return bScore - aScore;
    });

  const picks: string[] = [];
  for (let i = 0; i < candidates.length && picks.length < max; i++) {
    const choice = candidates[i];
    if (!picks.find((p) => p.toLowerCase() === choice.toLowerCase())) picks.push(choice);
  }
  return picks;
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

  // --- Chat memory endpoints ---
  app.post("/api/chat/message", async (req: Request, res: Response) => {
    const { conversationId, message } = req.body as { conversationId?: string; message?: string };
    if (!conversationId || !message) return res.status(400).json({ message: "conversationId and message required" });
    const convo = conversationsById.get(conversationId) ?? { messages: [] };
    convo.messages.push({ role: "user", content: message });

    // Build context
    const context = convo.messages.slice(-20); // last 20 exchanges
    const openai = getOpenAIClient();
    let assistantReply = "";
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful meal planning assistant. Honor and reference prior messages to interpret follow-ups." },
            ...context.map((m) => ({ role: m.role, content: m.content } as const)),
          ],
          temperature: 0.4,
        });
        assistantReply = response.choices?.[0]?.message?.content ?? "";
      } catch (err) {
        log(`openai chat failed: ${String(err)}`);
      }
    }

    if (!assistantReply) {
      // Fallback: simple rule-based memory acknowledgement
      const lastUser = context.findLast?.((m) => m.role === "user")?.content ?? message;
      assistantReply = `Got it. You said: "${lastUser}". I will adjust your current plan accordingly.`;
    }

    convo.messages.push({ role: "assistant", content: assistantReply });
    conversationsById.set(conversationId, convo);
    res.json({ success: true, reply: assistantReply, conversation: convo });
  });

  app.post("/api/chat/clear", (req: Request, res: Response) => {
    const { conversationId } = req.body as { conversationId?: string };
    if (!conversationId) return res.status(400).json({ message: "conversationId required" });
    conversationsById.delete(conversationId);
    res.json({ success: true });
  });

  // Meal planner options
  app.get("/api/meal-plan/options", (_req: Request, res: Response) => {
    res.json({
      mealTypes: ["breakfast", "lunch", "dinner", "snack", "dessert", "entree", "main"],
      spiciness: ["Mild", "Medium", "Hot"],
    });
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
      const { userId, userIds, days, mealsPerDay, mealTypes, spiciness, cuisine, conversationId } = req.body as {
        userId?: number;
        userIds?: number[];
        days?: number;
        mealsPerDay?: number;
        mealTypes?: string[];
        spiciness?: "Mild" | "Medium" | "Hot";
        cuisine?: string;
        conversationId?: string;
      };
      const audience = Array.isArray(userIds) && userIds.length > 0 ? userIds.map(Number) : [Number(userId)];
      if (!audience.length || audience.some((id) => !id || Number.isNaN(id))) return res.status(400).json({ message: "userId or userIds required" });
      const planDays = Math.min(Math.max(days ?? 7, 1), 14);
      const mealsEachDay = Math.min(Math.max(mealsPerDay ?? 3, 1), 5);
      const allowedMealTypes = Array.isArray(mealTypes) && mealTypes.length > 0
        ? mealTypes.map((t) => t.toLowerCase())
        : ["breakfast", "lunch", "dinner", "snack"];
      const spiceLevel: "Mild" | "Medium" | "Hot" = (spiciness === "Mild" || spiciness === "Medium" || spiciness === "Hot") ? spiciness : "Mild";

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
Cuisine preference: ${cuisine || "any"}.
Only use meal types from this set: ${allowedMealTypes.join(", ")}. Respect spiciness level: ${spiceLevel}.
Avoid dislikes: ${merged.dislikes.join(", ") || "none"}.
Respect dietary restrictions: ${merged.dietaryRestrictions.join(", ") || "none"} and allergies: ${merged.allergies.join(", ") || "none"}.
Prefer favorites when reasonable: ${merged.favorites.join(", ") || "none"}.
Target per-person daily calories around ${merged.dailyCalorieGoal}. Use shared dishes that suit everyone when possible.
Return STRICT JSON with shape: [{"day":1, "meals":[{"type":"breakfast|lunch|dinner|snack|dessert|entree|main", "name":"...", "spiciness":"Mild|Medium|Hot", "perPersonCalories": number, "macros": {"calories": number, "protein": number, "carbs": number, "fat": number}}]}].`
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
        // Fallback dynamic generator using favorites/dislikes, pantry, restrictions, meal types, and spiciness
        const MEAL_CATALOG: { name: string; type: string; spice: 0 | 1 | 2 }[] = [
          { name: "Grilled chicken salad", type: "dinner", spice: 0 },
          { name: "Veggie omelette", type: "breakfast", spice: 0 },
          { name: "Quinoa bowl with roasted vegetables", type: "lunch", spice: 0 },
          { name: "Turkey sandwich on whole grain", type: "lunch", spice: 0 },
          { name: "Greek yogurt with berries", type: "snack", spice: 0 },
          { name: "Tofu stir-fry", type: "dinner", spice: 1 },
          { name: "Salmon with brown rice", type: "dinner", spice: 0 },
          { name: "Chickpea curry", type: "dinner", spice: 2 },
          { name: "Oatmeal with banana", type: "breakfast", spice: 0 },
          { name: "Lentil soup", type: "lunch", spice: 0 },
          { name: "Fruit salad", type: "dessert", spice: 0 },
          { name: "Hummus and veggies", type: "snack", spice: 0 },
        ];
        const spiceMax = spiceLevel === "Mild" ? 0 : spiceLevel === "Medium" ? 1 : 2;
        const filteredCatalog = MEAL_CATALOG.filter((m) => allowedMealTypes.includes(m.type)).filter((m) => m.spice <= spiceMax);
        const mealBank = filteredCatalog.map((m) => m.name);
        const avoid = new Set(merged.dislikes.map((x) => x.toLowerCase()));
        const favorites = merged.favorites;
        const pantryBoost = inMemoryPantry.map((p) => p.itemName.toLowerCase());
        const allergyKeywords = new Set(merged.allergies.map((a) => a.toLowerCase()));

        function estimateMacrosForMeal(name: string, perPersonCalories: number): { calories: number; protein: number; carbs: number; fat: number } {
          const n = name.toLowerCase();
          // very rough presets
          const presets: Record<string, { p: number; c: number; f: number }> = {
            "grilled chicken": { p: 40, c: 20, f: 12 },
            "salad": { p: 10, c: 15, f: 10 },
            "omelette": { p: 20, c: 3, f: 15 },
            "quinoa": { p: 12, c: 50, f: 9 },
            "sandwich": { p: 20, c: 45, f: 12 },
            "yogurt": { p: 18, c: 25, f: 5 },
            "tofu": { p: 25, c: 15, f: 12 },
            "curry": { p: 18, c: 45, f: 14 },
            "oatmeal": { p: 10, c: 55, f: 7 },
            "lentil": { p: 22, c: 40, f: 5 },
          };
          const key = Object.keys(presets).find(k => n.includes(k));
          if (key) {
            const { p, c, f } = presets[key];
            const calories = perPersonCalories;
            return { calories, protein: p, carbs: c, fat: f };
          }
          return { calories: perPersonCalories, protein: 20, carbs: 40, fat: 12 };
        }

        function pickMeals(count: number, used: Set<string>, dayIndex: number): { name: string; type: string; spiciness: "Mild" | "Medium" | "Hot" }[] {
          const candidates = [
            ...favorites,
            ...mealBank.filter((m) => !favorites.find((f) => f.toLowerCase() === m.toLowerCase())),
          ]
            .filter((m) => ![...avoid].some((a) => m.toLowerCase().includes(a)))
            .filter((m) => {
              const name = m.toLowerCase();
              for (const r of merged.dietaryRestrictions) {
                const words = restrictionKeywords[r.toLowerCase()];
                if (words && words.some((w) => name.includes(w))) return false;
              }
              if ([...allergyKeywords].some((w) => name.includes(w))) return false;
              return true;
            })
            .sort((a, b) => {
              const aScore = pantryBoost.some((i) => a.toLowerCase().includes(i)) ? 1 : 0;
              const bScore = pantryBoost.some((i) => b.toLowerCase().includes(i)) ? 1 : 0;
              return bScore - aScore;
            });
          const picked: { name: string; type: string; spiciness: "Mild" | "Medium" | "Hot" }[] = [];
          for (let i = 0; i < count; i++) {
            let attempt = 0;
            let choice = "Chef's choice";
            while (attempt < candidates.length) {
              const c = candidates[(i + Math.floor(Math.random() * candidates.length) + attempt) % candidates.length] ?? "Chef's choice";
              if (!used.has(c.toLowerCase())) { choice = c; break; }
              attempt++;
            }
            used.add(choice.toLowerCase());
            const found = filteredCatalog.find((m) => m.name.toLowerCase() === choice.toLowerCase());
            const fallbackType = allowedMealTypes[i % allowedMealTypes.length] || "dinner";
            const type = found?.type ?? fallbackType;
            const s: "Mild" | "Medium" | "Hot" = found ? (found.spice === 0 ? "Mild" : found.spice === 1 ? "Medium" : "Hot") : spiceLevel;
            picked.push({ name: choice, type, spiciness: s });
          }
          return picked;
        }

        plan = Array.from({ length: planDays }, (_v, i) => {
          const used = new Set<string>();
          const mealsPicked = pickMeals(mealsEachDay, used, i);
          const perPerson = Math.round(merged.dailyCalorieGoal / mealsEachDay);
          const meals = mealsPicked.map((m) => ({ type: m.type, name: m.name, spiciness: m.spiciness, perPersonCalories: perPerson, macros: estimateMacrosForMeal(m.name, perPerson) }));
          const familySwaps = meals.map((m) => {
            const exclude = new Set([m.name.toLowerCase(), ...mealsPicked.map((x) => x.name.toLowerCase())]);
            const perUser = profiles.map((p) => ({
              userId: p.userId,
              swaps: generateAlternatives(p, p.favorites, mealBank, pantryBoost, exclude, 3),
            }));
            return { forMeal: m.name, alternatives: perUser };
          });
          return { day: i + 1, meals, swaps: familySwaps };
        });
      }

      if (conversationId) {
        const convo = conversationsById.get(conversationId) ?? { messages: [] };
        convo.currentPlan = plan;
        conversationsById.set(conversationId, convo);
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

  // --- Swap suggestions on demand ---
  app.post("/api/meal-plan/swaps", (req: Request, res: Response) => {
    const { userId, mealName } = req.body as { userId?: number; mealName?: string };
    if (!userId || !mealName) return res.status(400).json({ message: "userId and mealName are required" });
    const profile = getOrCreateUserProfile(Number(userId));
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
    const pantryBoost = inMemoryPantry.map((p) => p.itemName.toLowerCase());
    const exclude = new Set<string>([mealName.toLowerCase()]);
    const swaps = generateAlternatives(profile, profile.favorites, mealBank, pantryBoost, exclude, 5);
    res.json({ success: true, swaps });
  });

  // --- Nutrition: estimate and log ---
  app.post("/api/nutrition/estimate", (req: Request, res: Response) => {
    const { mealName, perPersonCalories } = req.body as { mealName?: string; perPersonCalories?: number };
    if (!mealName || !perPersonCalories) return res.status(400).json({ message: "mealName and perPersonCalories required" });
    const calories = Math.max(100, Math.min(1200, Math.round(perPersonCalories)));
    const estimate = {
      calories,
      protein: Math.round((calories * 0.2) / 4),
      carbs: Math.round((calories * 0.5) / 4),
      fat: Math.round((calories * 0.3) / 9),
    };
    res.json({ success: true, macros: estimate });
  });

  app.post("/api/nutrition/log-meal", (req: Request, res: Response) => {
    const { userId, mealName, macros } = req.body as { userId?: number; mealName?: string; macros?: { calories: number; protein: number; carbs: number; fat: number } };
    if (!userId || !mealName || !macros) return res.status(400).json({ message: "userId, mealName, macros required" });
    const list = nutritionLogsByUserId.get(Number(userId)) ?? [];
    const entry = { dateIso: new Date().toISOString(), calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat, mealName };
    list.push(entry);
    nutritionLogsByUserId.set(Number(userId), list);
    res.status(201).json({ success: true });
  });

  app.get("/api/nutrition/today", (req: Request, res: Response) => {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ message: "userId required" });
    const list = nutritionLogsByUserId.get(userId) ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = list.filter(e => e.dateIso.slice(0, 10) === today);
    const totals = todayEntries.reduce((acc, e) => {
      acc.calories += e.calories; acc.protein += e.protein; acc.carbs += e.carbs; acc.fat += e.fat; return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    res.json({ success: true, totals, entries: todayEntries });
  });

  // --- Sync current plan into a conversation (when generated on client) ---
  app.post("/api/meal-plan/sync", (req: Request, res: Response) => {
    const { conversationId, plan } = req.body as { conversationId?: string; plan?: any };
    if (!conversationId || !plan) return res.status(400).json({ message: "conversationId and plan required" });
    const convo = conversationsById.get(conversationId) ?? { messages: [] };
    convo.currentPlan = plan;
    conversationsById.set(conversationId, convo);
    res.json({ success: true });
  });

  // --- Adjust current plan based on conversation ---
  app.post("/api/meal-plan/adjust", (req: Request, res: Response) => {
    const { conversationId, instruction } = req.body as { conversationId?: string; instruction?: string };
    if (!conversationId || !instruction) return res.status(400).json({ message: "conversationId and instruction required" });
    const convo = conversationsById.get(conversationId);
    if (!convo?.currentPlan) return res.status(404).json({ message: "no current plan for conversation" });

    // Naive adjuster: replace one meal if user says "change" something
    const plan = JSON.parse(JSON.stringify(convo.currentPlan));
    const lower = instruction.toLowerCase();
    // Find first meal that matches a mentioned keyword to change
    let changed = false;
    for (const day of plan) {
      for (const meal of day.meals) {
        if (lower.includes("change") || lower.includes("swap") || lower.includes(meal.name.toLowerCase())) {
          meal.name = meal.name.includes("salad") ? "Tofu stir-fry" : "Quinoa bowl with roasted vegetables";
          changed = true;
          break;
        }
      }
      if (changed) break;
    }

    convo.currentPlan = plan;
    conversationsById.set(conversationId, convo);
    res.json({ success: true, plan });
  });

  return;
}
