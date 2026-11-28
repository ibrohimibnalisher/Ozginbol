import { createBot, startReminders } from "./bot";
import { Store } from "./db";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set. Get one from @BotFather and put it in apps/bot/.env");
  process.exit(1);
}

const store = new Store(process.env.DB_PATH ?? "./ozginbol.db");
const bot = createBot(token, store);

await bot.api.setMyCommands([
  { command: "bugun", description: "Bugungi hisobot" },
  { command: "hafta", description: "Haftalik hisobot" },
  { command: "ochir", description: "Oxirgi yozuvni o'chirish" },
  { command: "suv", description: "Suv qo'shish" },
  { command: "mashq", description: "Mashg'ulot yozish" },
  { command: "vazn", description: "Vaznni yozish" },
  { command: "maqsad", description: "Kunlik me'yorni hisoblash" },
  { command: "mashqlar", description: "Mashg'ulot rejasi" },
  { command: "taom", description: "Taom va uning manbasi" },
  { command: "yangi", description: "O'z mahsulotimni qo'shish" },
  { command: "retsept", description: "O'z retseptimni qo'shish" },
  { command: "mening", description: "Mening mahsulotlarim" },
  { command: "eslatma", description: "Eslatmalarni yoqish/o'chirish" },
  { command: "yordam", description: "Yordam" },
]);

const timer = startReminders(bot, store);
const stop = () => {
  clearInterval(timer);
  void bot.stop();
  store.close();
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

console.log("Ozginbol bot ishga tushdi");
await bot.start({ drop_pending_updates: true });
