import * as XLSX from 'xlsx';
import {
  Warga,
  KartuKeluarga,
  TransaksiKas,
  IuranWargaRecord,
  IuranRkmRecord,
  WargaMeninggalRecord,
  PerlengkapanRkmItem,
  BansosItem,
  PbbRecord,
  RWProfile,
  AppDatabase
} from '../types';
import { hitungUsia, formatRupiah, formatTanggalIndo } from './formatters';

/**
 * Universal helper to trigger file download in browser
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export array of flat objects to CSV with UTF-8 BOM
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(';'), // Use semicolon for excel-friendly indonesian localization
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] === null || row[header] === undefined ? '' : row[header];
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        })
        .join(';')
    ),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export to Excel (.xlsx) with one or multiple worksheets
 */
export function exportToExcel(
  filename: string,
  sheets: { sheetName: string; data: Record<string, any>[] }[]
) {
  if (!sheets || sheets.length === 0 || sheets.every((s) => s.data.length === 0)) {
    alert('Tidak ada data untuk diekspor ke Excel.');
    return;
  }

  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    if (sheet.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheet.data);
      // Auto-fit column widths
      const keys = Object.keys(sheet.data[0] || {});
      const colWidths = keys.map((key) => {
        let maxLen = key.length;
        sheet.data.forEach((row) => {
          const val = row[key];
          if (val !== undefined && val !== null) {
            const strLen = String(val).length;
            if (strLen > maxLen) maxLen = strLen;
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
      });
      ws['!cols'] = colWidths;
      
      const safeSheetName = sheet.sheetName.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }
  });

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadFile(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/* =========================================================================
   SPECIFIC MODULE EXPORTERS
   ========================================================================= */

/**
 * 1. Export Data Warga
 */
export function formatWargaForExport(wargaList: Warga[], profile?: RWProfile) {
  return wargaList.map((w, index) => ({
    'No': index + 1,
    'NIK': ` ${w.nik}`, // Prefix with space to prevent Excel number cutoff
    'No KK': ` ${w.noKk}`,
    'Nama Lengkap': w.nama,
    'Jenis Kelamin': w.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    'Tempat Lahir': w.tempatLahir || '-',
    'Tanggal Lahir': w.tanggalLahir,
    'Usia (Tahun)': hitungUsia(w.tanggalLahir),
    'Agama': w.agama,
    'Pekerjaan': w.pekerjaan,
    'Status Perkawinan': w.statusKawin,
    'Status dalam Keluarga': w.statusKeluarga,
    'RT': `RT ${w.rt}`,
    'RW': profile?.namaRw || 'RW 018',
    'Alamat Lengkap': w.alamat,
    'No HP / WhatsApp': w.noHp ? ` ${w.noHp}` : '-',
    'Golongan Darah': w.golDarah || 'Tidak Tahu',
    'Pendidikan Terakhir': w.pendidikan || '-',
    'Kategori Lansia': w.isLansia ? 'Ya (Lansia)' : 'Tidak',
    'Penyandang Disabilitas': w.isDisabilitas ? 'Ya' : 'Tidak',
    'Status Duda / Janda': w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup'
      ? (w.jenisKelamin === 'L' ? 'Duda' : 'Janda')
      : 'Bukan',
    'Status Domisili': w.statusDomisili || 'Tetap',
    'Terdaftar Pada': w.createdAt ? formatTanggalIndo(w.createdAt.slice(0, 10)) : '-',
  }));
}

export function exportWarga(
  wargaList: Warga[],
  format: 'xlsx' | 'csv',
  scopeLabel = 'Semua_RT',
  profile?: RWProfile
) {
  const data = formatWargaForExport(wargaList, profile);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Data_Warga_RW018_${scopeLabel}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Data Warga', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 1b. Export Data Warga Kategori Khusus
 */
export function formatWargaKategoriKhususForExport(
  wargaList: (Warga & { kategoriLabel?: string; catatanKhusus?: string })[],
  profile?: RWProfile
) {
  return wargaList.map((w, index) => ({
    'No': index + 1,
    'Kategori Khusus': w.kategoriLabel || 'Semua Khusus',
    'NIK': ` ${w.nik}`,
    'No KK': ` ${w.noKk}`,
    'Nama Lengkap': w.nama,
    'Jenis Kelamin': w.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    'Usia (Tahun)': hitungUsia(w.tanggalLahir),
    'Tanggal Lahir': w.tanggalLahir,
    'Tempat Lahir': w.tempatLahir || '-',
    'Status dalam Keluarga': w.statusKeluarga,
    'Status Perkawinan': w.statusKawin,
    'Pekerjaan': w.pekerjaan,
    'RT': `RT ${w.rt}`,
    'RW': profile?.namaRw || 'RW 018',
    'Alamat Lengkap': w.alamat,
    'No Telepon / WA': w.noHp ? ` ${w.noHp}` : '-',
    'Golongan Darah': w.golDarah || '-',
    'Catatan / Keterangan': w.catatanKhusus || '-',
  }));
}

export function exportWargaKategoriKhusus(
  wargaList: (Warga & { kategoriLabel?: string; catatanKhusus?: string })[],
  format: 'xlsx' | 'csv',
  categoryLabel = 'Kategori_Khusus',
  scopeLabel = 'Semua_RT',
  profile?: RWProfile
) {
  const data = formatWargaKategoriKhususForExport(wargaList, profile);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Laporan_${categoryLabel}_RW018_${scopeLabel}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Laporan Kategori Khusus', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 2. Export Data Kartu Keluarga
 */
export function formatKkForExport(kkList: KartuKeluarga[], profile?: RWProfile) {
  return kkList.map((k, index) => ({
    'No': index + 1,
    'No Kartu Keluarga': ` ${k.noKk}`,
    'Kepala Keluarga': k.kepalaKeluarga,
    'NIK Kepala': ` ${k.nikKepala}`,
    'RT': `RT ${k.rt}`,
    'RW': profile?.namaRw || 'RW 018',
    'Alamat': k.alamat,
    'Telepon / WA': k.telepon ? ` ${k.telepon}` : '-',
    'Status Ekonomi': k.statusEkonomi,
    'Desil (P3KE/DTKS)': k.desil || 'Non-Desil',
    'Jumlah Anggota': k.jumlahAnggota || (k.anggotaIds ? k.anggotaIds.length : 0),
    'Tanggal Terdaftar': k.createdAt ? formatTanggalIndo(k.createdAt.slice(0, 10)) : '-',
  }));
}

export function exportKk(
  kkList: KartuKeluarga[],
  format: 'xlsx' | 'csv',
  scopeLabel = 'Semua_RT',
  profile?: RWProfile
) {
  const data = formatKkForExport(kkList, profile);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Data_Kartu_Keluarga_RW018_${scopeLabel}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Kartu Keluarga', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 3. Export Transaksi Kas RW
 */
export function formatKasForExport(kasList: TransaksiKas[]) {
  return kasList.map((k, index) => ({
    'No': index + 1,
    'Kode Transaksi': k.kode,
    'Tanggal': k.tanggal,
    'Tipe Transaksi': k.tipe,
    'Kategori': k.kategori,
    'Jumlah (Rp)': k.jumlah,
    'Format Rupiah': formatRupiah(k.jumlah),
    'Keterangan': k.keterangan,
    'Penanggung Jawab': k.penanggungJawab,
    'Wilayah RT': k.rt ? `RT ${k.rt}` : 'Kas RW (Umum)',
  }));
}

export function exportKas(kasList: TransaksiKas[], format: 'xlsx' | 'csv') {
  const data = formatKasForExport(kasList);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Laporan_Buku_Kas_RW018_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Buku Kas RW', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 4. Export Iuran Bulanan Warga
 */
export function formatIuranForExport(iuranList: IuranWargaRecord[]) {
  return iuranList.map((i, index) => ({
    'No': index + 1,
    'No KK': ` ${i.noKk}`,
    'Nama Kepala Keluarga': i.namaKepala,
    'RT': `RT ${i.rt}`,
    'Periode Bulan': i.bulanTahun,
    'Nominal (Rp)': i.nominal,
    'Format Nominal': formatRupiah(i.nominal),
    'Status Pembayaran': i.status,
    'Tanggal Bayar': i.tanggalBayar ? formatTanggalIndo(i.tanggalBayar) : '-',
    'Penerima Iuran': i.penerima || '-',
    'Nomor Kuitansi': i.kuitansiNo || '-',
  }));
}

export function exportIuran(
  iuranList: IuranWargaRecord[],
  format: 'xlsx' | 'csv',
  bulanLabel = ''
) {
  const data = formatIuranForExport(iuranList);
  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = bulanLabel ? `_${bulanLabel}` : '';
  const baseName = `Laporan_Iuran_Warga_RW018${suffix}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Iuran Bulanan Warga', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 5. Export Data RKM (Iuran RKM, Warga Meninggal, Perlengkapan)
 */
export function formatIuranRkmForExport(rkmList: IuranRkmRecord[]) {
  return rkmList.map((r, index) => ({
    'No': index + 1,
    'No KK': ` ${r.noKk}`,
    'Nama Kepala Keluarga': r.namaKepala,
    'RT': `RT ${r.rt}`,
    'Periode Bulan': r.bulanTahun,
    'Nominal (Rp)': r.nominal,
    'Status': r.status,
    'Tanggal Bayar': r.tanggalBayar || '-',
    'Petugas Penerima': r.penerima || '-',
    'No Kuitansi': r.kuitansiNo || '-',
  }));
}

export function formatWargaMeninggalForExport(list: WargaMeninggalRecord[]) {
  return list.map((m, index) => ({
    'No': index + 1,
    'NIK Almarhum': ` ${m.nik}`,
    'Nama Almarhum / Almarhumah': m.nama,
    'Jenis Kelamin': m.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    'Usia': `${m.usia} Tahun`,
    'RT': `RT ${m.rt}`,
    'Alamat Rumah Duka': m.alamat,
    'Tanggal Wafat': m.tanggalMeninggal,
    'Waktu': m.waktuMeninggal || '-',
    'Tempat Wafat': m.tempatMeninggal || '-',
    'Lokasi Pemakaman': m.lokasiPemakaman,
    'Santunan Duka (Rp)': m.santunanRkm,
    'Status Santunan': m.statusSantunan,
    'Ahli Waris Penerima': m.namaAhliWaris,
    'Hubungan Waris': m.hubunganWaris,
    'No Kontak Waris': m.noHpWaris ? ` ${m.noHpWaris}` : '-',
  }));
}

export function formatPerlengkapanRkmForExport(items: PerlengkapanRkmItem[]) {
  return items.map((p, index) => ({
    'No': index + 1,
    'Nama Inventaris': p.namaBarang,
    'Kategori': p.kategori,
    'Jumlah Total': p.jumlah,
    'Satuan': p.satuan,
    'Kondisi': p.kondisi,
    'Status': p.status,
    'Lokasi Penyimpanan': p.lokasiSimpan,
    'Penanggung Jawab': p.penanggungJawab,
    'Peminjam Saat Ini': p.peminjamSaatIni || '-',
  }));
}

export function exportRkmModule(
  iuranRkm: IuranRkmRecord[],
  meninggalList: WargaMeninggalRecord[],
  perlengkapanList: PerlengkapanRkmItem[],
  format: 'xlsx' | 'csv'
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Laporan_RKM_Kematian_RW018_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [
      { sheetName: 'Iuran RKM', data: formatIuranRkmForExport(iuranRkm) },
      { sheetName: 'Rekap Warga Meninggal', data: formatWargaMeninggalForExport(meninggalList) },
      { sheetName: 'Inventaris RKM', data: formatPerlengkapanRkmForExport(perlengkapanList) },
    ]);
  } else {
    // For CSV, export main Iuran RKM
    exportToCsv(`${baseName}_Iuran`, formatIuranRkmForExport(iuranRkm));
  }
}

/**
 * 6. Export Bansos
 */
export function formatBansosForExport(bansosList: BansosItem[]) {
  return bansosList.map((b, index) => ({
    'No': index + 1,
    'NIK Penerima': ` ${b.nik}`,
    'Nama Lengkap Penerima': b.namaPenerima,
    'No Kartu Keluarga': ` ${b.noKk}`,
    'RT': `RT ${b.rt}`,
    'Jenis Bantuan Sosial': b.jenisBansos,
    'Periode Penyaluran': b.periode,
    'Status Penyaluran': b.status,
    'Paket / Nilai Bantuan': b.nominalOrPaket || '-',
    'Tanggal Disalurkan': b.tanggalPenyaluran ? formatTanggalIndo(b.tanggalPenyaluran) : '-',
    'Petugas Penyalur': b.petugasPenyalur || '-',
    'Keterangan': b.keterangan || '-',
  }));
}

export function exportBansos(bansosList: BansosItem[], format: 'xlsx' | 'csv') {
  const data = formatBansosForExport(bansosList);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Data_Penerima_Bansos_RW018_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Bansos RW 018', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 7. Export PBB (Pajak Bumi dan Bangunan)
 */
export function formatPbbForExport(pbbList: PbbRecord[]) {
  return pbbList.map((p, index) => ({
    'No': index + 1,
    'NOP (Nomor Objek Pajak)': ` ${p.nop}`,
    'Nama Wajib Pajak': p.namaWajibPajak,
    'NIK Wajib Pajak': p.nikWajibPajak ? ` ${p.nikWajibPajak}` : '-',
    'No KK': p.noKk ? ` ${p.noKk}` : '-',
    'RT': `RT ${p.rt}`,
    'Alamat Objek Pajak': p.alamatObjek,
    'Nama Pemilik SHM': p.namaPemilikShm || '-',
    'No SHM': p.noShm || '-',
    'Status Hak Tanah': p.statusHak || '-',
    'Luas Tanah (m2)': p.luasTanah || 0,
    'Luas Bangunan (m2)': p.luasBangunan || 0,
    'Total NJOP (Rp)': p.totalNjop || 0,
    'Tahun Pajak': p.tahunPajak,
    'Tagihan Pokok (Rp)': p.tagihanPokok || 0,
    'Denda (Rp)': p.denda || 0,
    'Total Tagihan (Rp)': p.totalTagihan || 0,
    'Format Total Tagihan': formatRupiah(p.totalTagihan || 0),
    'Status Pembayaran': p.statusPembayaran,
    'Tanggal Bayar': p.tanggalBayar ? formatTanggalIndo(p.tanggalBayar) : '-',
    'Metode Bayar': p.metodeBayar || '-',
    'Bukti / NTPN': p.buktiBayarNo || '-',
  }));
}

export function exportPbb(
  pbbList: PbbRecord[],
  format: 'xlsx' | 'csv',
  scopeLabel: string = 'Semua_RT',
  profile?: RWProfile
) {
  const data = formatPbbForExport(pbbList);
  const rwName = profile?.namaRw ? profile.namaRw.replace(/\s+/g, '_') : 'RW018';
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Laporan_PBB_P2_${rwName}_${scopeLabel}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Data PBB Warga', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

export interface PbbKkSummaryExportItem {
  noKk: string;
  namaKepala: string;
  rt: string;
  alamat: string;
  telepon?: string;
  statusEkonomi?: string;
  jumlahNop: number;
  daftarNop: string;
  totalNjop: number;
  tagihan2026: number;
  status2026: string;
  jumlahTahunTunggakan: number;
  rincianTahunTunggakan: string;
  totalNominalTunggakan: number;
  totalBebanKeseluruhan: number;
  statusPenagihan: string;
}

export function formatPbbKkForExport(items: PbbKkSummaryExportItem[]) {
  return items.map((item, index) => ({
    'No': index + 1,
    'No. Kartu Keluarga': ` ${item.noKk}`,
    'Nama Kepala Keluarga': item.namaKepala,
    'Wilayah RT': `RT ${item.rt}`,
    'Alamat': item.alamat,
    'No. Telepon / WA': item.telepon || '-',
    'Status Ekonomi': item.statusEkonomi || '-',
    'Jumlah Objek NOP': item.jumlahNop,
    'Daftar NOP': item.daftarNop,
    'Total NJOP (Rp)': item.totalNjop,
    'Tagihan PBB 2026 (Rp)': item.tagihan2026,
    'Status PBB 2026': item.status2026,
    'Jumlah Tahun Tunggakan': item.jumlahTahunTunggakan,
    'Rincian Tahun Tunggakan': item.rincianTahunTunggakan || 'Nihil',
    'Total Tunggakan (Rp)': item.totalNominalTunggakan,
    'Total Beban Ditagih (Rp)': item.totalBebanKeseluruhan,
    'Status Penagihan Ketua RT': item.statusPenagihan,
  }));
}

export function exportPbbKk(
  items: PbbKkSummaryExportItem[],
  format: 'xlsx' | 'csv',
  scopeLabel: string = 'Semua_RT',
  profile?: RWProfile
) {
  const data = formatPbbKkForExport(items);
  const rwName = profile?.namaRw ? profile.namaRw.replace(/\s+/g, '_') : 'RW018';
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Rekapitulasi_Riwayat_PBB_per_KK_${rwName}_${scopeLabel}_${dateStr}`;

  if (format === 'xlsx') {
    exportToExcel(baseName, [{ sheetName: 'Riwayat PBB per KK', data }]);
  } else {
    exportToCsv(baseName, data);
  }
}

/**
 * 8. Export Entire Database to Multi-Sheet Master Workbook Excel
 */
export function exportMasterWorkbook(db: AppDatabase) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseName = `Master_Laporan_Administrasi_RW018_${dateStr}`;

  exportToExcel(baseName, [
    { sheetName: 'Data Induk Warga', data: formatWargaForExport(db.warga, db.profile) },
    { sheetName: 'Kartu Keluarga', data: formatKkForExport(db.kk, db.profile) },
    { sheetName: 'Buku Kas RW', data: formatKasForExport(db.kas) },
    { sheetName: 'Iuran Bulanan Warga', data: formatIuranForExport(db.iuran) },
    { sheetName: 'Iuran RKM Kematian', data: formatIuranRkmForExport(db.iuranRkm) },
    { sheetName: 'Rekap Warga Meninggal', data: formatWargaMeninggalForExport(db.wargaMeninggal) },
    { sheetName: 'Inventaris RKM', data: formatPerlengkapanRkmForExport(db.perlengkapanRkm) },
    { sheetName: 'Bantuan Sosial (Bansos)', data: formatBansosForExport(db.bansos) },
    { sheetName: 'PBB Warga', data: formatPbbForExport(db.pbb || []) },
  ]);
}
