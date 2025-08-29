type LabelNutrients = {
  calories?: { value: number };
  protein?: { value: number };
  carbohydrates?: { value: number };
  fat?: { value: number };
};

type FoodSearchItem = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  labelNutrients?: LabelNutrients;
  foodNutrients?: { nutrientName: string; value: number; unitName: string }[];
};

export type Macros = { calories: number; protein: number; carbs: number; fat: number };

function parseMacros(item: FoodSearchItem): Macros | undefined {
  // Prefer labelNutrients (Branded)
  if (item.labelNutrients) {
    const ln = item.labelNutrients;
    const calories = ln.calories?.value;
    const protein = ln.protein?.value;
    const carbs = ln.carbohydrates?.value;
    const fat = ln.fat?.value;
    if ([calories, protein, carbs, fat].every((v) => typeof v === "number")) {
      return { calories: calories as number, protein: protein as number, carbs: carbs as number, fat: fat as number };
    }
  }

  // Fallback to foodNutrients
  if (Array.isArray(item.foodNutrients)) {
    const byName = (name: string) => item.foodNutrients!.find((n) => n.nutrientName.toLowerCase().includes(name));
    const energy = byName("energy")?.value; // Often kcal per 100g
    const protein = byName("protein")?.value;
    const carbs = byName("carbohydrate")?.value ?? byName("carbohydrate, by difference")?.value;
    const fat = byName("total lipid")?.value ?? byName("fat, total")?.value;
    if ([energy, protein, carbs, fat].every((v) => typeof v === "number")) {
      return { calories: energy as number, protein: protein as number, carbs: carbs as number, fat: fat as number };
    }
  }
}

export async function usdaSearchFoods(query: string, pageSize: number = 5) {
  const key = process.env.USDA_API_KEY;
  if (!key) throw new Error("USDA_API_KEY not set");
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`USDA search failed: ${resp.status}`);
  const json = await resp.json();
  const foods: FoodSearchItem[] = json?.foods ?? [];
  return foods.map((f) => ({
    fdcId: f.fdcId,
    description: f.description,
    dataType: f.dataType,
    brandOwner: f.brandOwner,
    servingSize: f.servingSize,
    servingSizeUnit: f.servingSizeUnit,
    macros: parseMacros(f),
  }));
}

export async function usdaEstimateMacros(query: string): Promise<Macros | undefined> {
  const results = await usdaSearchFoods(query, 5);
  const withMacros = results.find((r) => r.macros);
  return withMacros?.macros;
}

