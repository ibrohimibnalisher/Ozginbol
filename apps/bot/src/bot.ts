import { Bot, InlineKeyboard, InputFile, type Context } from "grammy";
import type { Store } from "./db";
import { tashkentDay, type User } from "./db";
import { L, withLang } from "./lang";
import {
  help, langMenu, vitamins, exportCsv, fast, findFood, measure, menu, repeatList, handleCallback, myFoods, newFood, newRecipe, handleText, plan, reminderFor, startOnboarding, today, toggleReminder,
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
  /** Runs a handler in the user's language. */
  const reply = (ctx: Context, fn: (u: User) => Reply) => {
    const u = userOf(ctx);
    return send(ctx, withLang(u.lang, () => fn(u)));
  };

  bot.command("start", (ctx) => {
    let u = userOf(ctx);
    // First visit: answer in the language of the user's Telegram app.
    const code = ctx.from?.language_code ?? "";
    if (u.step === "sex" && u.lang === "uz" && (code.startsWith("ru") || code.startsWith("en"))) u = store.updateUser(u.id, { lang: code.startsWith("ru") ? "ru" : "en" });
    return send(ctx, withLang(u.lang, () => (u.step === "done" ? { text: help() } : startOnboarding(store, u))));
  });
  bot.command(["yordam", "help"], (ctx) => reply(ctx, () => ({ text: help() })));
  bot.command(["til", "lang", "language", "yazyk"], (ctx) => reply(ctx, () => langMenu()));
  bot.command(["vitamin", "vitaminlar", "micro"], (ctx) => reply(ctx, (u) => vitamins(store, u)));
  bot.command("maqsad", (ctx) => reply(ctx, (u) => startOnboarding(store, u)));
  bot.command("bugun", (ctx) => reply(ctx, (u) => today(store, u)));
  bot.command("hafta", (ctx) => reply(ctx, (u) => week(store, u)));
  bot.command("ochir", (ctx) => reply(ctx, (u) => undo(store, u)));
  bot.command("suv", (ctx) => reply(ctx, (u) => water(store, u, Number(ctx.match) || 250)));
  bot.command("vazn", (ctx) => reply(ctx, (u) => weight(store, u, ctx.match)));
  bot.command(["olcham", "olchov"], (ctx) => reply(ctx, (u) => measure(store, u, ctx.match)));
  bot.command(["ochlik", "fasting"], (ctx) => reply(ctx, (u) => fast(store, u, ctx.match)));
  bot.command(["menyu", "menu"], (ctx) => reply(ctx, (u) => menu(store, u)));
  bot.command(["takror", "yana"], (ctx) => reply(ctx, (u) => repeatList(store, u)));
  bot.command("eksport", async (ctx) => {
    const u = userOf(ctx);
    const csv = exportCsv(store, u);
    if (csv.split("\n").length < 2) return reply(ctx, () => ({ text: L("Kundalik bo'sh.") }));
    const caption = withLang(u.lang, () => L("Kundalik (Excel'da ochiladi)"));
    await ctx.replyWithDocument(new InputFile(Buffer.from("\ufeff" + csv, "utf8"), `ozginbol-${tashkentDay()}.csv`), { caption });
  });
  bot.command("mashq", (ctx) => reply(ctx, (u) => workout(store, u, ctx.match)));
  bot.command("mashqlar", (ctx) => reply(ctx, (u) => plan(u)));
  bot.command(["taom", "manba"], (ctx) => reply(ctx, (u) => findFood(store, u, ctx.match)));
  bot.command("yangi", (ctx) => reply(ctx, (u) => newFood(store, u, ctx.match)));
  bot.command("retsept", (ctx) => reply(ctx, (u) => newRecipe(store, u, ctx.match)));
  bot.command("mening", (ctx) => reply(ctx, (u) => myFoods(store, u)));
  bot.command("eslatma", (ctx) => reply(ctx, (u) => toggleReminder(store, u)));

  bot.on("callback_query:data", async (ctx) => {
    const u = userOf(ctx);
    const r = withLang(u.lang, () => handleCallback(store, u, ctx.callbackQuery.data));
    await ctx.answerCallbackQuery();
    if (r) await send(ctx, r);
  });

  bot.on("message:photo", (ctx) =>
    reply(ctx, () => ({
      text: `📷 ${L("Rasmdan aniqlash tez orada qo'shiladi. Hozircha taomni yozib yuboring, masalan: <code>1 porsiya osh va choy</code>")}`,
    })),
  );

  bot.on("message:text", (ctx) => reply(ctx, (u) => handleText(store, u, ctx.message.text)));

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
      const text = withLang(u.lang, () => reminderFor(store, u, kind));
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
