/** Exercise technique library: what to do, which muscles, and the usual mistakes. */

export interface LibraryExercise {
  id: string;
  name: string;
  muscles: string;
  equipment: "uy" | "zal";
  level: "boshlovchi" | "o'rta";
  steps: string[];
  mistakes: string[];
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  {
    id: "squat", name: "O'tirib-turish (squat)", muscles: "Son, dumba", equipment: "uy", level: "boshlovchi",
    steps: ["Oyoqlar yelka kengligida, uchlari biroz tashqariga.", "Dumbani orqaga cho'zib, son polga parallel bo'lguncha o'tiring.", "Tovonga tayanib turing, tizzani oxirigacha qulflamang."],
    mistakes: ["Tizzalar ichkariga tushadi", "Tovon yerdan ko'tariladi", "Bel bukiladi"],
  },
  {
    id: "pushup", name: "Yerdan ko'tarilish (otjimaniye)", muscles: "Ko'krak, triceps, yelka", equipment: "uy", level: "boshlovchi",
    steps: ["Qo'llar yelkadan biroz kengroq, tana boshdan tovongacha to'g'ri.", "Ko'krakni yerga 3-5 sm qolguncha tushiring.", "Tirsak tanaga 45° burchakda, kuch bilan itaring."],
    mistakes: ["Bel osilib qoladi", "Tirsaklar yon tomonga 90° ochiladi", "Yarim amplituda"],
  },
  {
    id: "lunge", name: "Hamla (vypad)", muscles: "Son, dumba", equipment: "uy", level: "boshlovchi",
    steps: ["Bir qadam oldinga tashlang.", "Ikkala tizza 90° bo'lguncha pastga tushing.", "Oldingi oyoq tovoniga tayanib qayting."],
    mistakes: ["Oldingi tizza oyoq uchidan juda o'tib ketadi", "Tana oldinga yiqiladi"],
  },
  {
    id: "plank", name: "Planka", muscles: "Qorin, bel", equipment: "uy", level: "boshlovchi",
    steps: ["Tirsaklar yelka ostida.", "Dumba va qorinni siqing, tana to'g'ri chiziq.", "Bir tekis nafas oling."],
    mistakes: ["Dumba yuqoriga ko'tariladi", "Bel pastga osiladi", "Nafasni ushlash"],
  },
  {
    id: "glute_bridge", name: "Dumba ko'prigi (glute bridge)", muscles: "Dumba, son orqasi", equipment: "uy", level: "boshlovchi",
    steps: ["Chalqancha yoting, tizzalar bukilgan.", "Tovonga tayanib, chanoqni yuqoriga ko'taring.", "Yuqorida 1 soniya dumbani siqing."],
    mistakes: ["Belni ortiqcha egish", "Oyoq uchiga tayanish"],
  },
  {
    id: "row_db", name: "Gantel bilan eshkak tortish", muscles: "Orqa, biceps", equipment: "uy", level: "boshlovchi",
    steps: ["Bir qo'l va tizza skameykada, orqa to'g'ri.", "Gantelni belga qarab torting.", "Kurakni siqing, sekin tushiring."],
    mistakes: ["Tana buriladi", "Tirsak emas, bilak bilan tortish"],
  },
  {
    id: "rdl", name: "Rumin tortishi", muscles: "Son orqasi, dumba, bel", equipment: "zal", level: "o'rta",
    steps: ["Gantel yoki shtanga son oldida.", "Tizzani biroz bukib, dumbani orqaga cho'zing; og'irlik oyoq bo'ylab tushadi.", "Son orqasida cho'zilishni sezganda qayting."],
    mistakes: ["Orqa dumaloq bo'ladi", "O'tirib-turishga aylanib ketadi"],
  },
  {
    id: "bench", name: "Shtanga bilan jim (bench press)", muscles: "Ko'krak, triceps, yelka", equipment: "zal", level: "o'rta",
    steps: ["Kuraklar yig'ilgan, oyoqlar polda.", "Shtangani ko'krak pastiga sekin tushiring.", "Tirsaklar 45-70°, yuqoriga itaring."],
    mistakes: ["Shtangani ko'krakdan sakratish", "Dumba skameykadan ko'tariladi", "Strahovkasiz og'ir vazn"],
  },
  {
    id: "pullup", name: "Turnik (podtyagivaniye)", muscles: "Orqa, biceps", equipment: "zal", level: "o'rta",
    steps: ["Qo'llar yelkadan kengroq.", "Kuraklarni pastga tushirib, ko'krakni turnikka torting.", "Sekin to'liq tushing."],
    mistakes: ["Silkinib chiqish", "Yarim amplituda"],
  },
  {
    id: "ohp", name: "Yelkadan yuqoriga itarish", muscles: "Yelka, triceps", equipment: "zal", level: "o'rta",
    steps: ["Gantellar yelka balandligida.", "Qorinni siqib, boshdan yuqoriga itaring.", "Nazorat bilan tushiring."],
    mistakes: ["Belni egish", "Og'irlikni oldinga itarish"],
  },
  {
    id: "leg_press", name: "Oyoq pressi", muscles: "Son, dumba", equipment: "zal", level: "boshlovchi",
    steps: ["Oyoqlar platformada yelka kengligida.", "Tizzani 90° gacha buking.", "Tovon bilan itaring, tizzani qulflamang."],
    mistakes: ["Dumba o'rindiqdan ko'tariladi", "Tizzani to'liq qulflash"],
  },
  {
    id: "walk", name: "Tez yurish", muscles: "Yurak, oyoqlar", equipment: "uy", level: "boshlovchi",
    steps: ["Gaplashish qiyinlashadigan tezlikda yuring.", "Qo'llarni tirsakdan bukib harakatlantiring.", "Kuniga 8-12 ming qadam maqsad qiling."],
    mistakes: ["Faqat hafta oxiri yurish", "Noqulay oyoq kiyim"],
  },
  {
    id: "intervals", name: "Intervalli kardio (HIIT)", muscles: "Yurak, butun tana", equipment: "uy", level: "o'rta",
    steps: ["5 daqiqa qizdiring.", "30 soniya juda tez, 90 soniya sekin, 8-10 marta.", "5 daqiqa sekin yurib tinchlaning."],
    mistakes: ["Har kuni HIIT qilish", "Qizdirishsiz boshlash"],
  },
  {
    id: "stretch", name: "Cho'zilish (stretching)", muscles: "Butun tana", equipment: "uy", level: "boshlovchi",
    steps: ["Mashqdan keyin har mushakni 20-30 soniya cho'zing.", "Og'riq emas, yengil taranglik sezilsin.", "Sakramasdan, bir tekis nafas oling."],
    mistakes: ["Sovuq mushakni cho'zish", "Og'riguncha tortish"],
  },
];
