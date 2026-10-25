// Data rekomendasi pola makan dua bahasa, per kelompok usia dan per kondisi. Saran umum, bukan resep medis.
export const BANDS = [
  {
    max: 182.6,
    id: {
      name: '0–5 bulan',
      freq: 'ASI eksklusif sesuai keinginan bayi, siang dan malam',
      texture: 'Tanpa makanan atau minuman lain, termasuk air putih dan madu',
      menu: [],
    },
    en: {
      name: '0–5 months',
      freq: 'Exclusive breastfeeding on demand, day and night',
      texture: 'No other food or drink, including water and honey',
      menu: [],
    },
  },
  {
    max: 273.9,
    id: {
      name: '6–8 bulan',
      freq: '2–3 kali makan + 1–2 kali selingan, ASI tetap dilanjutkan',
      texture: 'Lumat/saring',
      menu: [
        'Bubur nasi lumat + hati ayam + wortel + 1 sdt minyak',
        'Pisang atau pepaya lumat sebagai selingan',
      ],
    },
    en: {
      name: '6–8 months',
      freq: '2–3 meals + 1–2 snacks, keep breastfeeding',
      texture: 'Mashed/pureed',
      menu: [
        'Mashed rice porridge + chicken liver + carrot + 1 tsp oil',
        'Banana or papaya puree as a snack',
      ],
    },
  },
  {
    max: 365.2,
    id: {
      name: '9–11 bulan',
      freq: '3–4 kali makan + 1–2 kali selingan, ASI tetap dilanjutkan',
      texture: 'Cincang halus dan makanan genggam lunak',
      menu: [
        'Nasi tim ikan + bayam + santan sedikit',
        'Potongan tahu kukus atau pisang sebagai selingan',
      ],
    },
    en: {
      name: '9–11 months',
      freq: '3–4 meals + 1–2 snacks, keep breastfeeding',
      texture: 'Finely chopped and soft finger foods',
      menu: [
        'Steamed rice with fish + spinach + a little coconut milk',
        'Steamed tofu pieces or banana as a snack',
      ],
    },
  },
  {
    max: 730.5,
    id: {
      name: '12–23 bulan',
      freq: '3–4 kali makan + 1–2 kali selingan, ASI sampai usia 2 tahun',
      texture: 'Makanan keluarga, dipotong kecil',
      menu: [
        'Nasi + telur dadar + sayur sop + buah',
        'Bubur kacang hijau atau pisang kukus sebagai selingan',
      ],
    },
    en: {
      name: '12–23 months',
      freq: '3–4 meals + 1–2 snacks, breastfeeding until age 2',
      texture: 'Family foods, cut small',
      menu: [
        'Rice + omelet + vegetable soup + fruit',
        'Mung bean porridge or steamed banana as a snack',
      ],
    },
  },
  {
    max: 1e9,
    id: {
      name: '2–5 tahun',
      freq: '3 kali makan utama + 2 kali selingan',
      texture: 'Makanan keluarga; ajak anak makan bersama',
      menu: [
        'Nasi + ikan goreng/pepes + tempe + tumis kangkung + buah',
        'Selingan: telur rebus, susu, atau buah potong',
      ],
    },
    en: {
      name: '2–5 years',
      freq: '3 main meals + 2 snacks',
      texture: 'Family foods; eat together with your child',
      menu: [
        'Rice + fried or steamed fish + tempeh + stir-fried water spinach + fruit',
        'Snacks: boiled egg, milk, or cut fruit',
      ],
    },
  },
];

export const FOCUS = {
  stunt: {
    id: [
      'Pertumbuhan tinggi di bawah standar: pastikan protein hewani (telur, ikan, ayam, hati ayam) ada di setiap kali makan utama, serta sumber zat besi dan kalsium.',
    ],
    en: [
      'Height growth is below the standard: include animal protein (eggs, fish, chicken, chicken liver) at every main meal, plus sources of iron and calcium.',
    ],
  },
  thin: {
    id: [
      'Berat badan kurang: beri porsi kecil tetapi sering, tambahkan 1–2 sdt minyak atau santan pada makanan, dan jangan membiarkan anak melewatkan selingan.',
    ],
    en: [
      'Weight is low: offer small but frequent portions, add 1–2 tsp of oil or coconut milk to food, and do not let your child skip snacks.',
    ],
  },
  heavy: {
    id: [
      'Berat badan berlebih: batasi minuman manis dan camilan kemasan, ganti dengan air putih dan buah. Jangan menerapkan diet ketat pada anak.',
    ],
    en: [
      'Weight is above the standard: limit sweet drinks and packaged snacks, replace them with water and fruit. Do not put your child on a strict diet.',
    ],
  },
  ok: {
    id: [
      'Pertumbuhan sesuai standar: pertahankan variasi makanan dan jadwal makan teratur.',
    ],
    en: [
      'Growth is within the standard: keep up a varied diet and a regular meal schedule.',
    ],
  },
};
