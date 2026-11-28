import { NextResponse } from "next/server";
import { parseMeal } from "@ozginbol/core";

/**
 * GET /api/parse?q=2 ta somsa va 1 kosa lag'mon
 * Public JSON endpoint shared by the website, the Telegram bot and the app.
 */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length > 1000) return NextResponse.json({ error: "Matn juda uzun" }, { status: 413 });
  const r = parseMeal(q);
  return NextResponse.json({
    items: r.items.map((i) => ({
      foodId: i.food.id,
      name: i.food.name,
      input: i.input,
      quantity: i.quantity,
      unit: i.unit,
      grams: i.grams,
      nutrition: i.nutrition,
      confidence: i.confidence,
    })),
    unknown: r.unknown,
    total: r.total,
  });
}
