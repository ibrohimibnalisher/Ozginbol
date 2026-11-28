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

Bot buyruqlari: /bugun, /hafta, /ochir, /suv, /mashq, /vazn, /olcham, /menyu, /ochlik, /takror, /eksport, /maqsad, /mashqlar, /taom (yoki /manba), /yangi, /retsept, /mening, /eslatma.

- `/yangi Agusha tvorog, 159, 18, 9, 2` o'z mahsulotini qo'shadi (100 g uchun kkal, oqsil, yog', uglevod; oxiriga `dona 100` qo'shsa 1 dona og'irligi).
- `/retsept Uy oshi: 1 kg guruch, 1 kg mol go'shti, 250 g yog' | 4500 | 12` retseptni masalliqlardan hisoblaydi (tayyor og'irlik va porsiya ixtiyoriy).
- `/olcham bo'yin 38 bel 85` (ayollar `son 98` ham) yog' foizini hisoblaydi, o'lchovlar tarixini saqlaydi va kunlik me'yorni yog' foizi bilan qayta hisoblaydi.
- `/taom somsa` taom kaloriyasi qayerdan olinganini masalliqma-masalliq ko'rsatadi. Oddiy matn yozilsa ("2 ta somsa va choy") kundalikka qo'shiladi, "30 daqiqa yugurdim" mashg'ulot sifatida yoziladi. Eslatmalar Toshkent vaqti bilan 13:00 va 20:30 da.
- `/vitamin` bugungi vitamin va minerallarni kunlik me'yorga nisbatan ko'rsatadi, `/til` tilni almashtiradi (o'zbekcha, ruscha, inglizcha; birinchi kirishda Telegram tilidan olinadi).

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

## Yog' foizi

AQSh harbiy-dengiz flotining (US Navy) lenta usuli (Hodgdon va Beckett, 1984), santimetrda:

- Erkaklar: 495 ÷ (1.0324 − 0.19077 × log(bel − bo'yin) + 0.15456 × log(bo'y)) − 450
- Ayollar: 495 ÷ (1.29579 − 0.35004 × log(bel + son − bo'yin) + 0.221 × log(bo'y)) − 450

Natijadan yog' va yog'siz massa, ACE toifasi, bel ÷ bo'y nisbati (0.5 dan yuqorisi xavf) va JSST bel chegaralari (erkak 94/102, ayol 80/88 sm) chiqadi. O'lchov saqlansa, kunlik me'yor Katch-McArdle formulasi bilan hisoblanadi. Kod: `packages/core/src/body.ts`.

## Dizayn

Website va ilova bitta rang tizimidan foydalanadi (`apps/web/app/globals.css` va `apps/mobile/src/theme.ts`): yashil brend rangi, oqsil/yog'/uglevod uchun doimiy ranglar, kunduzgi va tungi rejim. Websiteda Manrope shrifti.

## Rejalashtirish va odatlar

- **Menyu generatori** (`menu.ts`): o'zbek taomlaridan kunlik menyu, kaloriya ±5% ichida, maqsadga qarab oqsilga ustunlik; porsiyalar 0.7-1.5× oralig'ida moslanadi.
- **Interval ochlik** (`fasting.ts`): 12:12 dan 20:4 gacha, bosqichlar, tugash vaqti (ilovada bildirishnoma).
- **Moslashuvchan TDEE** (`adaptive.ts`): vazn trendi (eksponensial tekislash) va kundalikdan haqiqiy sarf: o'rtacha iste'mol − trend o'zgarishi × 7700 ÷ kunlar.
- **Kun bahosi** (`score.ts`): kaloriya, oqsil, yog', meva/sabzavot va shirinlik ulushi, suv bo'yicha 0-100 va A-E.
- **Yutuqlar** (`achievements.ts`): 15 ta odat nishoni.
- **Mashqlar texnikasi** (`library.ts`): uy va zal mashqlari, qadamlar va ko'p uchraydigan xatolar.
- Ilovada: qadam hisoblagich (expo-sensors), ovqat va suv eslatmalari (expo-notifications), kechagi ovqatni takrorlash, sevimli ovqatlar, har ovqat uchun kaloriya limiti, CSV eksport.

## Vitamin va minerallar

`micros.ts`: 12 ta modda (shakar, natriy, kaliy, kalsiy, temir, magniy, rux, A, C, D, B12, folat) 100 g uchun, USDA SR Legacy'dan. Milliy taomlar masalliqlardan hisoblanadi (tuz ham, tayyor og'irlikning ~0.8%). Kunlik me'yor AQSh Milliy akademiyalari (NIH) DRI jadvallaridan, jins va yosh bo'yicha; natriy uchun yuqori chegara 2300 mg. Kamaygan moddalar uchun o'zbek mahsulotlaridan manba tavsiya qilinadi.

## Tillar

Interfeys o'zbek, rus va ingliz tilida. O'zbekcha matnning o'zi kalit (`t(lang, "O'zbekcha matn")`), tarjimasi `packages/core/src/i18n/ru.ts` va `en.ts` da; tarjima bo'lmasa o'zbekcha ko'rsatiladi. Core ichida raqamli jumlalar `{0}` shablonlari orqali tarjima qilinadi. Yangi matn qo'shilganda `npm run i18n:keys -w @ozginbol/core` kalitlar ro'yxatini yangilaydi, test esa har bir kalitning ru/en tarjimasi borligini tekshiradi.

## Progress fotolar

Ilovada old, yon va orqa pozalar uchun rasm olinadi, "oldin" va "keyin" yonma-yon, o'tgan kunlar va vazn farqi bilan ko'rsatiladi. Rasmlar faqat telefonda (`documentDirectory/progress/`) saqlanadi.
