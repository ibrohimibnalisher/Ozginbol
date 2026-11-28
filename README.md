# Ozginbol

Kaloriya hisoblash va sog'lom turmush uchun ilova, Telegram bot va website. O'zbek taomlarini (osh, somsa, lag'mon, manti...) aniq biladigan, o'zbekcha, kirillcha, ruscha yozilgan matnni tushunadigan kalkulyator.

## Tuzilma

```
packages/core   Umumiy yadro: taomlar bazasi, matnni tahlil qilish, maqsad va makro hisoblash, mashqlar
apps/web        Website (Next.js): kaloriya kalkulyatori, kunlik me'yor, taomlar bazasi, /api/parse
apps/bot        Telegram bot (grammY + SQLite): kundalik, hisobotlar, suv, vazn, mashg'ulot, eslatmalar
apps/mobile     Mobil ilova (Expo SDK 54, iOS va Android): kundalik, hisobot, mashg'ulot, profil
```

## Ishga tushirish

```bash
npm install
npm test          # barcha testlar
npm run dev:web   # http://localhost:3000
```

### Telegram bot

1. @BotFather orqali bot yarating va tokenni oling.
2. `apps/bot/.env.example` dan nusxa olib `apps/bot/.env` yarating, `BOT_TOKEN` ni yozing.
3. `cd apps/bot && node --env-file=.env --import tsx src/index.ts` (yoki `BOT_TOKEN=... npm run dev:bot`).

Bot buyruqlari: /bugun, /hafta, /ochir, /suv, /mashq, /vazn, /maqsad, /mashqlar, /taom (yoki /manba), /yangi, /retsept, /mening, /eslatma.

- `/yangi Agusha tvorog, 159, 18, 9, 2` o'z mahsulotini qo'shadi (100 g uchun kkal, oqsil, yog', uglevod; oxiriga `dona 100` qo'shsa 1 dona og'irligi).
- `/retsept Uy oshi: 1 kg guruch, 1 kg mol go'shti, 250 g yog' | 4500 | 12` retseptni masalliqlardan hisoblaydi (tayyor og'irlik va porsiya ixtiyoriy).
- `/taom somsa` taom kaloriyasi qayerdan olinganini masalliqma-masalliq ko'rsatadi. Oddiy matn yozilsa ("2 ta somsa va choy") kundalikka qo'shiladi, "30 daqiqa yugurdim" mashg'ulot sifatida yoziladi. Eslatmalar Toshkent vaqti bilan 13:00 va 20:30 da.

### Mobil ilova

```bash
cd apps/mobile
npx expo start    # telefonda Expo Go ilovasi bilan QR kodni skanerlang
```

Ilova oflayn ishlaydi, ma'lumotlar telefonda saqlanadi. Ekranlar: Bugun (kaloriya halqasi, makrolar, nonushta/tushlik/kechki/gazak, suv), qo'shish (matn yozish, darrov hisob, tez qo'shish), Hisobot (7 kun, vazn grafigi), Mashq (mashg'ulot yozish va reja), Profil, Mahsulotlarim (o'z mahsuloti, retsept, do'kon mahsulotining shtrix-kodini skanerlash: qiymatlar Open Food Facts ochiq bazasidan). Har bir taomni bosib hajmini (kichik/o'rta/katta), grammini va kaloriya manbasini ko'rish mumkin.

## API

`GET /api/parse?q=2 ta somsa va 1 kosa lag'mon` taomlar, gramm, kaloriya, oqsil, yog', uglevod va jami qiymatni qaytaradi.

## Ma'lumotlar manbai

Har bir taomda `source` maydoni bor:

- `usda`: USDA FoodData Central
- `ru-table`: rus oziq-ovqat tarkibi jadvallari (Skurikhin)
- `recipe`: o'zbek oshxonasining odatiy retseptidan hisoblangan (go'sht, yog', guruch/xamir nisbati)
- `label`: ishlab chiqaruvchi yorlig'i (shu jumladan Open Food Facts shtrix-kod bazasi)
- `user`: foydalanuvchi o'zi kiritgan mahsulot

Milliy taomlar (`recipe`) xom masalliqlardan hisoblanadi: `packages/core/src/recipes.ts` da har bir retseptning masalliqlari va tayyor og'irligi, `ingredients.ts` da har bir masalliqning USDA manbasi. Masalan somsa: 500 g un, 250 g suv, 30 g yog', 400 g qo'y go'shti, 150 g dumba, 400 g piyoz = 4498 kkal, tayyor 1450 g, ya'ni 100 g da 310 kkal; o'rtacha somsa 130 g = 403 kkal.

Testlar har bir taom uchun energiya qiymatini oqsil/yog'/uglevoddan tekshiradi (4/9/4 qoidasi), shuning uchun bazaga xato raqam kirib qolmaydi.

## Maqsad hisoblash

To'rt rejim: Sushka (quritish), Ozish, Vaznni saqlash, Massa nabor.

1. BMR: Mifflin-St Jeor (yog' foizi kiritilsa Katch-McArdle).
2. TDEE = BMR × faollik koeffitsienti.
3. Kunlik farq = haftalik tezlik × 7700 / 7 (1 kg yog' ≈ 7700 kkal). Chegaralar: ozish defitsiti TDEE ning 25%, sushka 30%, massa profitsiti 20% dan oshmaydi; minimum ayollar 1200, erkaklar 1500 kkal.
4. Makrolar: oqsil sushkada 2.2 g/kg, ozishda 1.8, saqlashda 1.6, massada 1.8 (TMI 30 dan yuqori bo'lsa tuzatilgan vazn bo'yicha); yog' 0.8-1.0 g/kg; qolgani uglevod.
5. Maqsad vazn kiritilsa, unga necha haftada yetishi va sog'lom vazn oralig'i ko'rsatiladi. Har bir qadam foydalanuvchiga "Qanday hisoblandi" bo'limida ochiq ko'rsatiladi.
