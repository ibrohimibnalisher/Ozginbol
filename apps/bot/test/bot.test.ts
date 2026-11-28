import { describe, expect, it } from "vitest";
import { createBot } from "../src/bot";
import { Store } from "../src/db";

/** Runs real grammY handlers against a fake Telegram API. */
function harness() {
  const store = new Store(":memory:");
  const bot = createBot("123:test", store);
  bot.botInfo = { id: 1, is_bot: true, first_name: "Ozginbol", username: "ozginbol_bot", can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false } as never;
  const sent: { method: string; payload: Record<string, unknown> }[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    sent.push({ method, payload: payload as Record<string, unknown> });
    return { ok: true, result: true } as never;
  });
  let id = 1;
  const from = { id: 7, is_bot: false, first_name: "Ali" };
  const chat = { id: 7, type: "private" as const, first_name: "Ali" };
  const text = (t: string) =>
    bot.handleUpdate({
      update_id: id++,
      message: {
        message_id: id, date: 0, chat, from, text: t,
        ...(t.startsWith("/") ? { entities: [{ type: "bot_command", offset: 0, length: t.split(" ")[0]!.length }] } : {}),
      },
    } as never);
  const press = (data: string) =>
    bot.handleUpdate({ update_id: id++, callback_query: { id: String(id), from, chat_instance: "x", data, message: { message_id: 1, date: 0, chat } } } as never);
  const last = () => sent.filter((s) => s.method === "sendMessage").at(-1)!.payload;
  return { text, press, last, store };
}

describe("telegram bot", () => {
  it("onboards and logs food end to end", async () => {
    const h = harness();
    await h.text("/start");
    expect(String(h.last().text)).toContain("Jinsingiz");
    await h.press("sex:female");
    await h.text("27");
    await h.text("163");
    await h.text("68");
    await h.press("act:moderate");
    await h.press("goal:lose");
    await h.press("rate:0.5");
    await h.text("62");
    expect(String(h.last().text)).toContain("Kunlik me'yoringiz");
    await h.text("/yangi Agusha tvorog, 159, 18, 9, 2");
    expect(String(h.last().text)).toContain("qo'shildi");
    await h.text("/taom somsa");
    expect(String(h.last().text)).toContain("Manba");
    await h.text("1 kosa mastava, 2 bo'lak non");
    expect(String(h.last().text)).toContain("Mastava");
    expect(h.last().parse_mode).toBe("HTML");
    await h.press("undo");
    expect(String(h.last().text)).toContain("O'chirildi");
    await h.text("/suv 500");
    expect(String(h.last().text)).toContain("+500 ml");
    await h.text("/hafta");
    expect(String(h.last().text)).toContain("Oxirgi 7 kun");
  });
});
