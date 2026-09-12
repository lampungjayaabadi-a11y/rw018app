import { LaporanKejadian } from '../types';

export const ROMAN_MONTHS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

export function getRomanMonth(monthIndex1to12: number): string {
  const index = Math.max(1, Math.min(12, Math.floor(monthIndex1to12))) - 1;
  return ROMAN_MONTHS[index] || 'I';
}

export function getHariIndonesia(dateStr: string): string {
  if (!dateStr) return 'Senin';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Senin';
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNames[d.getDay()] || 'Senin';
  } catch {
    return 'Senin';
  }
}

export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const bulanNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const tgl = d.getDate();
    const bln = bulanNames[d.getMonth()];
    const thn = d.getFullYear();
    return `${tgl} ${bln} ${thn}`;
  } catch {
    return dateStr;
  }
}

/**
 * Menghasilkan nomor laporan otomatis tanpa duplikat.
 * Format standar: 001/RW.018/IX/2026, 002/RW.018/IX/2026, dst.
 */
export function generateNextNomorLaporan(
  existingList: LaporanKejadian[],
  currentDateStr?: string
): string {
  const d = currentDateStr ? new Date(currentDateStr) : new Date();
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const romanMonth = getRomanMonth(month);

  let maxSeq = 0;

  for (const item of existingList) {
    if (!item.nomorLaporan) continue;
    const parts = item.nomorLaporan.trim().split('/');
    if (parts.length >= 4) {
      const numPart = parseInt(parts[0], 10);
      const yearPart = parseInt(parts[3], 10);
      // Sequence either globally or for current year
      if (!isNaN(numPart)) {
        if (!isNaN(yearPart) && yearPart === year) {
          if (numPart > maxSeq) maxSeq = numPart;
        } else if (numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padSeq = String(nextSeq).padStart(3, '0');
  return `${padSeq}/RW.018/${romanMonth}/${year}`;
}

/**
 * AI Chronology Builder
 * Membantu merapikan catatan singkat pengguna menjadi uraian kronologi resmi,
 * sistematis, dan objektif tanpa mengarang fakta.
 */
export async function buildKronologiWithAI(
  rawNotes: string,
  context?: {
    jenisKejadian?: string;
    lokasi?: string;
    tanggal?: string;
    waktu?: string;
    hari?: string;
    rt?: string;
  }
): Promise<string> {
  const trimmed = rawNotes.trim();
  if (!trimmed) {
    return '';
  }

  // Attempt to call Gemini API if key is available in environment or server
  try {
    const apiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY);

    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Anda adalah asisten perapihan dokumen laporan kejadian resmi Ketua RW 018 Kampung Banten, Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro.

TUGAS UTAMA:
Rapiakan catatan singkat dari pelapor/warga berikut menjadi narasi URAIAN KRONOLOGIS KEJADIAN yang formal, runut berdasarkan urutan waktu, jelas, dan berbobot kedinasan.

ATURAN KETAT:
1. DILARANG KERAS MENGARANG FAKTA BARU. Hanya gunakan informasi yang tertulis di catatan pengguna.
2. Jangan menambahkan nama orang, barang, kerugian, atau kronologi fiktif yang tidak disebutkan pelapor.
3. Gunakan Bahasa Indonesia formal dan baku.
4. Susun dalam format paragraf atau poin bernomor kronologis (contoh: 1. Pada pukul... 2. Sekitar pukul... 3. Warga dan petugas...).

Konteks Tambahan (hanya untuk keselarasan):
- Jenis Kejadian: ${context?.jenisKejadian || '-'}
- Waktu & Hari: ${context?.hari || ''}, ${context?.tanggal || ''} jam ${context?.waktu || ''}
- Lokasi: ${context?.lokasi || ''} (RT ${context?.rt || '018'})

Catatan Pengguna:
"""${trimmed}"""

Tuliskan HANYA teks uraian kronologi hasil perapihan tanpa pengantar basa-basi atau catatan penutup:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response && response.text) {
        return response.text.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed or not configured, using structured rule-based parser:', err);
  }

  // Fallback: Intelligent rule-based chronology structuring
  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const waktuStr = context?.waktu ? `sekitar pukul ${context.waktu}` : 'pada waktu kejadian';
  const hariStr = context?.hari ? `hari ${context.hari}` : '';
  const tglStr = context?.tanggal ? formatTanggalIndonesia(context.tanggal) : '';
  const waktuGabungan = [hariStr, tglStr, waktuStr].filter(Boolean).join(', ');

  const formattedLines = lines.map((line, idx) => {
    // Remove existing leading numbers or bullets
    const cleanLine = line.replace(/^(\d+[\.\)\-:]|\*|\-|•)\s*/, '');
    const capitalized = cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1);
    return `${idx + 1}. ${capitalized}`;
  });

  return (
    `Pada ${waktuGabungan}, terjadi peristiwa ${context?.jenisKejadian || 'kejadian'} di wilayah ${
      context?.lokasi ? context.lokasi + ' (RT ' + (context.rt || '018') + ')' : 'RW 018 Kampung Banten'
    }. Rangkaian peristiwa tercatat sebagai berikut:\n\n` +
    formattedLines.join('\n\n') +
    `\n\nPetugas siskamling dan pengurus RW 018 Kampung Banten telah mendatangi lokasi untuk memastikan situasi terkendali.`
  );
}

/**
 * Format teks ringkasan untuk WhatsApp & Web Share API
 */
export function formatLaporanWhatsApp(lap: LaporanKejadian): string {
  const tujuanStr = lap.tujuanLaporan.length > 0 ? lap.tujuanLaporan.join(', ') : 'Pihak Berwenang';
  const korbanStr =
    lap.korban.length > 0
      ? lap.korban.map((k) => `${k.nama} (${k.status})`).join(', ')
      : 'Tidak ada korban tercatat';

  return `*LAPORAN KEJADIAN RESMI RW 018*
*RW 018 KAMPUNG BANTEN - KELURAHAN IRINGMULYO*
--------------------------------------------
*Nomor Laporan:* ${lap.nomorLaporan}
*Kepada Yth:* ${tujuanStr}
*Pelapor:* ${lap.pelaporNama} (${lap.pelaporJabatan})

*Jenis Kejadian:* ${lap.jenisKejadian === 'Kejadian Lainnya' ? lap.jenisKejadianLainnya || 'Kejadian Lainnya' : lap.jenisKejadian}
*Waktu Kejadian:* ${lap.hariKejadian}, ${formatTanggalIndonesia(lap.tanggalKejadian)} - ${lap.waktuKejadian}
*Lokasi:* ${lap.lokasiKejadian} (RT ${lap.rt} RW 018)
*Alamat Lengkap:* ${lap.alamatLengkap}

*Pihak Terkait / Korban:* ${korbanStr}
*Dampak Korban Jiwa:* ${lap.korbanJiwa === 'Ada' ? `Ada (${lap.jumlahKorbanJiwa} orang)` : 'Tidak Ada'}
*Dampak Korban Luka:* ${lap.korbanLuka === 'Ada' ? `Ada (${lap.jumlahKorbanLuka} orang)` : 'Tidak Ada'}
*Kerugian Materiil:* ${lap.kerugianMateri === 'Ada' ? `Ada (Rp ${(lap.nilaiKerugian || 0).toLocaleString('id-ID')})` : 'Tidak Ada'}

*Uraian Kronologis:*
${lap.kronologi}

*Tindakan Dilakukan:*
${lap.tindakan.join(', ')}
${lap.uraianTindakan ? `\nCatatan Tindakan: ${lap.uraianTindakan}` : ''}

*Status Dokumen:* ${lap.status}
*Bhabinkamtibmas:* Aipda Evodius (NRP. 84050233 / 081379712721)
*Sekretariat:* Jl. Pala Nomor 1 RT 039 RW 018 Kampung Banten
--------------------------------------------
_Demikian laporan kejadian ini dibuat resmi oleh Pengurus RW 018 Kampung Banten untuk diketahui dan ditindaklanjuti._`;
}
