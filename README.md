# Ozginbol

Kaloriya hisoblash va sog'lom turmush uchun ilova, Telegram bot va website. O'zbek taomlarini (osh, somsa, lag'mon, manti...) aniq biladigan, o'zbekcha, kirillcha, ruscha yozilgan matnni tushunadigan kalkulyator.

## Tuzilma

```
packages/core   Umumiy yadro: taomlar bazasi, matnni tahlil qilish, maqsad va makro hisoblash, mashqlar
apps/web        Website (Next.js): kaloriya kalkulyatori, kunlik me'yor, taomlar bazasi, /api/parse
apps/bot        Telegram bot (grammY + SQLite): kundalik, hisobotlar, suv, vazn, mashg'ulot, eslatmalar
apps/mobile     (keyingi bosqich) Mobil ilova (Expo)
```

## Ishga tushirish

```bash
npm install
npm test          # yadro testlari
npm run dev:web   # http://localhost:3000
```

### Telegram bot

1. @BotFather orqali bot yarating va tokenni oling.
2. `apps/bot/.env.example` dan nusxa olib `apps/bot/.env` yarating, `BOT_TOKEN` ni yozing.
3. `cd apps/bot && node --env-file=.env --import tsx src/index.ts` (yoki `BOT_TOKEN=... npm run dev:bot`).

Bot buyruqlari: /bugun, /hafta, /ochir, /suv, /mashq, /vazn, /maqsad, /mashqlar, /taom, /eslatma. Oddiy matn yozilsa ("2 ta somsa va choy") kundalikka qo'shiladi, "30 daqiqa yugurdim" mashg'ulot sifatida yoziladi. Eslatmalar Toshkent vaqti bilan 13:00 va 20:30 da.

## API

`GET /api/parse?q=2 ta somsa va 1 kosa lag'mon` taomlar, gramm, kaloriya, oqsil, yog', uglevod va jami qiymatni qaytaradi.

## Ma'lumotlar manbai

Har bir taomda `source` maydoni bor:

- `usda`: USDA FoodData Central
- `ru-table`: rus oziq-ovqat tarkibi jadvallari (Skurikhin)
- `recipe`: o'zbek oshxonasining odatiy retseptidan hisoblangan (go'sht, yog', guruch/xamir nisbati)
- `label`: ishlab chiqaruvchi yorlig'i bo'yicha o'rtacha

Testlar har bir taom uchun energiya qiymatini oqsil/yog'/uglevoddan tekshiradi (4/9/4 qoidasi), shuning uchun bazaga xato raqam kirib qolmaydi.

## Maqsad hisoblash

Mifflin-St Jeor formulasi, faollik koeffitsienti, ozish uchun 20% defitsit (xavfsiz minimum: ayollar 1200, erkaklar 1500 kkal), oqsil 1.6-2.0 g/kg.
