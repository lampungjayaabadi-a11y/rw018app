import { BulanIuranItem, IuranRkmRecord, WargaMeninggalRecord } from '../types';

export const NAMA_BULAN_RKM = [
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
  'Desember'
];

export function getCollectorByRt(rt: string) {
  if (rt === '039') {
    return { nama: 'Zaenal Fanani', jabatan: 'Ketua RT 039 / Petugas Kolektor', noHp: '0812-7890-0391' };
  }
  if (rt === '040') {
    return { nama: 'Epi', jabatan: 'Ketua RT 040 / Petugas Kolektor', noHp: '0813-6655-0402' };
  }
  if (rt === '041') {
    return { nama: 'Etty Herawati', jabatan: 'Ketua RT 041 / Petugas Kolektor', noHp: '0821-8899-0413' };
  }
  if (rt === '042') {
    return { nama: 'Sefrizal', jabatan: 'Ketua RT 042 / Petugas Kolektor', noHp: '0852-7711-0424' };
  }
  return { nama: 'Petugas Kolektor RT', jabatan: `Kolektor RT ${rt}`, noHp: '' };
}

export function generateDefault12Bulan(
  tahun = 2026,
  nominalDefault = 10000,
  lunasMonths = 8,
  isFree = false,
  collectorName = ''
): BulanIuranItem[] {
  return NAMA_BULAN_RKM.map((namaBulan, idx) => {
    const monthNum = idx + 1;
    const isPaid = isFree || monthNum <= lunasMonths;

    return {
      bulan: monthNum,
      namaBulan,
      nominal: isFree ? 0 : nominalDefault,
      bayar: isPaid,
      tanggalBayar: isPaid ? `${tahun}-${String(monthNum).padStart(2, '0')}-05` : '',
      status: isFree ? 'Bebas Iuran (Dhuafa)' : isPaid ? 'Lunas' : 'Belum Lunas',
      keterangan: isFree ? 'Subsidi Kas RKM RW 018' : isPaid ? 'Lunas Kolektor RT' : 'Belum Bayar',
      kolektor: collectorName || ''
    };
  });
}

export function calculate12BulanSummary(items?: BulanIuranItem[]) {
  if (!items || items.length === 0) {
    return {
      totalNominal: 120000,
      totalTerbayar: 0,
      sisaTunggakan: 120000,
      lunasCount: 0,
      isFullPaid: false,
    };
  }

  const totalNominal = items.reduce((sum, b) => sum + (b.nominal || 0), 0);
  const totalTerbayar = items.reduce((sum, b) => b.bayar ? sum + (b.nominal || 0) : sum, 0);
  const sisaTunggakan = Math.max(0, totalNominal - totalTerbayar);
  const lunasCount = items.filter((b) => b.bayar).length;
  const isFullPaid = lunasCount === 12 || (totalNominal === 0 && lunasCount === 12);

  return {
    totalNominal,
    totalTerbayar,
    sisaTunggakan,
    lunasCount,
    isFullPaid,
  };
}

export interface SaldoRkmRtItem {
  rt: string;
  namaRt: string;
  namaPetugas: string;
  jabatanPetugas: string;
  noHpPetugas: string;
  totalKk: number;
  totalKkLunas: number;
  totalKkBelumLunas: number;
  totalKkDhuafa: number;
  totalPenerimaanIuran: number; // total uang iuran masuk
  totalTunggakanIuran: number;  // total piutang/tunggakan belum bayar
  totalSantunanDisalurkan: number; // total santunan kematian yang keluar
  totalWargaMeninggal: number; // jumlah jiwa wafat
  saldoBersih: number; // totalPenerimaanIuran - totalSantunanDisalurkan
  persentaseLunas: number; // persentase KK tertib / terbayar
}

export interface SaldoRkmRwSummary {
  perRt: SaldoRkmRtItem[];
  totalKk: number;
  totalKkLunas: number;
  totalKkBelumLunas: number;
  totalKkDhuafa: number;
  totalPenerimaanIuran: number;
  totalTunggakanIuran: number;
  totalSantunanDisalurkan: number;
  totalWargaMeninggal: number;
  totalSaldoBersih: number;
  persentaseLunas: number;
}

export function calculateSaldoRkmSummary(
  iuranList: IuranRkmRecord[] = [],
  meninggalList: WargaMeninggalRecord[] = [],
  daftarRt: string[] = ['039', '040', '041', '042'],
  selectedYear?: number
): SaldoRkmRwSummary {
  const perRt: SaldoRkmRtItem[] = daftarRt.map((rt) => {
    const collector = getCollectorByRt(rt);

    const iuranRt = iuranList.filter((item) => {
      const matchRt = item.rt === rt;
      if (!matchRt) return false;
      if (selectedYear && selectedYear > 0) {
        if (item.tahun && item.tahun !== selectedYear) return false;
        if (!item.tahun && item.bulanTahun && !item.bulanTahun.startsWith(String(selectedYear))) return false;
      }
      return true;
    });

    const meninggalRt = meninggalList.filter((m) => {
      const matchRt = m.rt === rt;
      if (!matchRt) return false;
      if (selectedYear && selectedYear > 0) {
        if (m.tanggalMeninggal && !m.tanggalMeninggal.startsWith(String(selectedYear))) return false;
      }
      return true;
    });

    let totalPenerimaanIuran = 0;
    let totalTunggakanIuran = 0;
    let totalKkLunas = 0;
    let totalKkBelumLunas = 0;
    let totalKkDhuafa = 0;

    iuranRt.forEach((item) => {
      const isDhuafa = item.nominal === 0 || (item.rincian12Bulan && item.rincian12Bulan.some((b) => b.status === 'Bebas Iuran (Dhuafa)'));
      if (isDhuafa) {
        totalKkDhuafa += 1;
      }

      if (item.rincian12Bulan && item.rincian12Bulan.length > 0) {
        const sumTerbayar = item.rincian12Bulan.reduce((acc, b) => b.bayar ? acc + (b.nominal || 0) : acc, 0);
        const sumTunggakan = item.rincian12Bulan.reduce((acc, b) => (!b.bayar && b.status !== 'Bebas Iuran (Dhuafa)') ? acc + (b.nominal || 0) : acc, 0);
        totalPenerimaanIuran += sumTerbayar;
        totalTunggakanIuran += sumTunggakan;

        const allPaidOrFree = item.rincian12Bulan.every((b) => b.bayar || b.status === 'Bebas Iuran (Dhuafa)');
        if (allPaidOrFree) {
          totalKkLunas += 1;
        } else {
          totalKkBelumLunas += 1;
        }
      } else {
        if (item.status === 'Lunas') {
          totalPenerimaanIuran += (item.nominal || 0);
          totalKkLunas += 1;
        } else {
          totalTunggakanIuran += (item.nominal || 0);
          totalKkBelumLunas += 1;
        }
      }
    });

    const totalSantunanDisalurkan = meninggalRt.reduce((acc, m) => acc + (m.santunanRkm || 0), 0);
    const totalWargaMeninggal = meninggalRt.length;
    const saldoBersih = totalPenerimaanIuran - totalSantunanDisalurkan;
    const totalKk = iuranRt.length;
    const persentaseLunas = totalKk > 0 ? Math.round((totalKkLunas / totalKk) * 100) : 0;

    return {
      rt,
      namaRt: `RT ${rt}`,
      namaPetugas: collector.nama,
      jabatanPetugas: collector.jabatan,
      noHpPetugas: collector.noHp,
      totalKk,
      totalKkLunas,
      totalKkBelumLunas,
      totalKkDhuafa,
      totalPenerimaanIuran,
      totalTunggakanIuran,
      totalSantunanDisalurkan,
      totalWargaMeninggal,
      saldoBersih,
      persentaseLunas,
    };
  });

  const totalKk = perRt.reduce((acc, r) => acc + r.totalKk, 0);
  const totalKkLunas = perRt.reduce((acc, r) => acc + r.totalKkLunas, 0);
  const totalKkBelumLunas = perRt.reduce((acc, r) => acc + r.totalKkBelumLunas, 0);
  const totalKkDhuafa = perRt.reduce((acc, r) => acc + r.totalKkDhuafa, 0);
  const totalPenerimaanIuran = perRt.reduce((acc, r) => acc + r.totalPenerimaanIuran, 0);
  const totalTunggakanIuran = perRt.reduce((acc, r) => acc + r.totalTunggakanIuran, 0);
  const totalSantunanDisalurkan = perRt.reduce((acc, r) => acc + r.totalSantunanDisalurkan, 0);
  const totalWargaMeninggal = perRt.reduce((acc, r) => acc + r.totalWargaMeninggal, 0);
  const totalSaldoBersih = totalPenerimaanIuran - totalSantunanDisalurkan;
  const persentaseLunas = totalKk > 0 ? Math.round((totalKkLunas / totalKk) * 100) : 0;

  return {
    perRt,
    totalKk,
    totalKkLunas,
    totalKkBelumLunas,
    totalKkDhuafa,
    totalPenerimaanIuran,
    totalTunggakanIuran,
    totalSantunanDisalurkan,
    totalWargaMeninggal,
    totalSaldoBersih,
    persentaseLunas,
  };
}

