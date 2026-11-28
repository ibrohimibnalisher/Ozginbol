import { Bot, InlineKeyboard, InputFile, type Context } from "grammy";
import type { Store } from "./db";
import { tashkentDay } from "./db";
import {
  HELP, exportCsv, fast, findFood, measure, menu, repeatList, handleCallback, myFoods, newFood, newRecipe, handleText, plan, reminderFor, startOnboarding, today, toggleReminder,
  undo, water, week, weight, workout, type Reply,
} from "./logic";

function keyboard(r: Reply): InlineKeyboard | undefined {
  if (!r.buttons) return undefined;
  const kb = new InlineKeyboard();
  r.buttons.forEach((row, i) => {
    row.forEach((b) => kb.text(b.text, b.data));
    if (i < r.buttons!.length - 1) kb.row();
  });
  return kb;
}

async function send(ctx: Context, r: Reply) {
  await ctx.reply(r.text, { parse_mode: "HTML", reply_markup: keyboard(r), link_preview_options: { is_disabled: true } });
}

export function createBot(token: string, store: Store): Bot {
  const bot = new Bot(token);

  const userOf = (ctx: Context) => {
    const from = ctx.from!;
    return store.ensureUser(from.id, [from.first_name, from.last_name].filter(Boolean).join(" "));
  };

  bot.command("start", (ctx) => {
    const u = userOf(ctx);
    return send(ctx, u.step === "done" ? { text: HELP } : startOnboarding(store, u));
  });
  bot.command(["yordam", "help"], (ctx) => send(ctx, { text: HELP }));
  bot.command("maqsad", (ctx) => send(ctx, startOnboarding(store, userOf(ctx))));
  bot.command("bugun", (ctx) => send(ctx, today(store, userOf(ctx))));
  bot.command("hafta", (ctx) => send(ctx, week(store, userOf(ctx))));
  bot.command("ochir", (ctx) => send(ctx, undo(store, userOf(ctx))));
  bot.command("suv", (ctx) => send(ctx, water(store, userOf(ctx), Number(ctx.match) || 250)));
  bot.command("vazn", (ctx) => send(ctx, weight(store, userOf(ctx), ctx.match)));
  bot.command(["olcham", "olchov"], (ctx) => send(ctx, measure(store, userOf(ctx), ctx.match)));
  bot.command(["ochlik", "fasting"], (ctx) => send(ctx, fast(store, userOf(ctx), ctx.match)));
  bot.command(["menyu", "menu"], (ctx) => send(ctx, menu(store, userOf(ctx))));
  bot.command(["takror", "yana"], (ctx) => send(ctx, repeatList(store, userOf(ctx))));
  bot.command("eksport", async (ctx) => {
    const u = userOf(ctx);
    const csv = exportCsv(store, u);
    if (csv.split("\n").length < 2) return send(ctx, { text: "Kundalik bo'sh." });
    await ctx.replyWithDocument(new InputFile(Buffer.from("\ufeff" + csv, "utf8"), `ozginbol-${tashkentDay()}.csv`), { caption: "Kundalik (Excel'da ochiladi)" });
  });
  bot.command("mashq", (ctx) => send(ctx, workout(store, userOf(ctx), ctx.match)));
  bot.command("mashqlar", (ctx) => send(ctx, plan(userOf(ctx))));
  bot.command(["taom", "manba"], (ctx) => send(ctx, findFood(store, userOf(ctx), ctx.match)));
  bot.command("yangi", (ctx) => send(ctx, newFood(store, userOf(ctx), ctx.match)));
  bot.command("retsept", (ctx) => send(ctx, newRecipe(store, userOf(ctx), ctx.match)));
  bot.command("mening", (ctx) => send(ctx, myFoods(store, userOf(ctx))));
  bot.command("eslatma", (ctx) => send(ctx, toggleReminder(store, userOf(ctx))));

  bot.on("callback_query:data", async (ctx) => {
    const r = handleCallback(store, userOf(ctx), ctx.callbackQuery.data);
    await ctx.answerCallbackQuery();
    if (r) await send(ctx, r);
  });

  bot.on("message:photo", (ctx) =>
    send(ctx, {
      text: "📷 Rasmdan aniqlash tez orada qo'shiladi. Hozircha taomni yozib yuboring, masalan: <code>1 porsiya osh va choy</code>",
    }),
  );

  bot.on("message:text", (ctx) => send(ctx, handleText(store, userOf(ctx), ctx.message.text)));

  bot.catch((err) => console.error("bot error", err.error));
  return bot;
}

/** Sends lunch (13:00) and evening (20:30) reminders, Tashkent time. */
export function startReminders(bot: Bot, store: Store): NodeJS.Timeout {
  const sent = new Set<string>();
  return setInterval(async () => {
    const now = new Date(Date.now() + 5 * 3600_000);
    const hm = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const kind = hm === "13:00" ? "lunch" : hm === "20:30" ? "evening" : null;
    if (!kind) return;
    const tag = `${tashkentDay()}:${kind}`;
    if (sent.has(tag)) return;
    sent.add(tag);
    for (const u of store.usersForReminder()) {
      const text = reminderFor(store, u, kind);
      if (!text) continue;
      try {
        await bot.api.sendMessage(u.id, text, { parse_mode: "HTML" });
      } catch (e) {
        console.warn("reminder failed", u.id, (e as Error).message);
      }
      await new Promise((r) => setTimeout(r, 40)); // stay under Telegram's 30 msg/s limit
    }
  }, 20_000);
}
