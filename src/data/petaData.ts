export interface PetaPointOfInterest {
  id: string;
  nama: string;
  kategori: 'sekretariat' | 'pos_ronda' | 'cctv' | 'ibadah' | 'fasum' | 'umkm' | 'kesehatan';
  kategoriLabel: string;
  rt: string; // '039' | '040' | '041' | '042' | 'UMUM'
  alamat: string;
  deskripsi: string;
  penanggungJawab: string;
  kontakPj?: string;
  status: 'Aktif' | 'Siaga' | 'Perbaikan';
  koordinat: {
    lat: number;
    lng: number;
  };
  // Posisi persentase SVG untuk peta visual interaktif (x: 0-100%, y: 0-100%)
  svgPos: {
    x: number;
    y: number;
  };
  iconName: string;
  badgeColor: string;
  isCctvOnline?: boolean;
  cctvIpOrId?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  fps?: number;
  resolution?: string;
  bitrate?: string;
  nightVision?: boolean;
}

export type SimbolBentukType = 
  | 'pin' 
  | 'kotak' 
  | 'segitiga' 
  | 'lingkaran' 
  | 'bintang' 
  | 'kamera' 
  | 'lampu' 
  | 'shield' 
  | 'peringatan' 
  | 'portal' 
  | 'toko' 
  | 'masjid' 
  | 'medis' 
  | 'rumah'
  | 'taman';

export interface CustomPetaMarker {
  id: string;
  nama: string;
  simbolBentuk: SimbolBentukType;
  kategoriLabel: string;
  rt: '039' | '040' | '041' | '042' | 'UMUM';
  warna: string; // hex color code
  keterangan: string;
  penanggungJawab?: string;
  kontak?: string;
  // Posisi presisi di peta SVG (x: 0-1000, y: 0-880)
  svgPos: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CctvRecordingClip {
  id: string;
  judul: string;
  kategori: 'jalan_kampung' | 'perempatan' | 'gang' | 'pos_kamling' | 'depan_sd_fasum';
  kategoriLabel: string;
  waktuRekam: string;
  durasi: string;
  cctvId: string;
  cctvName: string;
  lokasi: string;
  videoUrl: string;
  thumbnail: string;
  deskripsi: string;
  tagKejadian: string;
  ukuranFile?: string;
  resolusi?: string;
}

export interface RtBoundaryData {
  rt: string;
  namaRt: string;
  ketuaRt: string;
  noHp: string;
  jumlahKk: number;
  jumlahWarga: number;
  warnaTema: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
  };
  cakupanWilayah: string;
  batasJalan: {
    utara: string;
    selatan: string;
    barat: string;
    timur: string;
  };
  fasilitasUtama: string[];
  koordinatPusat: {
    lat: number;
    lng: number;
  };
  svgPolygon: string; // SVG path or polygon points
  svgLabelPos: {
    x: number;
    y: number;
  };
}

export const RW018_SPATIAL_PROFILE = {
  namaRw: 'RUKUN WARGA 018',
  sebutan: 'RW 018 Iringmulyo',
  kelurahan: 'Iringmulyo',
  kecamatan: 'Metro Timur',
  kotaKab: 'Kota Metro',
  provinsi: 'Lampung',
  kodePos: '34112',
  koordinatDms: `5°07'41.2"S 105°19'00.4"E`,
  pusatKoordinat: {
    lat: -5.1281111,
    lng: 105.3167778
  },
  titikKumpulUtama: {
    nama: 'Rumah Ketua RW 018',
    placeMark: 'Rumah Ketua RW 018',
    peruntukan: 'Titik Kumpul Utama & Posko Koordinasi Terpadu RW 018',
    dms: `5°07'41.2"S 105°19'00.4"E`,
    lat: -5.1281111,
    lng: 105.3167778,
    alamat: 'Jl. Pala No. 1, Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro Lampung',
    ketuaRw: 'Eko Purwanto S.Kom'
  },
  luasWilayahEstimasi: '18.5 Hektar (0.185 km²)',
  jumlahRt: 4,
  daftarRt: ['039', '040', '041', '042'],
  totalKk: 195,
  totalWarga: 723,
  batasWilayah: {
    utara: 'Palapa III RW 018',
    selatan: 'Sungai Way Perak',
    barat: 'Jl Pala VII RT 13 RW 06',
    timur: 'Jl Raya Jend. Ahmad Yani'
  },
  googleMapsUrl: 'https://maps.google.com/?q=5%C2%B007%2741.2%22S+105%C2%B019%2700.4%22E&z=18',
  googleMapsEmbedUrl: 'https://maps.google.com/maps?q=5%C2%B007%2741.2%22S+105%C2%B019%2700.4%22E&hl=id&z=18&output=embed'
};

export const RT_BOUNDARIES_DATA: RtBoundaryData[] = [
  {
    rt: '039',
    namaRt: 'Rukun Tetangga 039',
    ketuaRt: 'Zaenal Fanani',
    noHp: '0812-7890-0391',
    jumlahKk: 45,
    jumlahWarga: 168,
    warnaTema: {
      primary: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.18)',
      border: '#f87171',
      text: 'text-red-800',
      badgeBg: 'bg-red-100 text-red-800 border-red-300'
    },
    cakupanWilayah: 'Jl. Pala Barat (No. 1 - 28), Gang Manggis, Gang Nangka, Sektor Tenggara Menghadap Jl. Raya Jend. Ahmad Yani & Sungai Way Perak',
    batasJalan: {
      utara: 'Batas Wilayah RT 040 & Jalur Tengah',
      selatan: 'Sungai Way Perak (Batas Selatan RW 018)',
      barat: 'Batas Wilayah RT 041 & Jalur Penghubung Barat',
      timur: 'Jl Raya Jend. Ahmad Yani (Batas Timur RW 018)'
    },
    fasilitasUtama: ['Gardu Pos Ronda RT 039 (Kotak Hitam)', 'Taman Toga Warga', '4 Titik CCTV', 'Warung Sembako Barokah'],
    koordinatPusat: {
      lat: -5.1219,
      lng: 105.3220
    },
    svgPolygon: '428,322 608,322 850,250 850,315 760,340 600,420 528,460 525,550 425,570 428,322',
    svgLabelPos: { x: 560, y: 365 }
  },
  {
    rt: '040',
    namaRt: 'Rukun Tetangga 040',
    ketuaRt: 'Epi',
    noHp: '0813-6655-0402',
    jumlahKk: 52,
    jumlahWarga: 195,
    warnaTema: {
      primary: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.18)',
      border: '#4ade80',
      text: 'text-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    cakupanWilayah: 'Jl. Pala Timur (No. 29 - 65), Gang Rambutan, Area Masjid Baiturrahman, Sektor Timur Laut Menghadap Jl. Raya Jend. Ahmad Yani',
    batasJalan: {
      utara: 'Palapa III RW 018 (Batas Utara RW 018)',
      selatan: 'Batas Wilayah RT 039',
      barat: 'Batas Wilayah RT 042',
      timur: 'Jl Raya Jend. Ahmad Yani (Batas Timur RW 018)'
    },
    fasilitasUtama: ['Masjid Baiturrahman (Segitiga)', 'Gardu Pos Ronda RT 040 (Kotak Hitam)', 'Musholla Al-Ikhlas', '4 Titik CCTV'],
    koordinatPusat: {
      lat: -5.1208,
      lng: 105.3232
    },
    svgPolygon: '428,215 590,160 860,170 850,250 608,322 428,322 428,215',
    svgLabelPos: { x: 630, y: 230 }
  },
  {
    rt: '041',
    namaRt: 'Rukun Tetangga 041',
    ketuaRt: 'Etty Herawati',
    noHp: '0821-8899-0413',
    jumlahKk: 48,
    jumlahWarga: 176,
    warnaTema: {
      primary: '#f97316',
      bg: 'rgba(249, 115, 22, 0.18)',
      border: '#fb923c',
      text: 'text-orange-800',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    cakupanWilayah: 'Jl. Sukun Timur (No. 1 - 42), Gang Salak, Sektor Barat Daya Menghadap Jl. Pala VII & Sungai Way Perak',
    batasJalan: {
      utara: 'Batas Wilayah RT 042',
      selatan: 'Sungai Way Perak (Batas Selatan RW 018)',
      barat: 'Jl Pala VII RT 13 RW 06 (Batas Barat RW 018)',
      timur: 'Batas Wilayah RT 039 & Saluran Irigasi'
    },
    fasilitasUtama: ['Gardu Pos Ronda RT 041 (Kotak Hitam)', 'Musholla Nurul Huda', '4 Titik CCTV', 'Laundry Bersih Kilat'],
    koordinatPusat: {
      lat: -5.1228,
      lng: 105.3214
    },
    svgPolygon: '140,325 315,325 315,390 425,390 425,570 138,715 140,325',
    svgLabelPos: { x: 290, y: 460 }
  },
  {
    rt: '042',
    namaRt: 'Rukun Tetangga 042',
    ketuaRt: 'Sefrizal',
    noHp: '0852-7711-0424',
    jumlahKk: 50,
    jumlahWarga: 184,
    warnaTema: {
      primary: '#eab308',
      bg: 'rgba(234, 179, 8, 0.18)',
      border: '#facc15',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    cakupanWilayah: 'Jl. Duku (No. 1 - 48), Gang Sirsak, Sektor Barat Laut, Balai Warga, Menghadap Palapa III & Jl. Pala VII',
    batasJalan: {
      utara: 'Palapa III RW 018 (Batas Utara RW 018)',
      selatan: 'Batas Wilayah RT 041',
      barat: 'Jl Pala VII RT 13 RW 06 (Batas Barat RW 018)',
      timur: 'Batas Wilayah RT 040'
    },
    fasilitasUtama: ['Gardu Pos Ronda RT 042 (Kotak Hitam)', 'Balai Pertemuan & Posyandu Cempaka 18', 'Lapangan Olahraga RW 018', '4 Titik CCTV'],
    koordinatPusat: {
      lat: -5.1212,
      lng: 105.3206
    },
    svgPolygon: '140,240 428,215 425,390 315,390 315,325 140,325',
    svgLabelPos: { x: 300, y: 275 }
  }
];

export const POI_LIST_DATA: PetaPointOfInterest[] = [
  // 1. Titik Kumpul Utama & Rumah Ketua RW 018 (Place Mark Live Google Maps)
  {
    id: 'poi-titik-kumpul-rw',
    nama: 'Rumah Ketua RW 018 (Titik Kumpul Utama)',
    kategori: 'sekretariat',
    kategoriLabel: 'Place Mark Titik Kumpul RW 018',
    rt: 'UMUM',
    alamat: 'Jl. Pala No. 1, Kel. Iringmulyo, Kec. Metro Timur, Kota Metro Lampung',
    deskripsi: 'Place Mark Titik Kumpul Utama Warga RW 018, Posko Penanganan Bencana / Darurat, dan Kediaman Ketua RW 018 (Eko Purwanto S.Kom).',
    penanggungJawab: 'Eko Purwanto S.Kom (Ketua RW 018)',
    kontakPj: '085383166999',
    status: 'Aktif',
    koordinat: { lat: -5.1281020, lng: 105.3167668 },
    svgPos: { x: 50, y: 50 },
    iconName: 'Building',
    badgeColor: 'bg-emerald-600 text-white'
  },
  {
    id: 'poi-sekretariat',
    nama: 'Kantor Sekretariat RW 018',
    kategori: 'sekretariat',
    kategoriLabel: 'Sekretariat RW',
    rt: 'UMUM',
    alamat: 'Jl. Pala No. 1, RT 039/040, Kel. Iringmulyo',
    deskripsi: 'Pusat pelayanan administrasi kependudukan, pengurusan surat pengantar, rapat musyawarah pengurus, dan arsip digital RW 018.',
    penanggungJawab: 'Eko Purwanto S.Kom (Ketua RW 018)',
    kontakPj: '085383166999',
    status: 'Aktif',
    koordinat: { lat: -5.1281020, lng: 105.3167668 },
    svgPos: { x: 50, y: 50 },
    iconName: 'Building',
    badgeColor: 'bg-emerald-600 text-white'
  },

  // 2. Pos Ronda & Gardu Siskamling (Kotak Hitam di Peta)
  {
    id: 'poi-pos-039',
    nama: 'Gardu Pos Ronda RT 039',
    kategori: 'pos_ronda',
    kategoriLabel: 'Pos Ronda RT 039 (Kotak Hitam)',
    rt: '039',
    alamat: 'Jalur Masuk RT 039 Dekat Batas Selatan',
    deskripsi: 'Gardu jaga siskamling lingkungan warga RT 039 (Simbol Kotak Hitam pada Peta Resmi).',
    penanggungJawab: 'Zaenal Fanani (Ketua RT 039)',
    kontakPj: '0812-7890-0391',
    status: 'Aktif',
    koordinat: { lat: -5.1226, lng: 105.3222 },
    svgPos: { x: 432, y: 540 },
    iconName: 'Shield',
    badgeColor: 'bg-red-700 text-white'
  },
  {
    id: 'poi-pos-040',
    nama: 'Gardu Pos Ronda RT 040',
    kategori: 'pos_ronda',
    kategoriLabel: 'Pos Ronda RT 040 (Kotak Hitam)',
    rt: '040',
    alamat: 'Jl. Pala Timur & Jalur Perbatasan Utara',
    deskripsi: 'Gardu ronda siskamling warga RT 040 jalur timur (Simbol Kotak Hitam pada Peta Resmi).',
    penanggungJawab: 'Epi (Ketua RT 040)',
    kontakPj: '0813-6655-0402',
    status: 'Aktif',
    koordinat: { lat: -5.1205, lng: 105.3240 },
    svgPos: { x: 710, y: 262 },
    iconName: 'Shield',
    badgeColor: 'bg-emerald-700 text-white'
  },
  {
    id: 'poi-pos-041',
    nama: 'Gardu Pos Ronda RT 041',
    kategori: 'pos_ronda',
    kategoriLabel: 'Pos Ronda RT 041 (Kotak Hitam)',
    rt: '041',
    alamat: 'Jl. Sukun Tengah & Sektor Barat Daya',
    deskripsi: 'Pos ronda malam RT 041 perbatasan area barat daya (Simbol Kotak Hitam pada Peta Resmi).',
    penanggungJawab: 'Etty Herawati (Ketua RT 041)',
    kontakPj: '0821-8899-0413',
    status: 'Aktif',
    koordinat: { lat: -5.1230, lng: 105.3216 },
    svgPos: { x: 278, y: 475 },
    iconName: 'Shield',
    badgeColor: 'bg-orange-700 text-white'
  },
  {
    id: 'poi-pos-042',
    nama: 'Gardu Pos Ronda RT 042',
    kategori: 'pos_ronda',
    kategoriLabel: 'Pos Ronda RT 042 (Kotak Hitam)',
    rt: '042',
    alamat: 'Simpang Batas RT 042 & RT 041',
    deskripsi: 'Pos penjagaan malam RT 042 area barat laut (Simbol Kotak Hitam pada Peta Resmi).',
    penanggungJawab: 'Sefrizal (Ketua RT 042)',
    kontakPj: '0852-7711-0424',
    status: 'Aktif',
    koordinat: { lat: -5.1214, lng: 105.3208 },
    svgPos: { x: 320, y: 315 },
    iconName: 'Shield',
    badgeColor: 'bg-amber-600 text-white'
  },

  // 3. Tempat Ibadah (Segitiga di Peta)
  {
    id: 'poi-masjid-baiturrahman',
    nama: 'Masjid Baiturrahman',
    kategori: 'ibadah',
    kategoriLabel: 'Masjid Baiturrahman (Segitiga)',
    rt: '040',
    alamat: 'Area Pusat Wilayah RW 018 (RT 040)',
    deskripsi: 'Masjid utama pelaksanaan Sholat Jumat, pengajian rutin, peringatan hari besar Islam, dan ibadah warga RW 018 (Ditandai dengan Simbol Segitiga △ pada Peta).',
    penanggungJawab: 'Ust. Khaerudin (Ketua DKM & Seksi Keagamaan)',
    kontakPj: '0852-6911-2233',
    status: 'Aktif',
    koordinat: { lat: -5.1210, lng: 105.3225 },
    svgPos: { x: 515, y: 292 },
    iconName: 'Triangle',
    badgeColor: 'bg-emerald-800 text-white'
  },
  {
    id: 'poi-musholla-alikhlas',
    nama: 'Musholla Al-Ikhlas',
    kategori: 'ibadah',
    kategoriLabel: 'Musholla Warga',
    rt: '040',
    alamat: 'Gang Rambutan No. 18, RT 040',
    deskripsi: 'Musholla ibadah harian warga RT 040 dan pengajian anak-anak (TPA).',
    penanggungJawab: 'H. Daryanto',
    kontakPj: '0813-8822-1144',
    status: 'Aktif',
    koordinat: { lat: -5.1211, lng: 105.3228 },
    svgPos: { x: 70, y: 35 },
    iconName: 'Moon',
    badgeColor: 'bg-sky-800 text-white'
  },
  {
    id: 'poi-musholla-nurulhuda',
    nama: 'Musholla Nurul Huda',
    kategori: 'ibadah',
    kategoriLabel: 'Musholla Warga',
    rt: '041',
    alamat: 'Jl. Sukun Timur Gang Salak',
    deskripsi: 'Musholla ibadah warga RT 041 dan kegiatan tadarus.',
    penanggungJawab: 'Ust. Ahmad Dahlan',
    status: 'Aktif',
    koordinat: { lat: -5.1225, lng: 105.3229 },
    svgPos: { x: 68, y: 65 },
    iconName: 'Moon',
    badgeColor: 'bg-amber-800 text-white'
  },

  // 4. Fasilitas Umum & Kesehatan
  {
    id: 'poi-posyandu-cempaka',
    nama: 'Posyandu Cempaka 18 & Balai Warga',
    kategori: 'kesehatan',
    kategoriLabel: 'Posyandu & Balai Pertemuan',
    rt: '042',
    alamat: 'Jl. Duku No. 5, RT 042',
    deskripsi: 'Tempat imunisasi balita bulanan, posbindu lansia, pembagian vitamin, dan balai pertemuan serbaguna warga.',
    penanggungJawab: 'Ibu Bidan Nurlela & Kader Posyandu',
    kontakPj: '0852-6677-8899',
    status: 'Aktif',
    koordinat: { lat: -5.1226, lng: 105.3210 },
    svgPos: { x: 32, y: 65 },
    iconName: 'HeartPulse',
    badgeColor: 'bg-rose-700 text-white'
  },
  {
    id: 'poi-lapangan-fasum',
    nama: 'Lapangan Olahraga & Fasum RW 018',
    kategori: 'fasum',
    kategoriLabel: 'Fasilitas Olahraga & Fasum',
    rt: '042',
    alamat: 'Jl. Duku Belakang Posyandu',
    deskripsi: 'Lapangan bulu tangkis, bola voli, senam sehat jantung tiap Minggu pagi, dan panggung hiburan PHBN 17 Agustus.',
    penanggungJawab: 'Karang Taruna RW 018 (Alan)',
    kontakPj: '0812-3344-5566',
    status: 'Aktif',
    koordinat: { lat: -5.1229, lng: 105.3214 },
    svgPos: { x: 38, y: 82 },
    iconName: 'Activity',
    badgeColor: 'bg-indigo-700 text-white'
  },

  // 5. Sentra UMKM & Usaha Warga
  {
    id: 'poi-umkm-1',
    nama: 'Warung Sembako Barokah Bu Siti',
    kategori: 'umkm',
    kategoriLabel: 'UMKM Sembako & Agen Gas',
    rt: '039',
    alamat: 'Jl. Pala Barat No. 8, RT 039',
    deskripsi: 'Penyedia kebutuhan pokok sembako, beras lokal, telur, dan pangkalan gas LPG warga.',
    penanggungJawab: 'Siti Rahmawati',
    kontakPj: '0812-7890-0391',
    status: 'Aktif',
    koordinat: { lat: -5.1215, lng: 105.3203 },
    svgPos: { x: 16, y: 38 },
    iconName: 'ShoppingBag',
    badgeColor: 'bg-purple-700 text-white'
  },
  {
    id: 'poi-umkm-2',
    nama: 'Bakso & Mie Ayam Mas Joko',
    kategori: 'umkm',
    kategoriLabel: 'UMKM Kuliner',
    rt: '040',
    alamat: 'Jl. Pala Timur No. 34, RT 040',
    deskripsi: 'Kuliner favorit warga RW 018 dengan bakso urat dan mie ayam lezat.',
    penanggungJawab: 'Joko Susilo',
    kontakPj: '0813-6655-0402',
    status: 'Aktif',
    koordinat: { lat: -5.1214, lng: 105.3238 },
    svgPos: { x: 84, y: 38 },
    iconName: 'Utensils',
    badgeColor: 'bg-purple-700 text-white'
  },
  {
    id: 'poi-umkm-3',
    nama: 'Laundry Bersih Kilat',
    kategori: 'umkm',
    kategoriLabel: 'UMKM Jasa Laundry',
    rt: '041',
    alamat: 'Jl. Sukun No. 15, RT 041',
    deskripsi: 'Jasa cuci setrika cepat untuk warga dan mahasiswa sekitar.',
    penanggungJawab: 'Mbak Dewi',
    status: 'Aktif',
    koordinat: { lat: -5.1223, lng: 105.3236 },
    svgPos: { x: 84, y: 68 },
    iconName: 'Sparkles',
    badgeColor: 'bg-purple-700 text-white'
  },

  // 6. Titik-titik Kamera CCTV Lingkungan (16 Titik)
  {
    id: 'poi-cctv-01',
    nama: 'CCTV 01 - Gerbang Masuk Barat Jl. Pala',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 01',
    rt: '039',
    alamat: 'Gerbang Utama Jl. Pala Raya Barat',
    deskripsi: 'Pemantau kendaraan keluar-masuk wilayah barat RW 018.',
    penanggungJawab: 'Seksi Keamanan RW 018',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-01-PALABRT',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-street-in-a-city-43183-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD ColorVu',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1204, lng: 105.3200 },
    svgPos: { x: 10, y: 10 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-02',
    nama: 'CCTV 02 - Pertigaan Kantor RW 018',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 02',
    rt: 'UMUM',
    alamat: 'Depan Kantor Sekretariat RW',
    deskripsi: 'Pantau lalu lintas simpang tengah kantor sekretariat.',
    penanggungJawab: 'Seksi Keamanan RW 018',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-02-SKTRW',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-riding-on-a-city-street-43337-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    fps: 30,
    resolution: '2K QHD IP Camera',
    bitrate: '3072 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1218, lng: 105.3218 },
    svgPos: { x: 50, y: 44 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-03',
    nama: 'CCTV 03 - Gang Manggis (RT 039)',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 03',
    rt: '039',
    alamat: 'Masuk Gang Manggis RT 039',
    deskripsi: 'Pantau pemukiman padat lorong RT 039.',
    penanggungJawab: 'Zaenal Fanani',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-03-MNGGIS',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-suburban-houses-in-a-neighborhood-43184-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD',
    bitrate: '1536 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1208, lng: 105.3205 },
    svgPos: { x: 25, y: 14 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-04',
    nama: 'CCTV 04 - Pos Ronda RT 039',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 04',
    rt: '039',
    alamat: 'Gardu Pos Ronda RT 039',
    deskripsi: 'Pantau aktivitas siskamling dan warga RT 039.',
    penanggungJawab: 'Zaenal Fanani',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-04-POS039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Smart IR',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1207, lng: 105.3202 },
    svgPos: { x: 15, y: 22 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-05',
    nama: 'CCTV 05 - Depan Masjid Al-Muhajirin',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 05',
    rt: '039',
    alamat: 'Halaman Parkir Masjid Al-Muhajirin',
    deskripsi: 'Pantau parkiran jamaah dan keamanan rumah ibadah.',
    penanggungJawab: 'DKM Al-Muhajirin',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-05-MSJD039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-entrance-of-a-building-with-glass-doors-43182-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p PTZ Dome',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1213, lng: 105.3209 },
    svgPos: { x: 36, y: 35 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-06',
    nama: 'CCTV 06 - Gang Rambutan (RT 040)',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 06',
    rt: '040',
    alamat: 'Simpang Gang Rambutan RT 040',
    deskripsi: 'Pantau jalan masuk pemukiman warga RT 040.',
    penanggungJawab: 'Epi',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-06-RMBTAN',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD',
    bitrate: '1536 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1207, lng: 105.3230 },
    svgPos: { x: 65, y: 14 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-07',
    nama: 'CCTV 07 - Depan Musholla Al-Ikhlas',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 07',
    rt: '040',
    alamat: 'Halaman Musholla Al-Ikhlas RT 040',
    deskripsi: 'Pantau kegiatan warga dan kebersihan lingkungan.',
    penanggungJawab: 'Epi',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-07-IKHLAS',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-pedestrian-area-43336-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1210, lng: 105.3230 },
    svgPos: { x: 74, y: 35 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-08',
    nama: 'CCTV 08 - Gerbang Masuk Timur Jl. Pala',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 08',
    rt: '040',
    alamat: 'Ujung Timur Jl. Pala Perbatasan Kampus',
    deskripsi: 'Pantau batas timur wilayah RW 018 ke arah kampus.',
    penanggungJawab: 'Seksi Keamanan RW 018',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-08-PALATMR',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-street-in-a-city-43183-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80',
    fps: 30,
    resolution: '4K Ultra HD AI Cam',
    bitrate: '4096 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1204, lng: 105.3242 },
    svgPos: { x: 90, y: 10 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-09',
    nama: 'CCTV 09 - Simpang Masuk Jl. Sukun (RT 041)',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 09',
    rt: '041',
    alamat: 'Pertigaan Jl. Sukun Tengah',
    deskripsi: 'Pantau persimpangan jalur penghubung RT 041.',
    penanggungJawab: 'Etty Herawati',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-09-SUKUN01',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-riding-on-a-city-street-43337-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p ColorVu',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1220, lng: 105.3230 },
    svgPos: { x: 62, y: 55 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-10',
    nama: 'CCTV 10 - Pos Ronda RT 041 & Gang Salak',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 10',
    rt: '041',
    alamat: 'Gardu Pos Ronda RT 041',
    deskripsi: 'Pantau siskamling dan jalan masuk Gang Salak.',
    penanggungJawab: 'Etty Herawati',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-10-POS041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-corner-43180-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Smart IR',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1230, lng: 105.3236 },
    svgPos: { x: 74, y: 78 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-11',
    nama: 'CCTV 11 - Depan Musholla Nurul Huda',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 11',
    rt: '041',
    alamat: 'Halaman Musholla Nurul Huda RT 041',
    deskripsi: 'Pantau keamanan ibadah dan lingkungan timur.',
    penanggungJawab: 'Etty Herawati',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-11-NURLHUDA',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD',
    bitrate: '1536 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1226, lng: 105.3232 },
    svgPos: { x: 74, y: 65 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-12',
    nama: 'CCTV 12 - Batas Selatan Persawahan RT 041',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 12',
    rt: '041',
    alamat: 'Ujung Selatan Jl. Sukun Batas RW 017',
    deskripsi: 'Pantau perbatasan sawah dan akses jalan belakang.',
    penanggungJawab: 'Seksi Keamanan RW 018',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-12-SAWAH041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunny-day-in-a-quiet-park-43186-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Long Range IR',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1238, lng: 105.3242 },
    svgPos: { x: 90, y: 90 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-13',
    nama: 'CCTV 13 - Balai Warga & Posyandu RT 042',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 13',
    rt: '042',
    alamat: 'Depan Balai Warga Cempaka 18',
    deskripsi: 'Pantau fasilitas gedung pertemuan dan inventaris posyandu.',
    penanggungJawab: 'Sefrizal',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-13-BALAI042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-volunteers-planting-trees-in-a-park-42408-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Full HD',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1225, lng: 105.3212 },
    svgPos: { x: 26, y: 65 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-14',
    nama: 'CCTV 14 - Lapangan Olahraga RW 018',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 14',
    rt: '042',
    alamat: 'Sisi Lapangan Olahraga Fasum',
    deskripsi: 'Pantau kegiatan warga di lapangan dan area terbuka hijau.',
    penanggungJawab: 'Sefrizal & Karang Taruna',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-14-LPNGN042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-empty-basketball-court-in-a-residential-area-43181-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=600&q=80',
    fps: 30,
    resolution: '2K QHD Panoramic PTZ',
    bitrate: '3072 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1228, lng: 105.3215 },
    svgPos: { x: 42, y: 82 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-15',
    nama: 'CCTV 15 - Pos Ronda RT 042 & Gang Sirsak',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 15',
    rt: '042',
    alamat: 'Gardu Pos Ronda RT 042',
    deskripsi: 'Pantau siskamling malam dan lorong Gang Sirsak.',
    penanggungJawab: 'Sefrizal',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-15-POS042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p Smart IR',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1232, lng: 105.3204 },
    svgPos: { x: 15, y: 78 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  },
  {
    id: 'poi-cctv-16',
    nama: 'CCTV 16 - Gerbang Keluar Selatan Jl. Duku',
    kategori: 'cctv',
    kategoriLabel: 'Kamera CCTV 16',
    rt: '042',
    alamat: 'Gerbang Selatan Jl. Duku Batas RW 017',
    deskripsi: 'Pantau perlintasan keluar masuk selatan wilayah RW 018.',
    penanggungJawab: 'Seksi Keamanan RW 018',
    status: 'Aktif',
    isCctvOnline: true,
    cctvIpOrId: 'CAM-16-DUKUSLTN',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    fps: 25,
    resolution: '1080p ColorVu Long Range',
    bitrate: '2048 Kbps',
    nightVision: true,
    koordinat: { lat: -5.1238, lng: 105.3200 },
    svgPos: { x: 10, y: 90 },
    iconName: 'Camera',
    badgeColor: 'bg-cyan-700 text-white'
  }
];

// 1. DATA INFRASTRUKTUR JALAN RW 018
export interface InfrastrukturJalan {
  id: string;
  namaJalan: string;
  rt: string;
  panjangMeter: number;
  lebarMeter: number;
  jenisPermukaan: 'Aspal' | 'Beton Cor' | 'Paving Block' | 'Tanah / Makadam';
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
  tahunPembangunan: number;
  catatanMusrenbang: string;
}

export const DATA_INFRASTRUKTUR_JALAN: InfrastrukturJalan[] = [
  {
    id: 'jln-1',
    namaJalan: 'Jl. Pala Raya (Jalur Utama Barat - Timur)',
    rt: '039 / 040',
    panjangMeter: 650,
    lebarMeter: 4.5,
    jenisPermukaan: 'Aspal',
    kondisi: 'Baik',
    tahunPembangunan: 2023,
    catatanMusrenbang: 'Jalur mobilitas utama warga dan akses ke jalan protokol Kota Metro.'
  },
  {
    id: 'jln-2',
    namaJalan: 'Gang Manggis (RT 039)',
    rt: '039',
    panjangMeter: 180,
    lebarMeter: 3.0,
    jenisPermukaan: 'Beton Cor',
    kondisi: 'Baik',
    tahunPembangunan: 2024,
    catatanMusrenbang: 'Realisasi swadaya dan Pokir Musrenbang tahun 2024.'
  },
  {
    id: 'jln-3',
    namaJalan: 'Gang Rambutan (RT 040)',
    rt: '040',
    panjangMeter: 220,
    lebarMeter: 3.0,
    jenisPermukaan: 'Beton Cor',
    kondisi: 'Rusak Ringan',
    tahunPembangunan: 2021,
    catatanMusrenbang: 'Perlu penambalan beton retak di dekat ujung timur perbatasan kampus.'
  },
  {
    id: 'jln-4',
    namaJalan: 'Jl. Sukun Tengah & Gang Salak (RT 041)',
    rt: '041',
    panjangMeter: 310,
    lebarMeter: 3.5,
    jenisPermukaan: 'Paving Block',
    kondisi: 'Rusak Sedang',
    tahunPembangunan: 2020,
    catatanMusrenbang: 'Diusulkan dalam Musrenbang 2026 untuk pavingisasi ulang dan perataan.'
  },
  {
    id: 'jln-5',
    namaJalan: 'Jl. Duku Barat & Gang Sirsak (RT 042)',
    rt: '042',
    panjangMeter: 290,
    lebarMeter: 3.5,
    jenisPermukaan: 'Beton Cor',
    kondisi: 'Baik',
    tahunPembangunan: 2023,
    catatanMusrenbang: 'Akses penghubung menuju Balai Warga dan Lapangan Olahraga Fasum.'
  }
];

// 2. DATA DRAINASE & GORONG-GORONG
export interface DrainaseData {
  id: string;
  lokasi: string;
  rt: string;
  panjangMeter: number;
  kondisi: 'Lancar' | 'Perlu Pembersihan' | 'Rusak / Tersumbat';
  terakhirDibersihkan: string;
  status: string;
}

export const DATA_DRAINASE: DrainaseData[] = [
  {
    id: 'drn-1',
    lokasi: 'Drainase Utama Sisi Utara Jl. Pala',
    rt: '040',
    panjangMeter: 350,
    kondisi: 'Lancar',
    terakhirDibersihkan: 'Februari 2026',
    status: 'Normal & Terawat'
  },
  {
    id: 'drn-2',
    lokasi: 'Siring Lingkungan Gang Manggis',
    rt: '039',
    panjangMeter: 120,
    kondisi: 'Lancar',
    terakhirDibersihkan: 'Januari 2026',
    status: 'Rutin Kerja Bakti Mingguan'
  },
  {
    id: 'drn-3',
    lokasi: 'Saluran Pembuangan Air Hujan Sukun',
    rt: '041',
    panjangMeter: 190,
    kondisi: 'Perlu Pembersihan',
    terakhirDibersihkan: 'Desember 2025',
    status: 'Perlu Gotong Royong / Pembersihan Sedimen'
  },
  {
    id: 'drn-4',
    lokasi: 'Gorong-gorong Simpang Jl. Duku',
    rt: '042',
    panjangMeter: 80,
    kondisi: 'Lancar',
    terakhirDibersihkan: 'Januari 2026',
    status: 'Telah dipasang kisi penyaring sampah'
  }
];

// 3. DATA LAMPU PENERANGAN JALAN UMUM (PJU)
export interface PjuData {
  id: string;
  nomorTiang: string;
  lokasi: string;
  rt: string;
  jenisLampu: 'LED Hemat Energi 50W' | 'Solar Cell 40W' | 'Lampu Merkuri 80W';
  kondisi: 'Menyala' | 'Redup' | 'Mati' | 'Perlu Tiang Baru';
  tanggalPengecekan: string;
}

export const DATA_PJU: PjuData[] = [
  { id: 'pju-01', nomorTiang: 'PJU-RW18-01', lokasi: 'Gerbang Masuk Barat Jl. Pala', rt: '039', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '15 Feb 2026' },
  { id: 'pju-02', nomorTiang: 'PJU-RW18-02', lokasi: 'Depan Gardu Pos Ronda RT 039', rt: '039', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '15 Feb 2026' },
  { id: 'pju-03', nomorTiang: 'PJU-RW18-03', lokasi: 'Simpang Gang Manggis Tengah', rt: '039', jenisLampu: 'Solar Cell 40W', kondisi: 'Redup', tanggalPengecekan: '10 Feb 2026' },
  { id: 'pju-04', nomorTiang: 'PJU-RW18-04', lokasi: 'Depan Masjid Baiturrahman', rt: '040', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '20 Feb 2026' },
  { id: 'pju-05', nomorTiang: 'PJU-RW18-05', lokasi: 'Gardu Pos Ronda RT 040 & Rambutan', rt: '040', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '20 Feb 2026' },
  { id: 'pju-06', nomorTiang: 'PJU-RW18-06', lokasi: 'Ujung Timur Jl. Pala Perbatasan', rt: '040', jenisLampu: 'Solar Cell 40W', kondisi: 'Menyala', tanggalPengecekan: '18 Feb 2026' },
  { id: 'pju-07', nomorTiang: 'PJU-RW18-07', lokasi: 'Gardu Pos Ronda RT 041', rt: '041', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '22 Feb 2026' },
  { id: 'pju-08', nomorTiang: 'PJU-RW18-08', lokasi: 'Gang Salak Jalur Belakang', rt: '041', jenisLampu: 'Lampu Merkuri 80W', kondisi: 'Mati', tanggalPengecekan: '22 Feb 2026' },
  { id: 'pju-09', nomorTiang: 'PJU-RW18-09', lokasi: 'Batas Selatan Persawahan RT 041', rt: '041', jenisLampu: 'Solar Cell 40W', kondisi: 'Menyala', tanggalPengecekan: '22 Feb 2026' },
  { id: 'pju-10', nomorTiang: 'PJU-RW18-10', lokasi: 'Gardu Pos Ronda RT 042 & Sudut Barat', rt: '042', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '19 Feb 2026' },
  { id: 'pju-11', nomorTiang: 'PJU-RW18-11', lokasi: 'Halaman Balai Warga & Posyandu RT 042', rt: '042', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '19 Feb 2026' },
  { id: 'pju-12', nomorTiang: 'PJU-RW18-12', lokasi: 'Area Lapangan Olahraga Fasum', rt: '042', jenisLampu: 'LED Hemat Energi 50W', kondisi: 'Menyala', tanggalPengecekan: '19 Feb 2026' }
];

// 4. DATA TITIK RUMAH WARGA DI PETA
export interface TitikRumahWarga {
  id: string;
  noRumah: string;
  namaKepalaKeluarga: string;
  alamat: string;
  rt: string;
  jumlahAnggota: number;
  statusRumah: 'Milik Sendiri' | 'Kontrak / Sewa' | 'Menumpang / Keluarga';
  kategori: string[];
  svgPos: { x: number; y: number };
}

export const DATA_TITIK_RUMAH: TitikRumahWarga[] = [
  // RT 039
  { id: 'rmh-39-1', noRumah: '01', namaKepalaKeluarga: 'Zaenal Fanani', alamat: 'Jl. Pala Barat No. 01', rt: '039', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Ketua RT', 'Usia Produktif'], svgPos: { x: 460, y: 345 } },
  { id: 'rmh-39-2', noRumah: '05', namaKepalaKeluarga: 'Budi Santoso', alamat: 'Jl. Pala Barat No. 05', rt: '039', jumlahAnggota: 5, statusRumah: 'Milik Sendiri', kategori: ['Balita', 'BPJS PBI', 'Penerima Bansos PKH'], svgPos: { x: 490, y: 380 } },
  { id: 'rmh-39-3', noRumah: '12', namaKepalaKeluarga: 'Siti Rahmawati', alamat: 'Gang Manggis No. 12', rt: '039', jumlahAnggota: 3, statusRumah: 'Milik Sendiri', kategori: ['UMKM Sembako', 'Lansia'], svgPos: { x: 530, y: 410 } },
  { id: 'rmh-39-4', noRumah: '18', namaKepalaKeluarga: 'Agus Triono', alamat: 'Gang Manggis No. 18', rt: '039', jumlahAnggota: 4, statusRumah: 'Kontrak / Sewa', kategori: ['Pelajar', 'Usia Produktif'], svgPos: { x: 570, y: 385 } },
  { id: 'rmh-39-5', noRumah: '25', namaKepalaKeluarga: 'Mbah Karyo', alamat: 'Jl. Pala Sektor Selatan No. 25', rt: '039', jumlahAnggota: 2, statusRumah: 'Milik Sendiri', kategori: ['Lansia Rentan', 'Bansos BPNT'], svgPos: { x: 480, y: 480 } },

  // RT 040
  { id: 'rmh-40-1', noRumah: '02', namaKepalaKeluarga: 'Epi', alamat: 'Jl. Pala Timur No. 02', rt: '040', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Ketua RT', 'Usia Produktif'], svgPos: { x: 490, y: 240 } },
  { id: 'rmh-40-2', noRumah: '08', namaKepalaKeluarga: 'Ust. Khaerudin', alamat: 'Kavling Baiturrahman No. 08', rt: '040', jumlahAnggota: 5, statusRumah: 'Milik Sendiri', kategori: ['Seksi Keagamaan', 'DKM Baiturrahman'], svgPos: { x: 535, y: 265 } },
  { id: 'rmh-40-3', noRumah: '15', namaKepalaKeluarga: 'H. Daryanto', alamat: 'Gang Rambutan No. 15', rt: '040', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Tokoh Masyarakat', 'Lansia Sehat'], svgPos: { x: 620, y: 215 } },
  { id: 'rmh-40-4', noRumah: '24', namaKepalaKeluarga: 'Joko Susilo', alamat: 'Jl. Pala Timur No. 24', rt: '040', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['UMKM Kuliner', 'Balita'], svgPos: { x: 740, y: 210 } },
  { id: 'rmh-40-5', noRumah: '38', namaKepalaKeluarga: 'Suparman', alamat: 'Jl. Pala Ujung Timur No. 38', rt: '040', jumlahAnggota: 3, statusRumah: 'Kontrak / Sewa', kategori: ['Penerima BLT', 'Pelajar'], svgPos: { x: 810, y: 225 } },

  // RT 041
  { id: 'rmh-41-1', noRumah: '03', namaKepalaKeluarga: 'Etty Herawati', alamat: 'Jl. Sukun Tengah No. 03', rt: '041', jumlahAnggota: 3, statusRumah: 'Milik Sendiri', kategori: ['Ketua RT', 'Usia Produktif'], svgPos: { x: 250, y: 410 } },
  { id: 'rmh-41-2', noRumah: '09', namaKepalaKeluarga: 'Bambang Irawan', alamat: 'Gang Salak No. 09', rt: '041', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Balita', 'Penerima PKH'], svgPos: { x: 210, y: 480 } },
  { id: 'rmh-41-3', noRumah: '16', namaKepalaKeluarga: 'Dewi Anggraini', alamat: 'Jl. Sukun No. 16', rt: '041', jumlahAnggota: 3, statusRumah: 'Milik Sendiri', kategori: ['UMKM Laundry', 'Usia Produktif'], svgPos: { x: 330, y: 470 } },
  { id: 'rmh-41-4', noRumah: '22', namaKepalaKeluarga: 'Pak Warno', alamat: 'Sektor Selatan Barat Daya No. 22', rt: '041', jumlahAnggota: 2, statusRumah: 'Milik Sendiri', kategori: ['Lansia', 'Bansos PBI'], svgPos: { x: 220, y: 570 } },
  { id: 'rmh-41-5', noRumah: '35', namaKepalaKeluarga: 'Herman Susanto', alamat: 'Batas Sawah Sukun No. 35', rt: '041', jumlahAnggota: 5, statusRumah: 'Kontrak / Sewa', kategori: ['Pelajar', 'Disabilitas'], svgPos: { x: 310, y: 530 } },

  // RT 042
  { id: 'rmh-42-1', noRumah: '04', namaKepalaKeluarga: 'Sefrizal', alamat: 'Jl. Duku No. 04', rt: '042', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Ketua RT', 'Usia Produktif'], svgPos: { x: 210, y: 280 } },
  { id: 'rmh-42-2', noRumah: '10', namaKepalaKeluarga: 'Arif R Budiman', alamat: 'Jl. Duku Barat No. 10', rt: '042', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Seksi Kebersihan', 'Usia Produktif'], svgPos: { x: 280, y: 260 } },
  { id: 'rmh-42-3', noRumah: '17', namaKepalaKeluarga: 'Ibu Bidan Nurlela', alamat: 'Depan Balai Warga No. 17', rt: '042', jumlahAnggota: 3, statusRumah: 'Milik Sendiri', kategori: ['Kader Posyandu', 'Kesehatan'], svgPos: { x: 360, y: 270 } },
  { id: 'rmh-42-4', noRumah: '26', namaKepalaKeluarga: 'Alan Karang Taruna', alamat: 'Dekat Lapangan Olahraga No. 26', rt: '042', jumlahAnggota: 4, statusRumah: 'Milik Sendiri', kategori: ['Pemuda Karang Taruna', 'Pelajar'], svgPos: { x: 370, y: 345 } },
  { id: 'rmh-42-5', noRumah: '33', namaKepalaKeluarga: 'Mbah Sastro', alamat: 'Gang Sirsak Barat No. 33', rt: '042', jumlahAnggota: 2, statusRumah: 'Milik Sendiri', kategori: ['Lansia', 'Bansos PKH Lansia'], svgPos: { x: 180, y: 300 } }
];

// 5. DATA PROGRAM PEMBANGUNAN RW (MUSRENBANG & SWADAYA)
export interface ProgramPembangunan {
  id: string;
  namaProgram: string;
  lokasiRt: string;
  sumberDana: 'Musrenbang / APBD Kota' | 'Dana Swadaya Warga' | 'Pokir Dewan' | 'CSR & Donatur';
  status: 'Selesai' | 'Sedang Dikerjakan' | 'Usulan Prioritas 2026' | 'Belum Terealisasi';
  anggaranEstimasi: string;
  progressPercent: number;
}

export const DATA_PROGRAM_PEMBANGUNAN: ProgramPembangunan[] = [
  { id: 'prog-1', namaProgram: 'Pengecoran Beton Jalan Gang Manggis', lokasiRt: 'RT 039', sumberDana: 'Pokir Dewan', status: 'Selesai', anggaranEstimasi: 'Rp 45.000.000', progressPercent: 100 },
  { id: 'prog-2', namaProgram: 'Pemasangan PJU Solar Cell & LED Perbatasan', lokasiRt: 'RT 040 & RT 041', sumberDana: 'Dana Swadaya Warga', status: 'Sedang Dikerjakan', anggaranEstimasi: 'Rp 18.500.000', progressPercent: 65 },
  { id: 'prog-3', namaProgram: 'Normalisasi Drainase Saluran Air Hujan Sukun', lokasiRt: 'RT 041', sumberDana: 'Musrenbang / APBD Kota', status: 'Usulan Prioritas 2026', anggaranEstimasi: 'Rp 65.000.000', progressPercent: 15 },
  { id: 'prog-4', namaProgram: 'Renovasi Posyandu Cempaka 18 & Balai Warga', lokasiRt: 'RT 042', sumberDana: 'Dana Swadaya Warga', status: 'Selesai', anggaranEstimasi: 'Rp 28.000.000', progressPercent: 100 }
];

// 6. DATA CUPLIKAN REKAMAN CCTV (PLAYBACK & FOOTAGE ARSIP REALISTIS SESUAI JALAN KAMPUNG, PEREMPATAN, GANG & POS KAMLING)
export const DATA_CUPLIKAN_REKAMAN_CCTV: CctvRecordingClip[] = [
  // A. KATEGORI JALAN KAMPUNG (Jalan Aspal Pemukiman, Lingkungan Warga, Batas Kecepatan Kampung)
  {
    id: 'clip-jalan-01',
    judul: 'Suasana Jalan Aspal Kampung Pemukiman Warga (RT 039)',
    kategori: 'jalan_kampung',
    kategoriLabel: 'Jalan Kampung',
    waktuRekam: 'Hari ini, 07:15 WIB',
    durasi: '00:45',
    cctvId: 'poi-cctv-01',
    cctvName: 'CAM-01 Gerbang Masuk Barat (RT 039)',
    lokasi: 'Jl. Pala Barat Jalur Utama Pemukiman RT 039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Rekaman pantauan suasana jalan aspal kampung pemukiman warga RT 039 saat warga beraktivitas pagi, anak-anak berangkat sekolah, dan pesepeda melintas tenang.',
    tagKejadian: 'Aktivitas Jalan Pagi',
    ukuranFile: '14.2 MB',
    resolusi: '1080p FHD'
  },
  {
    id: 'clip-jalan-02',
    judul: 'Suasana Pemukiman & Rumah Warga di Jl. Pala Timur (RT 040)',
    kategori: 'jalan_kampung',
    kategoriLabel: 'Jalan Kampung',
    waktuRekam: 'Kemarin, 16:30 WIB',
    durasi: '01:10',
    cctvId: 'poi-cctv-06',
    cctvName: 'CAM-06 Jl. Pala Timur (RT 040)',
    lokasi: 'Jalan Pemukiman Timur Depan Rumah Warga RT 040',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan rekaman jalan lingkungan pemukiman asri deretan rumah warga RT 040 saat sore hari, kendaraan melintas pelan dan tertib.',
    tagKejadian: 'Pemantauan Sore Jalan',
    ukuranFile: '18.6 MB',
    resolusi: '1080p FHD'
  },
  {
    id: 'clip-jalan-03',
    judul: 'Pantauan Ketertiban Jalan Lingkungan & Batas Kecepatan (RT 041)',
    kategori: 'jalan_kampung',
    kategoriLabel: 'Jalan Kampung',
    waktuRekam: 'Hari ini, 15:45 WIB',
    durasi: '00:55',
    cctvId: 'poi-cctv-11',
    cctvName: 'CAM-11 Jl. Sukun Depan Musholla (RT 041)',
    lokasi: 'Jalan Pemukiman Sukun Tengah RT 041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan ketertiban jalan kampung pemukiman warga saat sepeda motor melintas dengan kecepatan rendah sesuai aturan batas kecepatan kampung maks 20 km/jam.',
    tagKejadian: 'Ketertiban Jalan Kampung',
    ukuranFile: '16.4 MB',
    resolusi: '1080p FHD'
  },
  {
    id: 'clip-jalan-04',
    judul: 'Kondusifitas Jalan Kampung Asri Duku Selatan (RT 042)',
    kategori: 'jalan_kampung',
    kategoriLabel: 'Jalan Kampung',
    waktuRekam: 'Hari ini, 10:20 WIB',
    durasi: '00:40',
    cctvId: 'poi-cctv-16',
    cctvName: 'CAM-16 Jl. Duku Selatan (RT 042)',
    lokasi: 'Jl. Duku Selatan Sektor RT 042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunny-day-in-a-quiet-park-43186-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan situasi jalan aspal kampung pemukiman bagian selatan RT 042 yang rindang pepohonan, bersih, dan aman pada siang hari.',
    tagKejadian: 'Kondusifitas Siang Kampung',
    ukuranFile: '12.8 MB',
    resolusi: '1080p ColorVu'
  },

  // B. KATEGORI PEREMPATAN JALAN & PERSIMPANGAN LINGKUNGAN
  {
    id: 'clip-perempatan-01',
    judul: 'Lalu Lintas Perempatan Gerbang Masuk Jl. Pala Raya Barat',
    kategori: 'perempatan',
    kategoriLabel: 'Perempatan Jalan',
    waktuRekam: 'Hari ini, 06:45 WIB',
    durasi: '01:20',
    cctvId: 'poi-cctv-01',
    cctvName: 'CAM-01 Gerbang Utama Barat (RT 039)',
    lokasi: 'Perempatan Simpang Barat Gerbang Masuk RW 018',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-street-in-a-city-43183-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Arus kendaraan keluar-masuk perempatan gerbang barat RW 018, mencatat lalu lintas roda dua dan kendaraan warga yang berbelok tertib di persimpangan jalan.',
    tagKejadian: 'Simpang Perempatan Masuk',
    ukuranFile: '22.1 MB',
    resolusi: '1080p ColorVu'
  },
  {
    id: 'clip-perempatan-02',
    judul: 'Perempatan Sentral Depan Balai Kantor RW 018',
    kategori: 'perempatan',
    kategoriLabel: 'Perempatan Jalan',
    waktuRekam: 'Kemarin, 17:30 WIB',
    durasi: '01:05',
    cctvId: 'poi-cctv-02',
    cctvName: 'CAM-02 Pertigaan Kantor RW (Pusat)',
    lokasi: 'Perempatan Sentral Penghubung 4 RT Depan Balai RW 018',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-riding-on-a-city-street-43337-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pemantauan persimpangan empat sentral kantor RW 018 yang menghubungkan akses RT 039, RT 040, RT 041, dan RT 042, dengan sepeda dan pejalan kaki menyeberang aman.',
    tagKejadian: 'Simpang Perempatan Sentral',
    ukuranFile: '20.5 MB',
    resolusi: '2K QHD'
  },
  {
    id: 'clip-perempatan-03',
    judul: 'Perempatan Persimpangan Jl. Sukun Tengah & Akses Antar RT',
    kategori: 'perempatan',
    kategoriLabel: 'Perempatan Jalan',
    waktuRekam: 'Hari ini, 08:30 WIB',
    durasi: '00:50',
    cctvId: 'poi-cctv-09',
    cctvName: 'CAM-09 Simpang Sukun (RT 041)',
    lokasi: 'Perempatan Simpang Tengah Jl. Sukun RT 041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-riding-on-a-city-street-43337-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan pesepeda, warga jalan kaki, dan motor berbelok di perempatan simpang empat jalan utama pemukiman penghubung RT 041 dan RT 042.',
    tagKejadian: 'Perempatan Simpang Empat',
    ukuranFile: '15.3 MB',
    resolusi: '1080p ColorVu'
  },
  {
    id: 'clip-perempatan-04',
    judul: 'Perempatan Akses Batas Wilayah Timur Menuju Kampus',
    kategori: 'perempatan',
    kategoriLabel: 'Perempatan Jalan',
    waktuRekam: 'Hari ini, 11:15 WIB',
    durasi: '01:00',
    cctvId: 'poi-cctv-08',
    cctvName: 'CAM-08 Gerbang Timur (RT 040)',
    lokasi: 'Perempatan Batas Timur Jl. Pala - Arah Kampus',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-street-in-a-city-43183-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan kendaraan warga dan mahasiswa tamu yang melintas di perempatan perbatasan akses timur menuju kawasan kampus.',
    tagKejadian: 'Perempatan Batas Wilayah',
    ukuranFile: '19.8 MB',
    resolusi: '4K Ultra HD'
  },
  {
    id: 'clip-perempatan-05',
    judul: 'Sudut CCTV Perempatan Simpang Lapangan & Posyandu RT 042',
    kategori: 'perempatan',
    kategoriLabel: 'Perempatan Jalan',
    waktuRekam: 'Kemarin, 14:20 WIB',
    durasi: '00:50',
    cctvId: 'poi-cctv-13',
    cctvName: 'CAM-13 Simpang Balai & Lapangan (RT 042)',
    lokasi: 'Simpang Perempatan Depan Lapangan Olahraga RW 018',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-corner-43180-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan sudut pengawas CCTV terhadap kendaraan yang berbelok di persimpangan perempatan jalan akses fasilitas olahraga dan balai warga.',
    tagKejadian: 'Perempatan Simpang Fasum',
    ukuranFile: '15.9 MB',
    resolusi: '1080p FHD'
  },

  // C. KATEGORI GANG PEMUKIMAN & LORONG WARGA (Gang Manggis, Gang Rambutan, Gang Salak, Gang Sirsak, Gang Nangka)
  {
    id: 'clip-gang-01',
    judul: 'Suasana Pagi di Lorong Gang Manggis & Deretan Rumah Warga (RT 039)',
    kategori: 'gang',
    kategoriLabel: 'Gang Pemukiman',
    waktuRekam: 'Hari ini, 07:30 WIB',
    durasi: '00:50',
    cctvId: 'poi-cctv-03',
    cctvName: 'CAM-03 Gang Manggis (RT 039)',
    lokasi: 'Lorong Masuk Gang Manggis RT 039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-suburban-houses-in-a-neighborhood-43184-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan rekaman lorong gang pemukiman warga di Gang Manggis dengan suasana tenang deretan rumah dan pekarangan warga.',
    tagKejadian: 'Suasana Gang Pagi',
    ukuranFile: '15.6 MB',
    resolusi: '1080p FHD'
  },
  {
    id: 'clip-gang-02',
    judul: 'Lorong Pemukiman Asri Rumah Warga Gang Rambutan (RT 040)',
    kategori: 'gang',
    kategoriLabel: 'Gang Pemukiman',
    waktuRekam: 'Kemarin, 16:15 WIB',
    durasi: '01:05',
    cctvId: 'poi-cctv-06',
    cctvName: 'CAM-06 Gang Rambutan (RT 040)',
    lokasi: 'Jalur Tengah Gang Rambutan RT 040',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan lorong gang pemukiman yang bersih dan sejuk, anak-anak bermain sepeda santai di depan teras rumah tetangga.',
    tagKejadian: 'Aktivitas Gang Sore',
    ukuranFile: '17.4 MB',
    resolusi: '1080p FHD'
  },
  {
    id: 'clip-gang-03',
    judul: 'Lorong Ramah Pejalan Kaki & Pesepeda Gang Salak (RT 041)',
    kategori: 'gang',
    kategoriLabel: 'Gang Pemukiman',
    waktuRekam: 'Hari ini, 09:10 WIB',
    durasi: '00:45',
    cctvId: 'poi-cctv-10',
    cctvName: 'CAM-10 Gang Salak & Pos Ronda (RT 041)',
    lokasi: 'Lorong Gang Salak Dekat Musholla RT 041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-suburban-houses-in-a-neighborhood-43184-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan lorong gang paving block yang asri, warga bertegur sapa di gang dengan akses ramah lansia dan anak-anak.',
    tagKejadian: 'Lorong Warga Ramah',
    ukuranFile: '13.8 MB',
    resolusi: '1080p Smart IR'
  },
  {
    id: 'clip-gang-04',
    judul: 'Lorong Pemukiman Gang Sirsak Menuju Balai Warga (RT 042)',
    kategori: 'gang',
    kategoriLabel: 'Gang Pemukiman',
    waktuRekam: 'Hari ini, 14:00 WIB',
    durasi: '00:50',
    cctvId: 'poi-cctv-15',
    cctvName: 'CAM-15 Pos Ronda & Gang Sirsak (RT 042)',
    lokasi: 'Akses Masuk Gang Sirsak RT 042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan lorong gang pemukiman Gang Sirsak yang menghubungkan perumahan warga ke fasilitas pos ronda dan balai RW.',
    tagKejadian: 'Lorong Gang Sirsak',
    ukuranFile: '16.0 MB',
    resolusi: '1080p Smart IR'
  },
  {
    id: 'clip-gang-05',
    judul: 'Pejalan Kaki & Warga Melintas di Lorong Gang Nangka (RT 039)',
    kategori: 'gang',
    kategoriLabel: 'Gang Pemukiman',
    waktuRekam: 'Kemarin, 11:00 WIB',
    durasi: '01:00',
    cctvId: 'poi-cctv-03',
    cctvName: 'CAM-03 Gang Manggis & Nangka (RT 039)',
    lokasi: 'Lorong Tengah Gang Nangka RT 039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-pedestrian-area-43336-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pantauan patroli kebersihan selokan gang dan warga yang melintas berjalan kaki menuju warung sembako warga.',
    tagKejadian: 'Pejalan Kaki Gang',
    ukuranFile: '17.1 MB',
    resolusi: '1080p FHD'
  },

  // D. KATEGORI DEPAN GARDU POS KAMLING (SISKAMLING & PORTAL JALAN)
  {
    id: 'clip-pos-01',
    judul: 'Patroli Siskamling Malam di Depan Gardu Pos Kamling RT 039',
    kategori: 'pos_kamling',
    kategoriLabel: 'Depan Gardu Pos Kamling',
    waktuRekam: 'Dini Hari tadi, 01:45 WIB',
    durasi: '01:30',
    cctvId: 'poi-cctv-04',
    cctvName: 'CAM-04 Pos Ronda Siskamling (RT 039)',
    lokasi: 'Gardu Pos Kamling Utama RT 039',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-corner-43180-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Rekaman infra-merah (Night Vision Smart IR) petugas ronda malam siskamling mengecek portal masuk dan berkeliling gang kampung.',
    tagKejadian: 'Ronda Malam Siskamling',
    ukuranFile: '24.0 MB',
    resolusi: '1080p Smart IR'
  },
  {
    id: 'clip-pos-02',
    judul: 'Aktivitas Jaga & Koordinasi di Pos Kamling RT 041',
    kategori: 'pos_kamling',
    kategoriLabel: 'Depan Gardu Pos Kamling',
    waktuRekam: 'Kemarin Malam, 22:15 WIB',
    durasi: '00:55',
    cctvId: 'poi-cctv-10',
    cctvName: 'CAM-10 Pos Ronda RT 041 & Gang Salak',
    lokasi: 'Gardu Pos Kamling Sektor RT 041',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-a-residential-street-with-houses-and-cars-43185-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan kumpul regu ronda malam RT 041 dalam memeriksa kelengkapan HT, senter, dan tongkat satpam sebelum patroli lorong.',
    tagKejadian: 'Serah Terima Jaga Pos',
    ukuranFile: '17.2 MB',
    resolusi: '1080p Smart IR'
  },
  {
    id: 'clip-pos-03',
    judul: 'Pemeriksaan Portal & Kendaraan Tamu Pos Kamling RT 042',
    kategori: 'pos_kamling',
    kategoriLabel: 'Depan Gardu Pos Kamling',
    waktuRekam: 'Kemarin Malam, 23:50 WIB',
    durasi: '01:15',
    cctvId: 'poi-cctv-15',
    cctvName: 'CAM-15 Pos Kamling Jl. Duku (RT 042)',
    lokasi: 'Gardu Ronda Jl. Duku RT 042',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-corner-43180-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Pemeriksaan identitas tamu dan penutupan palang pintu portal siskamling RT 042 menjelang tengah malam demi keamanan warga.',
    tagKejadian: 'Pemeriksaan Portal Malam',
    ukuranFile: '21.5 MB',
    resolusi: '1080p ColorVu'
  },

  // E. KATEGORI DI DEPAN SD / SEKOLAH & FASUM WARGA
  {
    id: 'clip-sd-01',
    judul: 'Pantauan Jam Masuk Siswa di Depan SD & Fasum Pendidikan',
    kategori: 'depan_sd_fasum',
    kategoriLabel: 'Depan SD & Fasum',
    waktuRekam: 'Hari ini, 06:50 WIB',
    durasi: '01:05',
    cctvId: 'poi-cctv-sd01',
    cctvName: 'CAM-SD Gerbang Depan SD & Fasum Edukasi',
    lokasi: 'Depan Gerbang SDN & Fasilitas Pendidikan',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-pedestrian-area-43336-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Cuplikan rekaman anak-anak sekolah didampingi orang tua dan warga menyeberang jalan aman saat jam masuk sekolah pagi.',
    tagKejadian: 'Jam Sekolah Pagi',
    ukuranFile: '18.9 MB',
    resolusi: '1080p Full HD'
  },
  {
    id: 'clip-sd-02',
    judul: 'Kegiatan Posyandu & Pertemuan Warga di Balai RW Cempaka 18',
    kategori: 'depan_sd_fasum',
    kategoriLabel: 'Depan SD & Fasum',
    waktuRekam: 'Kemarin, 09:30 WIB',
    durasi: '00:50',
    cctvId: 'poi-cctv-13',
    cctvName: 'CAM-13 Balai Warga & Posyandu (RT 042)',
    lokasi: 'Halaman Depan Gedung Balai Warga Cempaka 18',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-volunteers-planting-trees-in-a-park-42408-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Kedatangan ibu-ibu dan balita menghadiri kegiatan penimbangan rutin Posyandu di halaman gedung balai warga.',
    tagKejadian: 'Pelayanan Posyandu',
    ukuranFile: '14.7 MB',
    resolusi: '1080p Full HD'
  },
  {
    id: 'clip-sd-03',
    judul: 'Aktivitas Pemuda & Olahraga di Lapangan Serbaguna RW 018',
    kategori: 'depan_sd_fasum',
    kategoriLabel: 'Depan SD & Fasum',
    waktuRekam: 'Kemarin Sore, 16:45 WIB',
    durasi: '01:15',
    cctvId: 'poi-cctv-14',
    cctvName: 'CAM-14 Lapangan Olahraga RW 018 (RT 042)',
    lokasi: 'Area Terbuka Hijau & Lapangan Serbaguna',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-empty-basketball-court-in-a-residential-area-43181-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Kegiatan olahraga santai bola voli dan bulu tangkis anak-anak dan pemuda karang taruna di lapangan fasum RW 018.',
    tagKejadian: 'Olahraga Sore Warga',
    ukuranFile: '21.0 MB',
    resolusi: '1080p 30 FPS'
  },
  {
    id: 'clip-sd-04',
    judul: 'Gotong Royong Kebersihan Lingkungan Depan Fasum RW 018',
    kategori: 'depan_sd_fasum',
    kategoriLabel: 'Depan SD & Fasum',
    waktuRekam: 'Minggu Pagi, 07:30 WIB',
    durasi: '01:25',
    cctvId: 'poi-cctv-11',
    cctvName: 'CAM-11 Area Musholla & Fasum RT 041',
    lokasi: 'Halaman Terbuka Fasum Lingkungan & Masjid',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-volunteers-planting-trees-in-a-park-42408-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80',
    deskripsi: 'Warga bersama-sama merapikan tanaman, membersihkan saluran drainase, dan memangkas dahan di sekitar fasilitas umum.',
    tagKejadian: 'Gotong Royong Warga',
    ukuranFile: '23.8 MB',
    resolusi: '1080p FHD'
  }
];

// STORAGE & LOCAL STATE PERSISTENCE HELPERS
const PETA_STORAGE_KEYS = {
  POIS: 'rw018_peta_pois_v4',
  JALAN: 'rw018_peta_infrastruktur_jalan_v2',
  PJU: 'rw018_peta_pju_v2',
  DRAINASE: 'rw018_peta_drainase_v2',
  CUPLIKAN: 'rw018_peta_cuplikan_cctv_v4',
  CUSTOM_MARKERS: 'rw018_peta_custom_markers_v1'
};

// INITIAL DEFAULT CUSTOM MARKERS (Simbol Tanda Peta Satelit Interaktif)
export const DEFAULT_CUSTOM_MARKERS: CustomPetaMarker[] = [
  {
    id: 'marker-pos-039',
    nama: 'Gardu Pos Ronda Siskamling RT 039',
    simbolBentuk: 'kotak',
    kategoriLabel: 'Pos Ronda / Keamanan',
    rt: '039',
    warna: '#000000',
    keterangan: 'Gardu pos kamling aktif siskamling malam RT 039 dengan portal pengamanan.',
    penanggungJawab: 'Bpk. Zaenal Fanani (Ketua RT 039)',
    kontak: '0812-7890-0391',
    svgPos: { x: 432, y: 540 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-pos-040',
    nama: 'Gardu Pos Ronda Siskamling RT 040',
    simbolBentuk: 'kotak',
    kategoriLabel: 'Pos Ronda / Keamanan',
    rt: '040',
    warna: '#000000',
    keterangan: 'Pos ronda malam RT 040 dekat simpang Jl. Pala Timur.',
    penanggungJawab: 'Bpk. Epi (Ketua RT 040)',
    kontak: '0813-6655-0402',
    svgPos: { x: 710, y: 262 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-pos-041',
    nama: 'Gardu Pos Ronda Siskamling RT 041',
    simbolBentuk: 'kotak',
    kategoriLabel: 'Pos Ronda / Keamanan',
    rt: '041',
    warna: '#000000',
    keterangan: 'Pos jaga siskamling jalur masuk Gang Salak RT 041.',
    penanggungJawab: 'Ibu Etty Herawati (Ketua RT 041)',
    kontak: '0821-8899-0413',
    svgPos: { x: 278, y: 475 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-pos-042',
    nama: 'Gardu Pos Ronda Siskamling RT 042',
    simbolBentuk: 'kotak',
    kategoriLabel: 'Pos Ronda / Keamanan',
    rt: '042',
    warna: '#000000',
    keterangan: 'Pos jaga siskamling jalur Jl. Duku RT 042 dekat Balai Warga.',
    penanggungJawab: 'Bpk. Sefrizal (Ketua RT 042)',
    kontak: '0852-7711-0424',
    svgPos: { x: 320, y: 315 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-masjid-baiturrahman',
    nama: 'Masjid Baiturrahman RW 018',
    simbolBentuk: 'segitiga',
    kategoriLabel: 'Tempat Ibadah',
    rt: '040',
    warna: '#059669',
    keterangan: 'Masjid utama RW 018, pusat kegiatan ibadah sholat berjamaah & pengajian warga.',
    penanggungJawab: 'Ketua DKM Masjid Baiturrahman',
    kontak: '0812-3344-5566',
    svgPos: { x: 515, y: 292 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-titik-kumpul-rw',
    nama: 'Posko Titik Kumpul Terpadu RW 018',
    simbolBentuk: 'pin',
    kategoriLabel: 'Sekretariat / Titik Kumpul',
    rt: 'UMUM',
    warna: '#2563eb',
    keterangan: 'Kediaman Ketua RW 018 (Eko Purwanto S.Kom) & Titik Kumpul Utama Kesiapsiagaan Bencana.',
    penanggungJawab: 'Eko Purwanto S.Kom (Ketua RW 018)',
    kontak: '0852-6912-3456',
    svgPos: { x: 480, y: 350 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-balai-warga',
    nama: 'Balai Pertemuan & Posyandu Cempaka 18',
    simbolBentuk: 'medis',
    kategoriLabel: 'Fasilitas Umum & Posyandu',
    rt: '042',
    warna: '#db2777',
    keterangan: 'Gedung serbaguna balai RW untuk posyandu balita & lansia serta musyawarah.',
    penanggungJawab: 'Kader Posyandu Cempaka 18',
    kontak: '0813-7788-9900',
    svgPos: { x: 380, y: 255 },
    createdAt: '2026-08-31 08:00'
  },
  {
    id: 'marker-gerbang-barat',
    nama: 'Portal Keamanan Gerbang Barat (Jl. Pala)',
    simbolBentuk: 'portal',
    kategoriLabel: 'Portal / Penutupan Jalan',
    rt: '039',
    warna: '#dc2626',
    keterangan: 'Portal palang pintu pembatasan akses malam hari pukul 23:00 - 05:00 WIB.',
    penanggungJawab: 'Regu Keamanan RW 018',
    kontak: '0812-7890-0391',
    svgPos: { x: 175, y: 325 },
    createdAt: '2026-08-31 08:00'
  }
];

export function getStoredCustomMarkers(): CustomPetaMarker[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.CUSTOM_MARKERS);
    if (!raw) return DEFAULT_CUSTOM_MARKERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOM_MARKERS;
  } catch {
    return DEFAULT_CUSTOM_MARKERS;
  }
}

export function saveStoredCustomMarker(item: CustomPetaMarker): CustomPetaMarker[] {
  const current = getStoredCustomMarkers();
  const idx = current.findIndex(m => m.id === item.id);
  let updated: CustomPetaMarker[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...item, createdAt: new Date().toISOString() }, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUSTOM_MARKERS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom marker to localStorage', err);
  }
  return updated;
}

export function updateStoredCustomMarkerPosition(id: string, x: number, y: number): CustomPetaMarker[] {
  const current = getStoredCustomMarkers();
  const idx = current.findIndex(m => m.id === id);
  if (idx === -1) return current;
  const updated = [...current];
  updated[idx] = {
    ...updated[idx],
    svgPos: { x: Math.round(x), y: Math.round(y) },
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUSTOM_MARKERS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update custom marker position in localStorage', err);
  }
  return updated;
}

export function deleteStoredCustomMarker(id: string): CustomPetaMarker[] {
  const current = getStoredCustomMarkers();
  const updated = current.filter(m => m.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUSTOM_MARKERS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom marker from localStorage', err);
  }
  return updated;
}

export function resetStoredCustomMarkers(): CustomPetaMarker[] {
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUSTOM_MARKERS, JSON.stringify(DEFAULT_CUSTOM_MARKERS));
  } catch (err) {
    console.error('Failed to reset custom markers in localStorage', err);
  }
  return DEFAULT_CUSTOM_MARKERS;
}

export function getStoredPois(): PetaPointOfInterest[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.POIS);
    if (!raw) return POI_LIST_DATA;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : POI_LIST_DATA;
  } catch {
    return POI_LIST_DATA;
  }
}

export function saveStoredPoi(item: PetaPointOfInterest): PetaPointOfInterest[] {
  const current = getStoredPois();
  const idx = current.findIndex(p => p.id === item.id);
  let updated: PetaPointOfInterest[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = item;
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.POIS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save POI to localStorage', err);
  }
  return updated;
}

export function deleteStoredPoi(id: string): PetaPointOfInterest[] {
  const current = getStoredPois();
  const updated = current.filter(p => p.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.POIS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete POI from localStorage', err);
  }
  return updated;
}

export function getStoredJalan(): InfrastrukturJalan[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.JALAN);
    if (!raw) return DATA_INFRASTRUKTUR_JALAN;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DATA_INFRASTRUKTUR_JALAN;
  } catch {
    return DATA_INFRASTRUKTUR_JALAN;
  }
}

export function saveStoredJalan(item: InfrastrukturJalan): InfrastrukturJalan[] {
  const current = getStoredJalan();
  const idx = current.findIndex(j => j.id === item.id);
  let updated: InfrastrukturJalan[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = item;
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.JALAN, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Jalan to localStorage', err);
  }
  return updated;
}

export function deleteStoredJalan(id: string): InfrastrukturJalan[] {
  const current = getStoredJalan();
  const updated = current.filter(j => j.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.JALAN, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete Jalan from localStorage', err);
  }
  return updated;
}

export function getStoredPju(): PjuData[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.PJU);
    if (!raw) return DATA_PJU;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DATA_PJU;
  } catch {
    return DATA_PJU;
  }
}

export function saveStoredPju(item: PjuData): PjuData[] {
  const current = getStoredPju();
  const idx = current.findIndex(p => p.id === item.id);
  let updated: PjuData[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = item;
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.PJU, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save PJU to localStorage', err);
  }
  return updated;
}

export function deleteStoredPju(id: string): PjuData[] {
  const current = getStoredPju();
  const updated = current.filter(p => p.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.PJU, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete PJU from localStorage', err);
  }
  return updated;
}

export function getStoredDrainase(): DrainaseData[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.DRAINASE);
    if (!raw) return DATA_DRAINASE;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DATA_DRAINASE;
  } catch {
    return DATA_DRAINASE;
  }
}

export function saveStoredDrainase(item: DrainaseData): DrainaseData[] {
  const current = getStoredDrainase();
  const idx = current.findIndex(d => d.id === item.id);
  let updated: DrainaseData[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = item;
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.DRAINASE, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Drainase to localStorage', err);
  }
  return updated;
}

export function deleteStoredDrainase(id: string): DrainaseData[] {
  const current = getStoredDrainase();
  const updated = current.filter(d => d.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.DRAINASE, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete Drainase from localStorage', err);
  }
  return updated;
}

export function getStoredCuplikan(): CctvRecordingClip[] {
  try {
    const raw = localStorage.getItem(PETA_STORAGE_KEYS.CUPLIKAN);
    if (!raw) return DATA_CUPLIKAN_REKAMAN_CCTV;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DATA_CUPLIKAN_REKAMAN_CCTV;
  } catch {
    return DATA_CUPLIKAN_REKAMAN_CCTV;
  }
}

export function saveStoredCuplikan(item: CctvRecordingClip): CctvRecordingClip[] {
  const current = getStoredCuplikan();
  const idx = current.findIndex(c => c.id === item.id);
  let updated: CctvRecordingClip[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = item;
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUPLIKAN, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Cuplikan to localStorage', err);
  }
  return updated;
}

export function deleteStoredCuplikan(id: string): CctvRecordingClip[] {
  const current = getStoredCuplikan();
  const updated = current.filter(c => c.id !== id);
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUPLIKAN, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete Cuplikan from localStorage', err);
  }
  return updated;
}

export function resetStoredCuplikan(): CctvRecordingClip[] {
  try {
    localStorage.setItem(PETA_STORAGE_KEYS.CUPLIKAN, JSON.stringify(DATA_CUPLIKAN_REKAMAN_CCTV));
  } catch (err) {
    console.error('Failed to reset Cuplikan in localStorage', err);
  }
  return DATA_CUPLIKAN_REKAMAN_CCTV;
}


