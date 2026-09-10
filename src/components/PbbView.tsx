import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Printer,
  CreditCard,
  Building2,
  MapPin,
  User,
  ShieldCheck,
  Calendar,
  X,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Receipt,
  FileCheck2,
  DollarSign,
  BarChart3,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Percent,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Users,
  Phone,
  MessageSquare,
  ExternalLink,
  Copy,
  CheckCheck,
  Send,
  ArrowLeft
} from 'lucide-react';
import {
  PbbRecord,
  StatusBayarPbb,
  StatusHakTanah,
  MetodeBayarPbb,
  TunggakanPbbItem,
  RWProfile,
  Warga,
  KartuKeluarga,
  AppUser
} from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { exportPbb, exportPbbKk, PbbKkSummaryExportItem } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { LOGO_RW_018 } from '../constants/logo';
import { isMatchingRt, getUserRestrictedRt } from '../services/auth';

interface PbbViewProps {
  pbbList: PbbRecord[];
  profile: RWProfile;
  wargaList?: Warga[];
  kkList?: KartuKeluarga[];
  currentUser?: AppUser | null;
  onSavePbb: (item: PbbRecord) => void;
  onDeletePbb: (id: string) => void;
  onBayarPbb: (
    id: string,
    paymentData: {
      tanggalBayar: string;
      metodeBayar: MetodeBayarPbb;
      buktiBayarNo?: string;
      namaPenyetor?: string;
      petugasKolektor?: string;
      catatan?: string;
    }
  ) => void;
  onBayarTunggakan: (
    id: string,
    tahunTunggakan: number,
    paymentData: {
      tanggalBayar: string;
      metodeBayar: MetodeBayarPbb;
      kuitansiNo?: string;
    }
  ) => void;
}

export interface RtPbbSummary {
  rt: string;
  totalNop: number;
  totalNjop: number;
  targetPbb: number;
  pokokPbb: number;
  lunasCount: number;
  lunasNominal: number;
  belumLunasCount: number;
  belumLunasNominal: number;
  persentaseLunas: number;
  objekTunggakanCount: number;
  totalTunggakanNominal: number;
  pokokTunggakanNominal: number;
  dendaTunggakanNominal: number;
  rincianTahunTunggakan: { [tahun: number]: { count: number; total: number; pokok: number; denda: number } };
  totalBebanKeseluruhan: number;
  totalPenerimaanMasuk: number;
  sisaBebanTagihan: number;
}

export interface PbbKkSummary {
  kkId: string;
  noKk: string;
  namaKepala: string;
  nikKepala: string;
  rt: string;
  alamat: string;
  telepon: string;
  statusEkonomi?: string;
  jumlahAnggota: number;
  pbbItems: PbbRecord[];
  totalNop: number;
  totalNjop: number;
  tagihan2026: number;
  status2026: 'Lunas' | 'Belum Lunas' | 'Sebagian Lunas' | 'Nihil NOP';
  lunas2026Count: number;
  belumLunas2026Count: number;
  hasTunggakan: boolean;
  jumlahTahunTunggakan: number;
  totalNominalTunggakan: number;
  totalBebanKeseluruhan: number;
  riwayatTahun: Array<{
    tahun: number;
    nop: string;
    alamatObjek: string;
    namaPemilikShm: string;
    pokok: number;
    denda: number;
    total: number;
    status: 'Lunas' | 'Belum Lunas';
    tanggalBayar?: string;
    metodeBayar?: string;
    buktiBayarNo?: string;
    isTahunBerjalan: boolean;
    pbbRecord: PbbRecord;
    rawTunggakan?: TunggakanPbbItem;
  }>;
  statusPenagihan: 'Tunggakan Tahun Lalu' | 'Belum Bayar 2026' | 'Lunas Bersih' | 'Belum Ada Objek PBB';
}

export const PbbView: React.FC<PbbViewProps> = ({
  pbbList,
  profile,
  wargaList = [],
  kkList = [],
  currentUser,
  onSavePbb,
  onDeletePbb,
  onBayarPbb,
  onBayarTunggakan
}) => {
  const restrictedRt = getUserRestrictedRt(currentUser);

  // Scoped PBB, KK, and Warga lists for Ketua RT
  const scopedPbbList = useMemo(() => {
    if (!restrictedRt) return pbbList;
    return pbbList.filter((p) => isMatchingRt(p.rt, restrictedRt));
  }, [pbbList, restrictedRt]);

  const scopedWargaList = useMemo(() => {
    if (!restrictedRt) return wargaList;
    return wargaList.filter((w) => isMatchingRt(w.rt, restrictedRt));
  }, [wargaList, restrictedRt]);

  const scopedKkList = useMemo(() => {
    if (!restrictedRt) return kkList;
    return kkList.filter((k) => isMatchingRt(k.rt, restrictedRt));
  }, [kkList, restrictedRt]);

  // Sub-menu navigation state ('data' | 'riwayat_kk' | 'rekap_rt')
  const [activeSubTab, setActiveSubTab] = useState<'data' | 'riwayat_kk' | 'rekap_rt'>('data');
  const [printRekapModal, setPrintRekapModal] = useState<boolean>(false);
  const [activeRtDetailModal, setActiveRtDetailModal] = useState<string | null>(null);

  // Filters & search state for Tab 1 (Data PBB)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRt, setSelectedRt] = useState<string>(restrictedRt || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, Lunas, Belum Lunas, tunggakan
  const [selectedHak, setSelectedHak] = useState<string>('all');

  // Filters & search state for Tab 2 (Riwayat Pembayaran & Tunggakan per KK)
  const [kkSearchTerm, setKkSearchTerm] = useState('');
  const [kkSelectedRt, setKkSelectedRt] = useState<string>(restrictedRt || 'all');
  const [kkFilterStatus, setKkFilterStatus] = useState<string>('all'); // all, tunggakan, belum_2026, lunas
  const [expandedKkId, setExpandedKkId] = useState<string | null>(null);
  const [printKkNoticeData, setPrintKkNoticeData] = useState<PbbKkSummary | null>(null);
  const [copiedKkId, setCopiedKkId] = useState<string | null>(null);

  // Sync selected RT when login role changes
  useEffect(() => {
    if (restrictedRt) {
      setSelectedRt(restrictedRt);
      setKkSelectedRt(restrictedRt);
    } else {
      setSelectedRt('all');
      setKkSelectedRt('all');
    }
  }, [restrictedRt]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PbbRecord | null>(null);
  const [detailItem, setDetailItem] = useState<PbbRecord | null>(null);
  const [bayarItem, setBayarItem] = useState<PbbRecord | null>(null);
  const [tunggakanModalData, setTunggakanModalData] = useState<{
    pbb: PbbRecord;
    tunggakan: TunggakanPbbItem;
  } | null>(null);
  const [printReceiptItem, setPrintReceiptItem] = useState<PbbRecord | null>(null);

  // Form State for Add/Edit
  const initialFormState: Partial<PbbRecord> = {
    nop: '',
    namaWajibPajak: '',
    nikWajibPajak: '',
    noKk: '',
    rt: restrictedRt || '039',
    alamatObjek: '',
    namaPemilikShm: '',
    nikPemilikShm: '',
    noShm: '',
    noSuratUkur: '',
    statusHak: 'SHM (Hak Milik)',
    atasNamaSertifikat: '',
    tahunTerbitSertifikat: 2018,
    luasTanah: 200,
    luasBangunan: 100,
    njopTanahPerMeter: 600000,
    njopBangunanPerMeter: 1100000,
    totalNjop: 230000000,
    penggunaanBangunan: 'Rumah Tinggal',
    tahunPajak: 2026,
    tagihanPokok: 230000,
    denda: 0,
    totalTagihan: 230000,
    jatuhTempo: '2026-09-30',
    statusPembayaran: 'Belum Lunas',
    tunggakanTahunLalu: [],
    catatan: ''
  };
  const [formData, setFormData] = useState<Partial<PbbRecord>>(initialFormState);

  // Form state for Payment
  const [payFormData, setPayFormData] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    metodeBayar: 'Tunai Kolektif RW' as MetodeBayarPbb,
    buktiBayarNo: '',
    namaPenyetor: '',
    petugasKolektor: restrictedRt ? `Ketua RT ${restrictedRt}` : 'Kolektor PBB RW 018',
    catatan: ''
  });

  // Form state for Tunggakan Payment
  const [payTunggakanFormData, setPayTunggakanFormData] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    metodeBayar: 'Tunai Kolektif RW' as MetodeBayarPbb,
    kuitansiNo: ''
  });

  // PBB Aggregate per KK
  const pbbKkSummaries = useMemo<PbbKkSummary[]>(() => {
    const results: PbbKkSummary[] = [];
    const matchedPbbIds = new Set<string>();

    scopedKkList.forEach((kk) => {
      // Find matching PBB records for this KK
      const matchedPbb = scopedPbbList.filter((p) => {
        if (p.noKk && p.noKk === kk.noKk) return true;
        if (p.nikWajibPajak && (p.nikWajibPajak === kk.nikKepala || kk.anggotaIds?.includes(p.nikWajibPajak))) return true;
        if (p.nikPemilikShm && (p.nikPemilikShm === kk.nikKepala || kk.anggotaIds?.includes(p.nikPemilikShm))) return true;
        if (isMatchingRt(p.rt, kk.rt) && p.namaWajibPajak.toLowerCase() === kk.kepalaKeluarga.toLowerCase()) return true;
        if (isMatchingRt(p.rt, kk.rt) && p.namaPemilikShm.toLowerCase() === kk.kepalaKeluarga.toLowerCase()) return true;
        return false;
      });

      matchedPbb.forEach((p) => matchedPbbIds.add(p.id));

      const totalNop = matchedPbb.length;
      const totalNjop = matchedPbb.reduce((sum, p) => sum + (p.totalNjop || 0), 0);
      const tagihan2026 = matchedPbb.reduce((sum, p) => sum + (p.totalTagihan || 0), 0);
      const lunas2026Count = matchedPbb.filter((p) => p.statusPembayaran === 'Lunas').length;
      const belumLunas2026Count = matchedPbb.filter((p) => p.statusPembayaran === 'Belum Lunas').length;

      let status2026: 'Lunas' | 'Belum Lunas' | 'Sebagian Lunas' | 'Nihil NOP' = 'Nihil NOP';
      if (totalNop > 0) {
        if (lunas2026Count === totalNop) status2026 = 'Lunas';
        else if (belumLunas2026Count === totalNop) status2026 = 'Belum Lunas';
        else status2026 = 'Sebagian Lunas';
      }

      // Compile riwayatTahun across all matched PBB
      const riwayatTahun: PbbKkSummary['riwayatTahun'] = [];
      let totalNominalTunggakan = 0;
      let unpaidYearsCount = 0;

      matchedPbb.forEach((p) => {
        // Current tax year (2026)
        riwayatTahun.push({
          tahun: p.tahunPajak || 2026,
          nop: p.nop,
          alamatObjek: p.alamatObjek,
          namaPemilikShm: p.namaPemilikShm,
          pokok: p.tagihanPokok,
          denda: p.denda,
          total: p.totalTagihan,
          status: p.statusPembayaran,
          tanggalBayar: p.tanggalBayar,
          metodeBayar: p.metodeBayar,
          buktiBayarNo: p.buktiBayarNo,
          isTahunBerjalan: true,
          pbbRecord: p
        });

        // Arrears / tunggakan tahun lalu
        if (p.tunggakanTahunLalu && p.tunggakanTahunLalu.length > 0) {
          p.tunggakanTahunLalu.forEach((t) => {
            if (t.status === 'Belum Lunas') {
              totalNominalTunggakan += t.total;
              unpaidYearsCount += 1;
            }
            riwayatTahun.push({
              tahun: t.tahun,
              nop: p.nop,
              alamatObjek: p.alamatObjek,
              namaPemilikShm: p.namaPemilikShm,
              pokok: t.pokok,
              denda: t.denda,
              total: t.total,
              status: t.status,
              isTahunBerjalan: false,
              pbbRecord: p,
              rawTunggakan: t
            });
          });
        }
      });

      // Sort riwayat descending by tahun
      riwayatTahun.sort((a, b) => b.tahun - a.tahun);

      const hasTunggakan = unpaidYearsCount > 0;
      const sisaTagihan2026 = matchedPbb
        .filter((p) => p.statusPembayaran === 'Belum Lunas')
        .reduce((sum, p) => sum + p.totalTagihan, 0);
      const totalBebanKeseluruhan = sisaTagihan2026 + totalNominalTunggakan;

      let statusPenagihan: PbbKkSummary['statusPenagihan'] = 'Belum Ada Objek PBB';
      if (totalNop > 0) {
        if (hasTunggakan) {
          statusPenagihan = 'Tunggakan Tahun Lalu';
        } else if (belumLunas2026Count > 0) {
          statusPenagihan = 'Belum Bayar 2026';
        } else {
          statusPenagihan = 'Lunas Bersih';
        }
      }

      results.push({
        kkId: kk.id,
        noKk: kk.noKk,
        namaKepala: kk.kepalaKeluarga,
        nikKepala: kk.nikKepala,
        rt: kk.rt,
        alamat: kk.alamat,
        telepon: kk.telepon,
        statusEkonomi: kk.statusEkonomi,
        jumlahAnggota: kk.jumlahAnggota,
        pbbItems: matchedPbb,
        totalNop,
        totalNjop,
        tagihan2026,
        status2026,
        lunas2026Count,
        belumLunas2026Count,
        hasTunggakan,
        jumlahTahunTunggakan: unpaidYearsCount,
        totalNominalTunggakan,
        totalBebanKeseluruhan,
        riwayatTahun,
        statusPenagihan
      });
    });

    // Also handle any PBB records in scopedPbbList that weren't matched to existing KKs
    scopedPbbList.forEach((p) => {
      if (!matchedPbbIds.has(p.id)) {
        const riwayatTahun: PbbKkSummary['riwayatTahun'] = [
          {
            tahun: p.tahunPajak || 2026,
            nop: p.nop,
            alamatObjek: p.alamatObjek,
            namaPemilikShm: p.namaPemilikShm,
            pokok: p.tagihanPokok,
            denda: p.denda,
            total: p.totalTagihan,
            status: p.statusPembayaran,
            tanggalBayar: p.tanggalBayar,
            metodeBayar: p.metodeBayar,
            buktiBayarNo: p.buktiBayarNo,
            isTahunBerjalan: true,
            pbbRecord: p
          }
        ];

        let totalNominalTunggakan = 0;
        let unpaidYearsCount = 0;

        if (p.tunggakanTahunLalu && p.tunggakanTahunLalu.length > 0) {
          p.tunggakanTahunLalu.forEach((t) => {
            if (t.status === 'Belum Lunas') {
              totalNominalTunggakan += t.total;
              unpaidYearsCount += 1;
            }
            riwayatTahun.push({
              tahun: t.tahun,
              nop: p.nop,
              alamatObjek: p.alamatObjek,
              namaPemilikShm: p.namaPemilikShm,
              pokok: t.pokok,
              denda: t.denda,
              total: t.total,
              status: t.status,
              isTahunBerjalan: false,
              pbbRecord: p,
              rawTunggakan: t
            });
          });
        }

        riwayatTahun.sort((a, b) => b.tahun - a.tahun);
        const hasTunggakan = unpaidYearsCount > 0;
        const sisaTagihan2026 = p.statusPembayaran === 'Belum Lunas' ? p.totalTagihan : 0;
        const totalBebanKeseluruhan = sisaTagihan2026 + totalNominalTunggakan;

        const statusPenagihan: PbbKkSummary['statusPenagihan'] = hasTunggakan
          ? 'Tunggakan Tahun Lalu'
          : p.statusPembayaran === 'Belum Lunas'
          ? 'Belum Bayar 2026'
          : 'Lunas Bersih';

        results.push({
          kkId: `virtual-kk-${p.id}`,
          noKk: p.noKk || p.nikWajibPajak || `KK-${p.nop.replace(/[^0-9]/g, '').slice(-8)}`,
          namaKepala: p.namaWajibPajak,
          nikKepala: p.nikWajibPajak || '',
          rt: p.rt,
          alamat: p.alamatObjek,
          telepon: '',
          statusEkonomi: 'Menengah',
          jumlahAnggota: 1,
          pbbItems: [p],
          totalNop: 1,
          totalNjop: p.totalNjop,
          tagihan2026: p.totalTagihan,
          status2026: p.statusPembayaran,
          lunas2026Count: p.statusPembayaran === 'Lunas' ? 1 : 0,
          belumLunas2026Count: p.statusPembayaran === 'Belum Lunas' ? 1 : 0,
          hasTunggakan,
          jumlahTahunTunggakan: unpaidYearsCount,
          totalNominalTunggakan,
          totalBebanKeseluruhan,
          riwayatTahun,
          statusPenagihan
        });
      }
    });

    return results;
  }, [scopedKkList, scopedPbbList]);

  // Filtered KK summaries for Tab 2
  const filteredKkSummaries = useMemo(() => {
    return pbbKkSummaries.filter((item) => {
      const searchMatch =
        !kkSearchTerm.trim() ||
        item.noKk.toLowerCase().includes(kkSearchTerm.toLowerCase()) ||
        item.namaKepala.toLowerCase().includes(kkSearchTerm.toLowerCase()) ||
        item.alamat.toLowerCase().includes(kkSearchTerm.toLowerCase()) ||
        item.nikKepala.includes(kkSearchTerm) ||
        item.pbbItems.some((p) => p.nop.toLowerCase().includes(kkSearchTerm.toLowerCase()) || p.alamatObjek.toLowerCase().includes(kkSearchTerm.toLowerCase()));

      const rtMatch = restrictedRt
        ? isMatchingRt(item.rt, restrictedRt)
        : kkSelectedRt === 'all' || item.rt === kkSelectedRt || item.rt === kkSelectedRt.replace(/^0+/, '');

      let statusMatch = true;
      if (kkFilterStatus === 'tunggakan') {
        statusMatch = item.hasTunggakan;
      } else if (kkFilterStatus === 'belum_2026') {
        statusMatch = item.belumLunas2026Count > 0;
      } else if (kkFilterStatus === 'lunas') {
        statusMatch = item.statusPenagihan === 'Lunas Bersih';
      }

      return searchMatch && rtMatch && statusMatch;
    });
  }, [pbbKkSummaries, kkSearchTerm, kkSelectedRt, restrictedRt, kkFilterStatus]);

  // KK Metrics
  const kkMetrics = useMemo(() => {
    const totalKk = pbbKkSummaries.length;
    const kkMenunggak = pbbKkSummaries.filter((k) => k.hasTunggakan);
    const kkBelum2026 = pbbKkSummaries.filter((k) => k.belumLunas2026Count > 0);
    const kkLunasBersih = pbbKkSummaries.filter((k) => k.statusPenagihan === 'Lunas Bersih');

    const totalNominalTunggakanAll = pbbKkSummaries.reduce((sum, k) => sum + k.totalNominalTunggakan, 0);
    const totalSisa2026All = pbbKkSummaries.reduce(
      (sum, k) =>
        sum +
        k.pbbItems.filter((p) => p.statusPembayaran === 'Belum Lunas').reduce((s, p) => s + p.totalTagihan, 0),
      0
    );
    const totalBebanPenagihanAll = totalNominalTunggakanAll + totalSisa2026All;

    const persentaseLunasBersih = totalKk > 0 ? Math.round((kkLunasBersih.length / totalKk) * 100) : 0;

    return {
      totalKk,
      kkMenunggakCount: kkMenunggak.length,
      kkBelum2026Count: kkBelum2026.length,
      kkLunasBersihCount: kkLunasBersih.length,
      totalNominalTunggakanAll,
      totalSisa2026All,
      totalBebanPenagihanAll,
      persentaseLunasBersih
    };
  }, [pbbKkSummaries]);

  // Copy helper
  const handleCopyNoKk = (noKk: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(noKk);
      setCopiedKkId(id);
      setTimeout(() => setCopiedKkId(null), 2000);
    }
  };

  // WhatsApp Reminder helper for Ketua RT
  const handleShareWaReminder = (item: PbbKkSummary) => {
    const unpaidRows = item.riwayatTahun.filter((r) => r.status === 'Belum Lunas');
    const tunggakanText = unpaidRows
      .map(
        (r) =>
          `• Tahun ${r.tahun} (NOP: ${r.nop}) : Pokok Rp ${r.pokok.toLocaleString('id-ID')}` +
          (r.denda > 0 ? ` + Denda Rp ${r.denda.toLocaleString('id-ID')}` : '') +
          ` = *Rp ${r.total.toLocaleString('id-ID')}*`
      )
      .join('\n');

    const pesan =
      `*PEMBERITAHUAN KEWAJIBAN & TUNGGAKAN PBB-P2*\n` +
      `*RUKUN WARGA 018 KELURAHAN IRINGMULYO*\n\n` +
      `Kepada Yth. Bpk/Ibu *${item.namaKepala}*\n` +
      `No. KK: ${item.noKk}\n` +
      `Alamat: ${item.alamat} (RT ${item.rt})\n\n` +
      `Salam hangat dari Pengurus RT ${item.rt} RW 018.\n` +
      `Berikut rincian kewajiban Pajak Bumi dan Bangunan (PBB-P2) yang belum diselesaikan:\n\n` +
      `${tunggakanText || '• Tidak ada tagihan tertunggak'}\n\n` +
      `*TOTAL TAGIHAN DILUNASI: ${formatRupiah(item.totalBebanKeseluruhan)}*\n\n` +
      `Pembayaran dapat disalurkan secara kolektif melalui Ketua RT ${item.rt} / Kolektor RW 018 atau via Transfer Bank Lampung / QRIS Bapenda.\n\n` +
      `Terima kasih atas kepedulian dan partisipasi Bpk/Ibu dalam pembangunan lingkungan RW 018 Iringmulyo.\n\n` +
      `_Pengurus RT ${item.rt} & Ketua RW 018 (${profile.namaKetuaRw})_`;

    const encoded = encodeURIComponent(pesan);
    const cleanPhone = item.telepon ? item.telepon.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // Export KK Summaries
  const handleExportKkExcel = () => {
    const scopeLabel = kkSelectedRt === 'all' ? 'Semua_RT' : `RT_${kkSelectedRt}`;
    const exportItems: PbbKkSummaryExportItem[] = filteredKkSummaries.map((k) => ({
      noKk: k.noKk,
      namaKepala: k.namaKepala,
      rt: k.rt,
      alamat: k.alamat,
      telepon: k.telepon,
      statusEkonomi: k.statusEkonomi,
      jumlahNop: k.totalNop,
      daftarNop: k.pbbItems.map((p) => p.nop).join(', '),
      totalNjop: k.totalNjop,
      tagihan2026: k.tagihan2026,
      status2026: k.status2026,
      jumlahTahunTunggakan: k.jumlahTahunTunggakan,
      rincianTahunTunggakan: k.riwayatTahun
        .filter((r) => r.status === 'Belum Lunas')
        .map((r) => `${r.tahun}: ${formatRupiah(r.total)}`)
        .join('; '),
      totalNominalTunggakan: k.totalNominalTunggakan,
      totalBebanKeseluruhan: k.totalBebanKeseluruhan,
      statusPenagihan: k.statusPenagihan
    }));
    exportPbbKk(exportItems, 'xlsx', scopeLabel, profile);
  };

  const handleExportKkCSV = () => {
    const scopeLabel = kkSelectedRt === 'all' ? 'Semua_RT' : `RT_${kkSelectedRt}`;
    const exportItems: PbbKkSummaryExportItem[] = filteredKkSummaries.map((k) => ({
      noKk: k.noKk,
      namaKepala: k.namaKepala,
      rt: k.rt,
      alamat: k.alamat,
      telepon: k.telepon,
      statusEkonomi: k.statusEkonomi,
      jumlahNop: k.totalNop,
      daftarNop: k.pbbItems.map((p) => p.nop).join(', '),
      totalNjop: k.totalNjop,
      tagihan2026: k.tagihan2026,
      status2026: k.status2026,
      jumlahTahunTunggakan: k.jumlahTahunTunggakan,
      rincianTahunTunggakan: k.riwayatTahun
        .filter((r) => r.status === 'Belum Lunas')
        .map((r) => `${r.tahun}: ${formatRupiah(r.total)}`)
        .join('; '),
      totalNominalTunggakan: k.totalNominalTunggakan,
      totalBebanKeseluruhan: k.totalBebanKeseluruhan,
      statusPenagihan: k.statusPenagihan
    }));
    exportPbbKk(exportItems, 'csv', scopeLabel, profile);
  };

  // Filtering Logic (strictly uses scopedPbbList)
  const filteredList = useMemo(() => {
    return scopedPbbList.filter((item) => {
      // Search matches NOP, Wajib Pajak, Pemilik SHM, No SHM, or Alamat
      const searchMatch =
        !searchTerm.trim() ||
        item.nop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaWajibPajak.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaPemilikShm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.noShm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alamatObjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nikWajibPajak && item.nikWajibPajak.includes(searchTerm)) ||
        (item.atasNamaSertifikat && item.atasNamaSertifikat.toLowerCase().includes(searchTerm.toLowerCase()));

      // RT filter
      const rtMatch = restrictedRt
        ? isMatchingRt(item.rt, restrictedRt)
        : selectedRt === 'all' || item.rt === selectedRt || item.rt === selectedRt.replace(/^0+/, '');

      // Status filter
      let statusMatch = true;
      if (selectedStatus === 'Lunas') {
        statusMatch = item.statusPembayaran === 'Lunas';
      } else if (selectedStatus === 'Belum Lunas') {
        statusMatch = item.statusPembayaran === 'Belum Lunas';
      } else if (selectedStatus === 'tunggakan') {
        statusMatch = item.tunggakanTahunLalu.some((t) => t.status === 'Belum Lunas');
      }

      // Hak Tanah filter
      const hakMatch = selectedHak === 'all' || item.statusHak === selectedHak;

      return searchMatch && rtMatch && statusMatch && hakMatch;
    });
  }, [scopedPbbList, searchTerm, selectedRt, restrictedRt, selectedStatus, selectedHak]);

  // Real-time Metrics Calculations (strictly based on scopedPbbList)
  const metrics = useMemo(() => {
    const totalRecords = scopedPbbList.length;
    const lunasRecords = scopedPbbList.filter((p) => p.statusPembayaran === 'Lunas');
    const belumLunasRecords = scopedPbbList.filter((p) => p.statusPembayaran === 'Belum Lunas');

    const totalTagihanTahunIni = scopedPbbList.reduce((acc, curr) => acc + curr.totalTagihan, 0);
    const nominalLunasTahunIni = lunasRecords.reduce((acc, curr) => acc + curr.totalTagihan, 0);
    const nominalBelumLunasTahunIni = belumLunasRecords.reduce((acc, curr) => acc + curr.totalTagihan, 0);

    // Calculate tunggakan tahun lalu
    let totalNominalTunggakan = 0;
    let totalObjekTertunggak = 0;

    scopedPbbList.forEach((p) => {
      const unpaidTgk = p.tunggakanTahunLalu.filter((t) => t.status === 'Belum Lunas');
      if (unpaidTgk.length > 0) {
        totalObjekTertunggak++;
        totalNominalTunggakan += unpaidTgk.reduce((sum, item) => sum + item.total, 0);
      }
    });

    const persentaseLunas = totalTagihanTahunIni > 0
      ? Math.round((nominalLunasTahunIni / totalTagihanTahunIni) * 100)
      : 0;

    return {
      totalRecords,
      countLunas: lunasRecords.length,
      countBelumLunas: belumLunasRecords.length,
      totalTagihanTahunIni,
      nominalLunasTahunIni,
      nominalBelumLunasTahunIni,
      totalObjekTertunggak,
      totalNominalTunggakan,
      persentaseLunas
    };
  }, [scopedPbbList]);

  // Breakdown Per RT Calculations (Target PBB 2026 & Tagihan Tunggakan Total per RT)
  const rtSummaries = useMemo<RtPbbSummary[]>(() => {
    const baseRts = restrictedRt ? [restrictedRt] : ['039', '040', '041', '042'];
    const allRts = restrictedRt
      ? [restrictedRt]
      : Array.from(new Set([...baseRts, ...scopedPbbList.map((p) => p.rt)])).sort();

    return allRts.map((rt) => {
      const itemsInRt = scopedPbbList.filter((p) => isMatchingRt(p.rt, rt));
      const totalNop = itemsInRt.length;
      const totalNjop = itemsInRt.reduce((acc, curr) => acc + curr.totalNjop, 0);

      const targetPbb = itemsInRt.reduce((acc, curr) => acc + curr.totalTagihan, 0);
      const pokokPbb = itemsInRt.reduce((acc, curr) => acc + curr.tagihanPokok, 0);

      const lunasItems = itemsInRt.filter((p) => p.statusPembayaran === 'Lunas');
      const belumLunasItems = itemsInRt.filter((p) => p.statusPembayaran === 'Belum Lunas');

      const lunasCount = lunasItems.length;
      const lunasNominal = lunasItems.reduce((acc, curr) => acc + curr.totalTagihan, 0);

      const belumLunasCount = belumLunasItems.length;
      const belumLunasNominal = belumLunasItems.reduce((acc, curr) => acc + curr.totalTagihan, 0);

      const persentaseLunas = targetPbb > 0 ? Math.round((lunasNominal / targetPbb) * 100) : 0;

      let objekTunggakanCount = 0;
      let totalTunggakanNominal = 0;
      let pokokTunggakanNominal = 0;
      let dendaTunggakanNominal = 0;
      const rincianTahunTunggakan: { [tahun: number]: { count: number; total: number; pokok: number; denda: number } } = {};

      itemsInRt.forEach((p) => {
        const unpaid = p.tunggakanTahunLalu.filter((t) => t.status === 'Belum Lunas');
        if (unpaid.length > 0) {
          objekTunggakanCount++;
          unpaid.forEach((tgk) => {
            totalTunggakanNominal += tgk.total;
            pokokTunggakanNominal += tgk.pokok;
            dendaTunggakanNominal += tgk.denda;

            if (!rincianTahunTunggakan[tgk.tahun]) {
              rincianTahunTunggakan[tgk.tahun] = { count: 0, total: 0, pokok: 0, denda: 0 };
            }
            rincianTahunTunggakan[tgk.tahun].count++;
            rincianTahunTunggakan[tgk.tahun].total += tgk.total;
            rincianTahunTunggakan[tgk.tahun].pokok += tgk.pokok;
            rincianTahunTunggakan[tgk.tahun].denda += tgk.denda;
          });
        }
      });

      const totalBebanKeseluruhan = targetPbb + totalTunggakanNominal;
      const totalPenerimaanMasuk = lunasNominal;
      const sisaBebanTagihan = belumLunasNominal + totalTunggakanNominal;

      return {
        rt,
        totalNop,
        totalNjop,
        targetPbb,
        pokokPbb,
        lunasCount,
        lunasNominal,
        belumLunasCount,
        belumLunasNominal,
        persentaseLunas,
        objekTunggakanCount,
        totalTunggakanNominal,
        pokokTunggakanNominal,
        dendaTunggakanNominal,
        rincianTahunTunggakan,
        totalBebanKeseluruhan,
        totalPenerimaanMasuk,
        sisaBebanTagihan
      };
    });
  }, [scopedPbbList, restrictedRt]);

  // Grand Total Accumulation for Entire RW 018
  const grandTotalSummary = useMemo(() => {
    return rtSummaries.reduce(
      (acc, curr) => ({
        totalNop: acc.totalNop + curr.totalNop,
        totalNjop: acc.totalNjop + curr.totalNjop,
        targetPbb: acc.targetPbb + curr.targetPbb,
        pokokPbb: acc.pokokPbb + curr.pokokPbb,
        lunasCount: acc.lunasCount + curr.lunasCount,
        lunasNominal: acc.lunasNominal + curr.lunasNominal,
        belumLunasCount: acc.belumLunasCount + curr.belumLunasCount,
        belumLunasNominal: acc.belumLunasNominal + curr.belumLunasNominal,
        objekTunggakanCount: acc.objekTunggakanCount + curr.objekTunggakanCount,
        totalTunggakanNominal: acc.totalTunggakanNominal + curr.totalTunggakanNominal,
        pokokTunggakanNominal: acc.pokokTunggakanNominal + curr.pokokTunggakanNominal,
        dendaTunggakanNominal: acc.dendaTunggakanNominal + curr.dendaTunggakanNominal,
        totalBebanKeseluruhan: acc.totalBebanKeseluruhan + curr.totalBebanKeseluruhan,
        totalPenerimaanMasuk: acc.totalPenerimaanMasuk + curr.totalPenerimaanMasuk,
        sisaBebanTagihan: acc.sisaBebanTagihan + curr.sisaBebanTagihan
      }),
      {
        totalNop: 0,
        totalNjop: 0,
        targetPbb: 0,
        pokokPbb: 0,
        lunasCount: 0,
        lunasNominal: 0,
        belumLunasCount: 0,
        belumLunasNominal: 0,
        objekTunggakanCount: 0,
        totalTunggakanNominal: 0,
        pokokTunggakanNominal: 0,
        dendaTunggakanNominal: 0,
        totalBebanKeseluruhan: 0,
        totalPenerimaanMasuk: 0,
        sisaBebanTagihan: 0
      }
    );
  }, [rtSummaries]);

  const grandPersentaseLunas = grandTotalSummary.targetPbb > 0
    ? Math.round((grandTotalSummary.lunasNominal / grandTotalSummary.targetPbb) * 100)
    : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nop: `18.72.030.004.018-00${scopedPbbList.length + 1}.0`,
      namaWajibPajak: '',
      nikWajibPajak: '',
      noKk: '',
      rt: restrictedRt || (selectedRt !== 'all' ? selectedRt : '039'),
      alamatObjek: '',
      namaPemilikShm: '',
      nikPemilikShm: '',
      noShm: '',
      noSuratUkur: '',
      statusHak: 'SHM (Hak Milik)',
      atasNamaSertifikat: '',
      tahunTerbitSertifikat: 2018,
      luasTanah: 200,
      luasBangunan: 100,
      njopTanahPerMeter: 600000,
      njopBangunanPerMeter: 1100000,
      totalNjop: 230000000,
      penggunaanBangunan: 'Rumah Tinggal',
      tahunPajak: 2026,
      tagihanPokok: 230000,
      denda: 0,
      totalTagihan: 230000,
      jatuhTempo: '2026-09-30',
      statusPembayaran: 'Belum Lunas',
      tunggakanTahunLalu: [],
      catatan: ''
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PbbRecord) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowAddModal(true);
  };

  // Calculate NJOP and Tax Bill on input change
  const handleTanahBangunanChange = (
    luasT: number,
    luasB: number,
    njopT: number,
    njopB: number
  ) => {
    const total = luasT * njopT + luasB * njopB;
    // Estimated PBB P2 tax rate (~0.1% for Metro after deduction)
    const estimasiPokok = Math.max(0, Math.round(total * 0.001));
    setFormData((prev) => ({
      ...prev,
      luasTanah: luasT,
      luasBangunan: luasB,
      njopTanahPerMeter: njopT,
      njopBangunanPerMeter: njopB,
      totalNjop: total,
      tagihanPokok: estimasiPokok,
      totalTagihan: estimasiPokok + (prev.denda || 0)
    }));
  };

  // Save Add/Edit PBB
  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nop || !formData.namaWajibPajak || !formData.namaPemilikShm) {
      alert('Mohon lengkapi NOP, Nama Wajib Pajak, dan Nama Pemilik SHM.');
      return;
    }

    const itemToSave: PbbRecord = {
      id: editingItem ? editingItem.id : `pbb-${Date.now()}`,
      nop: formData.nop || '',
      namaWajibPajak: formData.namaWajibPajak || '',
      nikWajibPajak: formData.nikWajibPajak || '',
      noKk: formData.noKk || '',
      rt: restrictedRt || formData.rt || '039',
      alamatObjek: formData.alamatObjek || '',
      namaPemilikShm: formData.namaPemilikShm || '',
      nikPemilikShm: formData.nikPemilikShm || '',
      noShm: formData.noShm || '',
      noSuratUkur: formData.noSuratUkur || '',
      statusHak: (formData.statusHak as StatusHakTanah) || 'SHM (Hak Milik)',
      atasNamaSertifikat: formData.atasNamaSertifikat || '',
      tahunTerbitSertifikat: Number(formData.tahunTerbitSertifikat) || 2018,
      luasTanah: Number(formData.luasTanah) || 0,
      luasBangunan: Number(formData.luasBangunan) || 0,
      njopTanahPerMeter: Number(formData.njopTanahPerMeter) || 0,
      njopBangunanPerMeter: Number(formData.njopBangunanPerMeter) || 0,
      totalNjop: Number(formData.totalNjop) || 0,
      penggunaanBangunan: formData.penggunaanBangunan || 'Rumah Tinggal',
      tahunPajak: Number(formData.tahunPajak) || 2026,
      tagihanPokok: Number(formData.tagihanPokok) || 0,
      denda: Number(formData.denda) || 0,
      totalTagihan: Number(formData.totalTagihan) || Number(formData.tagihanPokok) || 0,
      jatuhTempo: formData.jatuhTempo || '2026-09-30',
      statusPembayaran: (formData.statusPembayaran as StatusBayarPbb) || 'Belum Lunas',
      tanggalBayar: formData.tanggalBayar,
      metodeBayar: formData.metodeBayar as MetodeBayarPbb,
      buktiBayarNo: formData.buktiBayarNo,
      namaPenyetor: formData.namaPenyetor,
      petugasKolektor: formData.petugasKolektor,
      tunggakanTahunLalu: formData.tunggakanTahunLalu || [],
      catatan: formData.catatan || '',
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().split('T')[0]
    };

    onSavePbb(itemToSave);
    setShowAddModal(false);
    setEditingItem(null);
  };

  // Open Payment Modal
  const handleOpenBayar = (item: PbbRecord) => {
    setBayarItem(item);
    setPayFormData({
      tanggalBayar: new Date().toISOString().split('T')[0],
      metodeBayar: 'Tunai Kolektif RW',
      buktiBayarNo: `NTPN-1872-${Date.now().toString().slice(-8)}`,
      namaPenyetor: item.namaWajibPajak,
      petugasKolektor: 'Kolektor PBB RW 018',
      catatan: 'Pembayaran SPPT PBB Tahun Berjalan ' + item.tahunPajak
    });
  };

  // Submit Payment for Current Year
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayarItem) return;

    onBayarPbb(bayarItem.id, {
      tanggalBayar: payFormData.tanggalBayar,
      metodeBayar: payFormData.metodeBayar,
      buktiBayarNo: payFormData.buktiBayarNo,
      namaPenyetor: payFormData.namaPenyetor,
      petugasKolektor: payFormData.petugasKolektor,
      catatan: payFormData.catatan
    });

    setBayarItem(null);
  };

  // Open Tunggakan Payment Modal
  const handleOpenBayarTunggakan = (pbb: PbbRecord, tunggakan: TunggakanPbbItem) => {
    setTunggakanModalData({ pbb, tunggakan });
    setPayTunggakanFormData({
      tanggalBayar: new Date().toISOString().split('T')[0],
      metodeBayar: 'Tunai Kolektif RW',
      kuitansiNo: `TGK-${tunggakan.tahun}-${Date.now().toString().slice(-4)}`
    });
  };

  // Submit Tunggakan Payment
  const handleSubmitTunggakanPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tunggakanModalData) return;

    onBayarTunggakan(
      tunggakanModalData.pbb.id,
      tunggakanModalData.tunggakan.tahun,
      {
        tanggalBayar: payTunggakanFormData.tanggalBayar,
        metodeBayar: payTunggakanFormData.metodeBayar,
        kuitansiNo: payTunggakanFormData.kuitansiNo
      }
    );

    setTunggakanModalData(null);
    if (detailItem && detailItem.id === tunggakanModalData.pbb.id) {
      // Refresh detail item
      const updated = pbbList.find((p) => p.id === detailItem.id);
      if (updated) setDetailItem(updated);
    }
  };

  // Delete PBB Record with confirmation
  const handleDeleteConfirm = (id: string, nop: string, wp: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data PBB NOP: ${nop} atas nama ${wp}?`)) {
      onDeletePbb(id);
      if (detailItem?.id === id) setDetailItem(null);
    }
  };

  const handleExportExcel = () => {
    const scopeLabel = selectedRt === 'all' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportPbb(filteredList, 'xlsx', scopeLabel, profile);
  };

  const handleExportCSV = () => {
    const scopeLabel = selectedRt === 'all' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportPbb(filteredList, 'csv', scopeLabel, profile);
  };

  // Auto-fill from selected warga
  const handleSelectWargaForForm = (wargaId: string) => {
    const selected = wargaList.find((w) => w.id === wargaId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        namaWajibPajak: selected.nama,
        nikWajibPajak: selected.nik,
        noKk: selected.noKk,
        rt: selected.rt,
        alamatObjek: selected.alamat,
        namaPemilikShm: selected.nama,
        nikPemilikShm: selected.nik,
        atasNamaSertifikat: selected.nama
      }));
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0 shadow-inner">
              <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {restrictedRt ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold text-[10px] tracking-wider uppercase border border-blue-400/40 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-blue-300" />
                    <span>Akses Terkunci RT {restrictedRt}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-400/30">
                    Modul Pengurus RW 018
                  </span>
                )}
                <span className="text-xs text-emerald-200">
                  Tahun Pajak {profile.periodeJabatan ? profile.periodeJabatan.slice(0, 4) : '2026'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {restrictedRt ? `Data PBB & Pemilik SHM RT ${restrictedRt}` : 'Data PBB & Pemilik SHM RW 018'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
                {restrictedRt
                  ? `Pengelolaan Pajak Bumi dan Bangunan (PBB-P2) dan Sertifikat Hak Milik (SHM) khusus wilayah RT ${restrictedRt} RW 018 Kelurahan Iringmulyo Metro Timur.`
                  : 'Pengelolaan Pajak Bumi dan Bangunan (PBB-P2), Sertifikat Hak Milik (SHM), Tagihan Tahun Berjalan, dan Rekapitulasi Tunggakan Warga Wilayah RT 039 s.d. RT 042 Kelurahan Iringmulyo Metro Timur.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
            <ExportButton
              label="Ekspor PBB"
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCSV}
              variant="subtle"
            />
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 rounded-xl text-xs font-black shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{restrictedRt ? `Tambah PBB RT ${restrictedRt}` : 'Tambah Data PBB & SHM'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Summary Cards inside Header Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
              <span>{restrictedRt ? `Total Objek RT ${restrictedRt}` : 'Total Objek Pajak'}</span>
              <Building2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {metrics.totalRecords}{' '}
              <span className="text-xs font-medium text-emerald-200">NOP</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">
              Total NJOP: {formatRupiah(scopedPbbList.reduce((sum, p) => sum + p.totalNjop, 0))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
              <span>PBB Lunas 2026</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {metrics.countLunas}{' '}
              <span className="text-xs font-medium text-emerald-200">
                ({metrics.persentaseLunas}%)
              </span>
            </div>
            <div className="text-[10px] text-emerald-200 mt-1">
              Terkumpul: <strong className="text-white">{formatRupiah(metrics.nominalLunasTahunIni)}</strong>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider flex items-center justify-between">
              <span>Belum Lunas 2026</span>
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {metrics.countBelumLunas}{' '}
              <span className="text-xs font-medium text-amber-100">NOP</span>
            </div>
            <div className="text-[10px] text-amber-200 mt-1">
              Sisa Tagihan: <strong className="text-white">{formatRupiah(metrics.nominalBelumLunasTahunIni)}</strong>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-rose-200 uppercase tracking-wider flex items-center justify-between">
              <span>Tunggakan Tahun Lalu</span>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">
              {metrics.totalObjekTertunggak}{' '}
              <span className="text-xs font-medium text-rose-200">Objek</span>
            </div>
            <div className="text-[10px] text-rose-200 mt-1">
              Total: <strong className="text-white">{formatRupiah(metrics.totalNominalTunggakan)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Menu Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="subtab-pbb-data"
            onClick={() => setActiveSubTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeSubTab === 'data'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeSubTab === 'data' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>{restrictedRt ? `Data PBB RT ${restrictedRt}` : 'Data PBB & SHM Warga'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeSubTab === 'data'
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {scopedPbbList.length} NOP
            </span>
          </button>

          <button
            id="subtab-pbb-riwayat-kk"
            onClick={() => setActiveSubTab('riwayat_kk')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeSubTab === 'riwayat_kk'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Users className={`w-4 h-4 ${activeSubTab === 'riwayat_kk' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>{restrictedRt ? `Riwayat & Tunggakan KK RT ${restrictedRt}` : 'Riwayat PBB & Tunggakan per KK'}</span>
            {kkMetrics.kkMenunggakCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                {kkMetrics.kkMenunggakCount} KK Nunggak
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeSubTab === 'riwayat_kk'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pbbKkSummaries.length} KK
              </span>
            )}
          </button>

          <button
            id="subtab-pbb-rekap-rt"
            onClick={() => setActiveSubTab('rekap_rt')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeSubTab === 'rekap_rt'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeSubTab === 'rekap_rt' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>{restrictedRt ? `Target & Tunggakan RT ${restrictedRt}` : 'Rincian Target PBB & Tunggakan per RT'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeSubTab === 'rekap_rt'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {restrictedRt ? `RT ${restrictedRt}` : '4 RT'}
            </span>
          </button>
        </div>

        {activeSubTab === 'riwayat_kk' && (
          <div className="flex items-center gap-2 ml-auto">
            <ExportButton
              label="Ekspor Rekap KK"
              onExportExcel={handleExportKkExcel}
              onExportCsv={handleExportKkCSV}
              variant="subtle"
            />
          </div>
        )}

        {activeSubTab === 'rekap_rt' && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="btn-print-rekap-rt"
              onClick={() => setPrintRekapModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak Rekapitulasi</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB-MENU TAB 1: DATA PBB & SHM */}
      {activeSubTab === 'data' && (
        <>
          {/* Filter & Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari NOP, Nama WP, Pemilik SHM, No. SHM, atau Alamat Objek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedStatus === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({scopedPbbList.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('Lunas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedStatus === 'Lunas'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Lunas ({metrics.countLunas})
                </button>
                <button
                  onClick={() => setSelectedStatus('Belum Lunas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedStatus === 'Belum Lunas'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Belum Lunas ({metrics.countBelumLunas})
                </button>
                <button
                  onClick={() => setSelectedStatus('tunggakan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedStatus === 'tunggakan'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Ada Tunggakan ({metrics.totalObjekTertunggak})
                </button>
              </div>
            </div>

            {/* Dropdown Filters (RT & Hak Tanah) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              {restrictedRt ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Wilayah: RT {restrictedRt}</span>
                </div>
              ) : (
                <select
                  value={selectedRt}
                  onChange={(e) => setSelectedRt(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Semua Wilayah RT (039 - 042)</option>
                  <option value="039">RT 039</option>
                  <option value="040">RT 040</option>
                  <option value="041">RT 041</option>
                  <option value="042">RT 042</option>
                </select>
              )}

              <select
                value={selectedHak}
                onChange={(e) => setSelectedHak(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Status Hak Tanah</option>
                <option value="SHM (Hak Milik)">SHM (Hak Milik)</option>
                <option value="HGB (Hak Guna Bangunan)">HGB (Hak Guna Bangunan)</option>
                <option value="Hak Pakai">Hak Pakai</option>
                <option value="Girik / Letter C">Girik / Letter C</option>
                <option value="Tanah Wakaf">Tanah Wakaf</option>
              </select>

              <span className="text-slate-400 ml-auto">
                Menampilkan <strong>{filteredList.length}</strong> dari {scopedPbbList.length} data PBB
              </span>
            </div>
          </div>

          {/* PBB Data Table & Card List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Landmark className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Tidak ada data PBB ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada data yang sesuai dengan kata kunci pencarian atau filter yang Anda pilih.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRt('all');
                    setSelectedStatus('all');
                    setSelectedHak('all');
                  }}
                  className="mt-3 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Objek PBB & NOP</th>
                      <th className="py-3.5 px-4">Pemilik SHM & Sertifikat</th>
                      <th className="py-3.5 px-4">Luas & NJOP</th>
                      <th className="py-3.5 px-4">Tagihan 2026</th>
                      <th className="py-3.5 px-4">Status & Pembayaran</th>
                      <th className="py-3.5 px-4">Tunggakan</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item) => {
                      const hasUnpaidTunggakan = item.tunggakanTahunLalu.some((t) => t.status === 'Belum Lunas');
                      const totalTunggakanNominal = item.tunggakanTahunLalu
                        .filter((t) => t.status === 'Belum Lunas')
                        .reduce((sum, t) => sum + t.total, 0);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Objek PBB & NOP */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-mono text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1 border border-emerald-200">
                              {item.nop}
                            </div>
                            <div className="font-bold text-slate-800 text-xs">{item.namaWajibPajak}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{item.alamatObjek}</span>
                            </div>
                            <div className="mt-1">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                RT {item.rt}
                              </span>
                              <span className="ml-1 text-[10px] text-slate-500">
                                • {item.penggunaanBangunan}
                              </span>
                            </div>
                          </td>

                          {/* Pemilik SHM & Sertifikat */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{item.namaPemilikShm}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                              {item.noShm || 'SHM Belum Tercatat'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {item.noSuratUkur ? `SU: ${item.noSuratUkur}` : 'Hak Milik'}
                            </div>
                            <div className="mt-1">
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                                {item.statusHak}
                              </span>
                            </div>
                          </td>

                          {/* Luas & NJOP */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-[11px] text-slate-700">
                              Tanah: <strong>{item.luasTanah} m²</strong>
                            </div>
                            <div className="text-[11px] text-slate-700">
                              Bangunan: <strong>{item.luasBangunan} m²</strong>
                            </div>
                            <div className="text-[11px] font-bold text-slate-900 mt-1">
                              NJOP: {formatRupiah(item.totalNjop)}
                            </div>
                          </td>

                          {/* Tagihan 2026 */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-sm font-black text-slate-900">
                              {formatRupiah(item.totalTagihan)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Pokok: {formatRupiah(item.tagihanPokok)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Jatuh Tempo: {item.jatuhTempo}
                            </div>
                          </td>

                          {/* Status & Pembayaran */}
                          <td className="py-3.5 px-4 align-top">
                            {item.statusPembayaran === 'Lunas' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Lunas
                                </span>
                                <div className="text-[10px] text-slate-600 mt-1">
                                  Tgl: {item.tanggalBayar ? formatTanggalIndo(item.tanggalBayar) : '-'}
                                </div>
                                <div className="text-[9px] text-slate-500">
                                  via {item.metodeBayar || 'Kolektif RW'}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Belum Lunas
                                </span>
                                <button
                                  onClick={() => handleOpenBayar(item)}
                                  className="mt-1.5 flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg font-bold text-[10px] shadow-2xs transition-all"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Bayar PBB</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Tunggakan */}
                          <td className="py-3.5 px-4 align-top">
                            {hasUnpaidTunggakan ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  {item.tunggakanTahunLalu.filter((t) => t.status === 'Belum Lunas').length} Tahun
                                </span>
                                <div className="text-[10px] font-bold text-rose-700 mt-1">
                                  {formatRupiah(totalTunggakanNominal)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Nihil
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 align-top text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDetailItem(item)}
                                title="Lihat Detail SHM & PBB"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrintReceiptItem(item)}
                                title="Cetak Tanda Terima PBB"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-800 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Data PBB & SHM"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(item.id, item.nop, item.namaWajibPajak)}
                                title="Hapus Data"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* SUB-MENU TAB 2: RINGKASAN RIWAYAT PEMBAYARAN & TUNGGAKAN PER KK */}
      {activeSubTab === 'riwayat_kk' && (
        <div className="space-y-5">
          {/* Executive Summary Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Users className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {restrictedRt
                      ? `Ringkasan Riwayat Pembayaran & Tunggakan KK RT ${restrictedRt}`
                      : 'Ringkasan Riwayat Pembayaran & Tunggakan PBB per Kartu Keluarga (KK)'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  Modul kendali penagihan bagi Ketua RT dan Pengurus RW. Menampilkan histori pembayaran pajak per KK,
                  daftar kepemilikan NOP/SHM, serta mendeteksi KK yang memiliki tunggakan tahun sebelumnya untuk
                  memudahkan penagihan langsung dan cetak surat pemberitahuan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <ExportButton
                  label="Ekspor Riwayat KK"
                  onExportExcel={handleExportKkExcel}
                  onExportCsv={handleExportKkCSV}
                  variant="primary"
                />
              </div>
            </div>

            {/* 4 Financial & Compliance Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
                  <span>Total KK Terdata</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {kkMetrics.totalKk}{' '}
                  <span className="text-xs font-normal text-slate-500">KK</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Total {scopedPbbList.length} NOP terdistribusi
                </div>
              </div>

              <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 uppercase">
                  <span>🚨 Memiliki Tunggakan</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl font-black text-rose-800 mt-1">
                  {kkMetrics.kkMenunggakCount}{' '}
                  <span className="text-xs font-bold text-rose-700">KK</span>
                </div>
                <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                  Total Piutang: {formatRupiah(kkMetrics.totalNominalTunggakanAll)}
                </div>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 uppercase">
                  <span>Belum Bayar 2026</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-amber-900 mt-1">
                  {kkMetrics.kkBelum2026Count}{' '}
                  <span className="text-xs font-normal text-amber-700">KK</span>
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">
                  Sisa Tagihan 2026: {formatRupiah(kkMetrics.totalSisa2026All)}
                </div>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase">
                  <span>Lunas Bersih</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-800 mt-1">
                  {kkMetrics.kkLunasBersihCount}{' '}
                  <span className="text-xs font-normal text-emerald-700">
                    ({kkMetrics.persentaseLunasBersih}%)
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">
                  Bebas dari segala tunggakan pajak
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Control Bar for KK */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No. KK, Nama Kepala Keluarga, NIK, NOP, atau Alamat..."
                  value={kkSearchTerm}
                  onChange={(e) => setKkSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* RT Filter for RW Admin (Locked for Ketua RT) */}
              <div className="flex items-center gap-2 shrink-0">
                {restrictedRt ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>RT {restrictedRt}</span>
                  </div>
                ) : (
                  <select
                    value={kkSelectedRt}
                    onChange={(e) => setKkSelectedRt(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="all">Semua Wilayah RT</option>
                    <option value="039">RT 039</option>
                    <option value="040">RT 040</option>
                    <option value="041">RT 041</option>
                    <option value="042">RT 042</option>
                  </select>
                )}
              </div>
            </div>

            {/* Quick Filter Status Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Status:
              </span>

              <button
                onClick={() => setKkFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  kkFilterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua KK ({pbbKkSummaries.length})
              </button>

              <button
                onClick={() => setKkFilterStatus('tunggakan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kkFilterStatus === 'tunggakan'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>🚨 Prioritas Penagihan: Ada Tunggakan ({kkMetrics.kkMenunggakCount})</span>
              </button>

              <button
                onClick={() => setKkFilterStatus('belum_2026')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kkFilterStatus === 'belum_2026'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Belum Bayar 2026 ({kkMetrics.kkBelum2026Count})</span>
              </button>

              <button
                onClick={() => setKkFilterStatus('lunas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kkFilterStatus === 'lunas'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lunas Bersih ({kkMetrics.kkLunasBersihCount})</span>
              </button>
            </div>
          </div>

          {/* List of KK Cards with Arrears & Payment History */}
          {filteredKkSummaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Tidak ada data KK yang sesuai filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Silakan sesuaikan kata kunci pencarian atau ubah filter status di atas untuk melihat data KK lainnya.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKkSummaries.map((kk) => {
                const isExpanded = expandedKkId === kk.kkId;
                const isCopied = copiedKkId === kk.kkId;

                return (
                  <div
                    key={kk.kkId}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                      kk.hasTunggakan
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : kk.belumLunas2026Count > 0
                        ? 'border-amber-300'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top Status Alert Banner for the KK */}
                    {kk.hasTunggakan ? (
                      <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                          <span>
                            PERHATIAN PENAGIHAN: KK ini memiliki tunggakan PBB selama {kk.jumlahTahunTunggakan} tahun
                            pajak senilai {formatRupiah(kk.totalNominalTunggakan)}!
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-[10px] uppercase">
                          Prioritas Penagihan RT {kk.rt}
                        </span>
                      </div>
                    ) : kk.belumLunas2026Count > 0 ? (
                      <div className="bg-amber-500 text-slate-900 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-900" />
                          <span>
                            Tagihan SPPT PBB Tahun 2026 Belum Lunas (Sisa: {formatRupiah(kk.totalBebanKeseluruhan)})
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-black/10 text-slate-900 font-black text-[10px]">
                          Tahun Berjalan
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-700 text-emerald-100 px-4 py-1.5 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>KK Tertib Pajak: Lunas Bersih & Bebas dari Segala Tunggakan</span>
                        </div>
                        <span className="text-[10px] text-emerald-200 font-medium">Bebas Tunggakan</span>
                      </div>
                    )}

                    {/* Card Header & Main Information */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Identity & Address */}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                              kk.hasTunggakan
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : kk.belumLunas2026Count > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {kk.namaKepala
                              ? kk.namaKepala
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join('')
                              : 'KK'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[11px] font-black">
                                RT {kk.rt}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                <span>No. KK: {kk.noKk}</span>
                                <button
                                  onClick={() => handleCopyNoKk(kk.noKk, kk.kkId)}
                                  title="Salin No. KK"
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  {isCopied ? (
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                              {kk.statusEkonomi && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                  {kk.statusEkonomi}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {kk.namaKepala}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              {kk.nikKepala && (
                                <span>
                                  NIK: <strong className="text-slate-700 font-mono">{kk.nikKepala}</strong>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700">{kk.alamat}</span>
                              </span>
                              {kk.telepon && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-slate-700">{kk.telepon}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Financial & Action Quick Bar */}
                        <div className="flex flex-wrap items-center gap-3 lg:self-center">
                          {/* Financial Summary Badges */}
                          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                            <div className="text-right pr-2 border-r border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block font-bold">Objek PBB</span>
                              <span className="font-black text-slate-800">{kk.totalNop} NOP</span>
                            </div>

                            <div className="text-right pr-2 border-r border-slate-200">
                              <span className="text-[10px] text-slate-500 uppercase block font-bold">Tunggakan</span>
                              <span
                                className={`font-black ${
                                  kk.totalNominalTunggakan > 0 ? 'text-rose-700' : 'text-slate-400'
                                }`}
                              >
                                {formatRupiah(kk.totalNominalTunggakan)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Beban</span>
                              <span className="font-black text-slate-900 text-sm">
                                {formatRupiah(kk.totalBebanKeseluruhan)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons for Ketua RT */}
                          <div className="flex items-center gap-1.5">
                            {/* WhatsApp Notification Button */}
                            <button
                              onClick={() => handleShareWaReminder(kk)}
                              title="Kirim Pemberitahuan Tagihan / Tunggakan via WhatsApp"
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Kirim WA</span>
                            </button>

                            {/* Print Surat Penagihan */}
                            <button
                              onClick={() => setPrintKkNoticeData(kk)}
                              title="Cetak Surat Pemberitahuan Tagihan & Rincian Tunggakan PBB"
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Surat Tagihan</span>
                            </button>

                            {/* Toggle Accordion */}
                            <button
                              onClick={() => setExpandedKkId(isExpanded ? null : kk.kkId)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                                isExpanded
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <span>{isExpanded ? 'Tutup Riwayat' : `Lihat Riwayat (${kk.riwayatTahun.length})`}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Accordion: Full Year-by-Year Payment History & Arrears Breakdown */}
                      {isExpanded && (
                        <div className="mt-5 pt-4 border-t border-slate-200 space-y-4">
                          {/* Objek PBB Section */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-emerald-700" />
                              <span>Daftar Objek Pajak (NOP) & Sertifikat SHM Terdaftar atas KK ini:</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {kk.pbbItems.map((p) => (
                                <div
                                  key={p.id}
                                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <div className="font-mono font-bold text-emerald-800 text-[11px]">{p.nop}</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{p.alamatObjek}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      SHM: {p.noShm || '-'} ({p.statusHak}) • Pemilik: {p.namaPemilikShm}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      Luas: {p.luasTanah}m² / {p.luasBangunan}m² • NJOP: {formatRupiah(p.totalNjop)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setDetailItem(p)}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Detail NOP</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Year-by-Year Payment & Arrears History Table */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-emerald-700" />
                                <span>Histori Riwayat Pembayaran & Catatan Tunggakan per Tahun Pajak:</span>
                              </span>
                              <span className="text-[11px] text-slate-500 lowercase font-normal">
                                Total {kk.riwayatTahun.length} catatan tagihan
                              </span>
                            </h4>

                            <div className="rounded-xl border border-slate-200 overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                                    <th className="py-2.5 px-3">Tahun Pajak</th>
                                    <th className="py-2.5 px-3">NOP & Objek</th>
                                    <th className="py-2.5 px-3 text-right">Tagihan Pokok</th>
                                    <th className="py-2.5 px-3 text-right">Denda</th>
                                    <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                    <th className="py-2.5 px-3">Keterangan / NTPN</th>
                                    <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {kk.riwayatTahun.map((item, idx) => {
                                    return (
                                      <tr
                                        key={idx}
                                        className={`hover:bg-slate-50 ${
                                          item.status === 'Belum Lunas' && !item.isTahunBerjalan
                                            ? 'bg-rose-50/40'
                                            : item.status === 'Belum Lunas'
                                            ? 'bg-amber-50/30'
                                            : ''
                                        }`}
                                      >
                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                          <div className="flex items-center gap-1.5">
                                            <span>Tahun {item.tahun}</span>
                                            {item.isTahunBerjalan && (
                                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                                                2026
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        <td className="py-2.5 px-3">
                                          <span className="font-mono text-slate-700 text-[10px] block">
                                            {item.nop}
                                          </span>
                                          <span className="text-[11px] text-slate-500 line-clamp-1">
                                            {item.alamatObjek}
                                          </span>
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                                          {formatRupiah(item.pokok)}
                                        </td>

                                        <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                                          {item.denda > 0 ? formatRupiah(item.denda) : '-'}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                          {formatRupiah(item.total)}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                          {item.status === 'Lunas' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              <span>Lunas</span>
                                            </span>
                                          ) : (
                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                !item.isTahunBerjalan
                                                  ? 'bg-rose-100 text-rose-800'
                                                  : 'bg-amber-100 text-amber-900'
                                              }`}
                                            >
                                              <AlertTriangle className="w-3 h-3" />
                                              <span>Belum Lunas</span>
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                                          {item.status === 'Lunas' ? (
                                            <div>
                                              <span>
                                                {item.tanggalBayar ? formatTanggalIndo(item.tanggalBayar) : 'Lunas'}
                                              </span>
                                              {item.buktiBayarNo && (
                                                <span className="text-[10px] text-slate-400 block font-mono">
                                                  No: {item.buktiBayarNo}
                                                </span>
                                              )}
                                            </div>
                                          ) : !item.isTahunBerjalan ? (
                                            <span className="text-rose-700 font-bold text-[10px]">
                                              Tunggakan Tahun Lampau
                                            </span>
                                          ) : (
                                            <span className="text-amber-800 text-[10px]">Jatuh Tempo 30 Sep 2026</span>
                                          )}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                          {item.status !== 'Lunas' && item.isTahunBerjalan && (
                                            <button
                                              onClick={() => handleOpenBayar(item.pbbRecord)}
                                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[10px] shadow-xs"
                                            >
                                              Bayar PBB
                                            </button>
                                          )}

                                          {item.status !== 'Lunas' && !item.isTahunBerjalan && item.rawTunggakan && (
                                            <button
                                              onClick={() =>
                                                handleOpenBayarTunggakan(item.pbbRecord, item.rawTunggakan!)
                                              }
                                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] shadow-xs"
                                            >
                                              Lunasi Tunggakan
                                            </button>
                                          )}

                                          {item.status === 'Lunas' && (
                                            <button
                                              onClick={() => setPrintReceiptItem(item.pbbRecord)}
                                              title="Cetak Tanda Terima"
                                              className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-800"
                                            >
                                              <Printer className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                                    <td colSpan={2} className="py-2.5 px-3 uppercase text-[10px]">
                                      Total Kewajiban Ditagihkan:
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {formatRupiah(
                                        kk.riwayatTahun
                                          .filter((r) => r.status === 'Belum Lunas')
                                          .reduce((sum, r) => sum + r.pokok, 0)
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-rose-700">
                                      {formatRupiah(
                                        kk.riwayatTahun
                                          .filter((r) => r.status === 'Belum Lunas')
                                          .reduce((sum, r) => sum + r.denda, 0)
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-black text-rose-800 text-sm">
                                      {formatRupiah(kk.totalBebanKeseluruhan)}
                                    </td>
                                    <td colSpan={3} className="py-2.5 px-3 text-[10px] text-slate-500 italic">
                                      {kk.totalBebanKeseluruhan === 0
                                        ? 'Semua tagihan lunas'
                                        : 'Total tagihan yang harus diselesaikan oleh KK ini'}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-MENU TAB 3: RINCIAN TARGET PBB & TAGIHAN TUNGGAKAN PER RT */}
      {activeSubTab === 'rekap_rt' && (
        <div className="space-y-5">
          {/* Executive Summary Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Rincian Target PBB & Tagihan Tunggakan Total per RT
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Matriks komparasi beban target SPPT PBB Tahun 2026, realisasi penerimaan lunas, sisa tagihan, serta akumulasi tunggakan piutang pajak per wilayah RT (039 s.d. 042).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setPrintRekapModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan Rekap RT</span>
                </button>
              </div>
            </div>

            {/* RW 018 Totals Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Objek Pajak (NOP)
                </div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {grandTotalSummary.totalNop}{' '}
                  <span className="text-xs font-semibold text-slate-500">NOP (4 RT)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  NJOP: {formatRupiah(grandTotalSummary.totalNjop)}
                </div>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Target PBB 2026
                </div>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  {formatRupiah(grandTotalSummary.targetPbb)}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                  Pokok: {formatRupiah(grandTotalSummary.pokokPbb)}
                </div>
              </div>

              <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-200">
                <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Realisasi Lunas</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-200 text-teal-900 font-black">
                    {grandPersentaseLunas}%
                  </span>
                </div>
                <div className="text-xl font-black text-teal-900 mt-1">
                  {formatRupiah(grandTotalSummary.lunasNominal)}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold mt-1">
                  {grandTotalSummary.lunasCount} dari {grandTotalSummary.totalNop} NOP Lunas
                </div>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Sisa Tagihan 2026
                </div>
                <div className="text-xl font-black text-amber-900 mt-1">
                  {formatRupiah(grandTotalSummary.belumLunasNominal)}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-1">
                  {grandTotalSummary.belumLunasCount} NOP Belum Bayar
                </div>
              </div>

              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 col-span-2 lg:col-span-1">
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Total Tagihan Tunggakan
                </div>
                <div className="text-xl font-black text-rose-900 mt-1">
                  {formatRupiah(grandTotalSummary.totalTunggakanNominal)}
                </div>
                <div className="text-[10px] text-rose-700 font-semibold mt-1">
                  {grandTotalSummary.objekTunggakanCount} Objek Tertunggak
                </div>
              </div>
            </div>

            {/* Total Beban Piutang Banner */}
            <div className="mt-4 p-3 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-black shrink-0">
                  Σ
                </div>
                <div>
                  <div className="font-bold text-slate-200">
                    Total Beban Keseluruhan Tagihan PBB RW 018 (Target 2026 + Akumulasi Tunggakan):
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    Target 2026 ({formatRupiah(grandTotalSummary.targetPbb)}) + Tunggakan ({formatRupiah(grandTotalSummary.totalTunggakanNominal)})
                  </div>
                </div>
              </div>
              <div className="text-right sm:text-right shrink-0">
                <div className="text-base sm:text-lg font-black text-amber-300">
                  {formatRupiah(grandTotalSummary.totalBebanKeseluruhan)}
                </div>
                <div className="text-[10px] text-slate-300">
                  Sisa yang harus ditagih: <strong>{formatRupiah(grandTotalSummary.sisaBebanTagihan)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE: RINCIAN TARGET PBB & TAGIHAN TUNGGAKAN PER RT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-xs sm:text-sm text-slate-800">
                  Tabel Rincian Target PBB & Tunggakan per Wilayah RT
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Tahun Pajak 2026 • RW 018
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Wilayah RT</th>
                    <th className="py-3 px-3 text-center">Jumlah NOP</th>
                    <th className="py-3 px-4">Target PBB 2026</th>
                    <th className="py-3 px-4">Realisasi Lunas</th>
                    <th className="py-3 px-4">Sisa Tagihan 2026</th>
                    <th className="py-3 px-4">Tagihan Tunggakan</th>
                    <th className="py-3 px-4">Total Beban Tagihan</th>
                    <th className="py-3 px-3 text-center">Capaian Lunas</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rtSummaries.map((summary) => {
                    const statusKepatuhan =
                      summary.persentaseLunas >= 80
                        ? { label: 'Sangat Tertib', color: 'bg-emerald-100 text-emerald-800' }
                        : summary.persentaseLunas >= 50
                        ? { label: 'Cukup Tertib', color: 'bg-amber-100 text-amber-900' }
                        : { label: 'Perlu Penagihan', color: 'bg-rose-100 text-rose-800' };

                    return (
                      <tr key={summary.rt} className="hover:bg-emerald-50/30 transition-colors">
                        {/* Wilayah RT */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-black flex items-center justify-center text-xs shadow-xs">
                              {summary.rt.slice(-2)}
                            </span>
                            <div>
                              <div className="font-black text-xs text-slate-900">RT {summary.rt}</div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                NJOP: {formatRupiah(summary.totalNjop)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Jumlah NOP */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-black text-xs">
                            {summary.totalNop}
                          </span>
                        </td>

                        {/* Target PBB 2026 */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-black text-slate-900 text-xs">
                            {formatRupiah(summary.targetPbb)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Pokok: {formatRupiah(summary.pokokPbb)}
                          </div>
                        </td>

                        {/* Realisasi Lunas */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-black text-emerald-800 text-xs">
                            {formatRupiah(summary.lunasNominal)}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            {summary.lunasCount} NOP Lunas
                          </div>
                        </td>

                        {/* Sisa Tagihan 2026 */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-black text-amber-900 text-xs">
                            {formatRupiah(summary.belumLunasNominal)}
                          </div>
                          <div className="text-[10px] text-amber-700 font-semibold">
                            {summary.belumLunasCount} NOP Belum Lunas
                          </div>
                        </td>

                        {/* Tagihan Tunggakan */}
                        <td className="py-3.5 px-4 align-middle">
                          {summary.totalTunggakanNominal > 0 ? (
                            <div>
                              <div className="font-black text-rose-800 text-xs">
                                {formatRupiah(summary.totalTunggakanNominal)}
                              </div>
                              <div className="text-[10px] text-rose-700">
                                {summary.objekTunggakanCount} Objek Tertunggak
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Nihil
                            </span>
                          )}
                        </td>

                        {/* Total Beban Tagihan */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-black text-slate-900 text-xs">
                            {formatRupiah(summary.totalBebanKeseluruhan)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Sisa: <strong className="text-rose-700">{formatRupiah(summary.sisaBebanTagihan)}</strong>
                          </div>
                        </td>

                        {/* Capaian Lunas */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <div className="inline-block text-center">
                            <span className="text-xs font-black text-emerald-800">
                              {summary.persentaseLunas}%
                            </span>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, summary.persentaseLunas)}%` }}
                              />
                            </div>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${statusKepatuhan.color}`}>
                              {statusKepatuhan.label}
                            </span>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedRt(summary.rt);
                                setActiveSubTab('data');
                              }}
                              title={`Lihat Data PBB RT ${summary.rt}`}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors"
                            >
                              <span>Data RT</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setActiveRtDetailModal(summary.rt)}
                              title={`Rincian Tunggakan RT ${summary.rt}`}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* FOOTER TOTAL KESELURUHAN RW 018 */}
                <tfoot>
                  <tr className="bg-emerald-900 text-white font-black text-xs border-t-2 border-emerald-950">
                    <td className="py-4 px-4 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-300" />
                        <span>TOTAL RW 018</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-amber-300 font-black text-xs">
                        {grandTotalSummary.totalNop} NOP
                      </span>
                    </td>
                    <td className="py-4 px-4 text-amber-200">
                      <div>{formatRupiah(grandTotalSummary.targetPbb)}</div>
                      <div className="text-[10px] text-emerald-200 font-normal">
                        Pokok: {formatRupiah(grandTotalSummary.pokokPbb)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-emerald-300">
                      <div>{formatRupiah(grandTotalSummary.lunasNominal)}</div>
                      <div className="text-[10px] text-emerald-200 font-normal">
                        {grandTotalSummary.lunasCount} NOP Lunas
                      </div>
                    </td>
                    <td className="py-4 px-4 text-amber-300">
                      <div>{formatRupiah(grandTotalSummary.belumLunasNominal)}</div>
                      <div className="text-[10px] text-amber-200 font-normal">
                        {grandTotalSummary.belumLunasCount} NOP Belum
                      </div>
                    </td>
                    <td className="py-4 px-4 text-rose-300">
                      <div>{formatRupiah(grandTotalSummary.totalTunggakanNominal)}</div>
                      <div className="text-[10px] text-rose-200 font-normal">
                        {grandTotalSummary.objekTunggakanCount} Objek Nunggak
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      <div>{formatRupiah(grandTotalSummary.totalBebanKeseluruhan)}</div>
                      <div className="text-[10px] text-amber-300 font-normal">
                        Sisa: {formatRupiah(grandTotalSummary.sisaBebanTagihan)}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="px-2 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs">
                        {grandPersentaseLunas}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setPrintRekapModal(true)}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-[10px] transition-colors"
                      >
                        Cetak Laporan
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4 BENTO CARDS PER RT WITH INTERACTIVE BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rtSummaries.map((summary) => {
              const unpaidPbbInRt = pbbList.filter((p) => p.rt === summary.rt && p.statusPembayaran === 'Belum Lunas');
              const tunggakanPbbInRt = pbbList.filter(
                (p) => p.rt === summary.rt && p.tunggakanTahunLalu.some((t) => t.status === 'Belum Lunas')
              );

              return (
                <div
                  key={summary.rt}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-xs">
                          {summary.rt}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">
                            Wilayah RT {summary.rt} RW 018
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {summary.totalNop} Objek Pajak • NJOP {formatRupiah(summary.totalNjop)}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                        {summary.persentaseLunas}% Lunas
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-600">Realisasi Target 2026</span>
                        <span className="text-emerald-800">
                          {formatRupiah(summary.lunasNominal)} / {formatRupiah(summary.targetPbb)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, summary.persentaseLunas)}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Target 2026</div>
                        <div className="font-black text-slate-900 text-xs mt-0.5">
                          {formatRupiah(summary.targetPbb)}
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">
                          Lunas: {summary.lunasCount} NOP
                        </div>
                      </div>

                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        <div className="text-[10px] text-amber-800 font-bold uppercase">Belum Lunas</div>
                        <div className="font-black text-amber-900 text-xs mt-0.5">
                          {formatRupiah(summary.belumLunasNominal)}
                        </div>
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          Sisa: {summary.belumLunasCount} NOP
                        </div>
                      </div>

                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        <div className="text-[10px] text-rose-800 font-bold uppercase">Tunggakan</div>
                        <div className="font-black text-rose-900 text-xs mt-0.5">
                          {formatRupiah(summary.totalTunggakanNominal)}
                        </div>
                        <div className="text-[10px] text-rose-700 mt-0.5">
                          {summary.objekTunggakanCount} Objek
                        </div>
                      </div>
                    </div>

                    {/* Tunggakan Breakdown by Year if any */}
                    {Object.keys(summary.rincianTahunTunggakan).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-rose-900 mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Rincian Tunggakan per Tahun Pajak (RT {summary.rt}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.entries(summary.rincianTahunTunggakan) as [string, { count: number; total: number }][]).map(([thn, detail]) => (
                            <span
                              key={thn}
                              className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200"
                            >
                              Tahun {thn}: {formatRupiah(detail.total)} ({detail.count} NOP)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Total Beban RT: <strong className="text-slate-900">{formatRupiah(summary.totalBebanKeseluruhan)}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveRtDetailModal(summary.rt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                      >
                        Detail NOP & Tunggakan
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRt(summary.rt);
                          setActiveSubTab('data');
                        }}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span>Kelola RT {summary.rt}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PBB & SHM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base">
                  {editingItem ? 'Edit Data PBB & SHM' : 'Tambah Data PBB & Pemilik SHM'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Quick Select Warga (Auto-fill) */}
              {!editingItem && scopedWargaList.length > 0 && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <label className="block font-bold text-emerald-900 mb-1">
                    {restrictedRt
                      ? `Pilih Dari Data Warga RT ${restrictedRt} (Otomatis Isi Data WP & Pemilik):`
                      : 'Pilih Dari Data Warga RW 018 (Otomatis Isi Data WP & Pemilik):'}
                  </label>
                  <select
                    onChange={(e) => handleSelectWargaForForm(e.target.value)}
                    defaultValue=""
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Warga Terdaftar --</option>
                    {scopedWargaList
                      .slice()
                      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nama} (NIK: {w.nik}) - RT {w.rt}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Section 1: Data SPPT PBB */}
              <div>
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
                  <FileText className="w-3.5 h-3.5" />
                  1. Informasi SPPT Pajak Bumi & Bangunan (PBB-P2)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Objek Pajak (NOP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="18.72.030.004.018-0001.0"
                      value={formData.nop || ''}
                      onChange={(e) => setFormData({ ...formData, nop: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Wilayah RT <span className="text-rose-500">*</span>
                      {restrictedRt && <span className="text-blue-700 font-bold ml-1">(Terkunci RT {restrictedRt})</span>}
                    </label>
                    {restrictedRt ? (
                      <div>
                        <select
                          disabled
                          value={restrictedRt}
                          className="w-full px-3 py-2 bg-blue-50 border border-blue-300 text-blue-950 font-bold rounded-xl cursor-not-allowed"
                        >
                          <option value={restrictedRt}>RT {restrictedRt} RW 018</option>
                        </select>
                        <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-1">
                          <Lock className="w-3 h-3" />
                          <span>Sesuai hak akses login Ketua RT {restrictedRt}</span>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={formData.rt || '039'}
                        onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="039">RT 039 RW 018</option>
                        <option value="040">RT 040 RW 018</option>
                        <option value="041">RT 041 RW 018</option>
                        <option value="042">RT 042 RW 018</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Wajib Pajak (WP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama pada lembar SPPT"
                      value={formData.namaWajibPajak || ''}
                      onChange={(e) => setFormData({ ...formData, namaWajibPajak: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIK Wajib Pajak</label>
                    <input
                      type="text"
                      placeholder="16 digit NIK"
                      value={formData.nikWajibPajak || ''}
                      onChange={(e) => setFormData({ ...formData, nikWajibPajak: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Alamat Lengkap Objek Pajak
                    </label>
                    <input
                      type="text"
                      placeholder="Jl. Pala No. ..., RT ..., RW 018 Kel. Iringmulyo"
                      value={formData.alamatObjek || ''}
                      onChange={(e) => setFormData({ ...formData, alamatObjek: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Penggunaan Objek</label>
                    <select
                      value={formData.penggunaanBangunan || 'Rumah Tinggal'}
                      onChange={(e) => setFormData({ ...formData, penggunaanBangunan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Rumah Tinggal">Rumah Tinggal</option>
                      <option value="Tempat Usaha / Toko">Tempat Usaha / Toko</option>
                      <option value="Kos-kosan / Kontrakan">Kos-kosan / Kontrakan</option>
                      <option value="Tanah Kosong / Kebun">Tanah Kosong / Kebun</option>
                      <option value="Fasilitas Umum / Musholla">Fasilitas Umum / Musholla</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Pajak</label>
                    <input
                      type="number"
                      value={formData.tahunPajak || 2026}
                      onChange={(e) => setFormData({ ...formData, tahunPajak: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Rincian Pemilik SHM & Sertifikat */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  2. Rincian Pemilik & Sertifikat Hak Milik (SHM)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pemilik SHM <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama pemilik yang sah"
                      value={formData.namaPemilikShm || ''}
                      onChange={(e) => setFormData({ ...formData, namaPemilikShm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Status Hak Atas Tanah
                    </label>
                    <select
                      value={formData.statusHak || 'SHM (Hak Milik)'}
                      onChange={(e) =>
                        setFormData({ ...formData, statusHak: e.target.value as StatusHakTanah })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="SHM (Hak Milik)">SHM (Hak Milik)</option>
                      <option value="HGB (Hak Guna Bangunan)">HGB (Hak Guna Bangunan)</option>
                      <option value="Hak Pakai">Hak Pakai</option>
                      <option value="Girik / Letter C">Girik / Letter C</option>
                      <option value="Tanah Wakaf">Tanah Wakaf</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Sertifikat (SHM)</label>
                    <input
                      type="text"
                      placeholder="SHM No. 01824/Iringmulyo"
                      value={formData.noShm || ''}
                      onChange={(e) => setFormData({ ...formData, noShm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Surat Ukur (SU)
                    </label>
                    <input
                      type="text"
                      placeholder="SU No. 00412/Iringmulyo/2014"
                      value={formData.noSuratUkur || ''}
                      onChange={(e) => setFormData({ ...formData, noSuratUkur: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Tercantum di Sertifikat
                    </label>
                    <input
                      type="text"
                      placeholder="Atas nama di buku sertifikat BPN"
                      value={formData.atasNamaSertifikat || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, atasNamaSertifikat: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Terbit Sertifikat</label>
                    <input
                      type="number"
                      placeholder="2016"
                      value={formData.tahunTerbitSertifikat || 2016}
                      onChange={(e) =>
                        setFormData({ ...formData, tahunTerbitSertifikat: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Luas, NJOP & Tagihan */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-800">
                  <DollarSign className="w-3.5 h-3.5" />
                  3. Luas Tanah, NJOP & Rincian Tagihan PBB
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Luas Tanah (m²)</label>
                    <input
                      type="number"
                      value={formData.luasTanah || 0}
                      onChange={(e) =>
                        handleTanahBangunanChange(
                          Number(e.target.value),
                          formData.luasBangunan || 0,
                          formData.njopTanahPerMeter || 0,
                          formData.njopBangunanPerMeter || 0
                        )
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NJOP Tanah / m² (Rp)</label>
                    <input
                      type="number"
                      value={formData.njopTanahPerMeter || 0}
                      onChange={(e) =>
                        handleTanahBangunanChange(
                          formData.luasTanah || 0,
                          formData.luasBangunan || 0,
                          Number(e.target.value),
                          formData.njopBangunanPerMeter || 0
                        )
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Luas Bangunan (m²)</label>
                    <input
                      type="number"
                      value={formData.luasBangunan || 0}
                      onChange={(e) =>
                        handleTanahBangunanChange(
                          formData.luasTanah || 0,
                          Number(e.target.value),
                          formData.njopTanahPerMeter || 0,
                          formData.njopBangunanPerMeter || 0
                        )
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NJOP Bangunan / m²</label>
                    <input
                      type="number"
                      value={formData.njopBangunanPerMeter || 0}
                      onChange={(e) =>
                        handleTanahBangunanChange(
                          formData.luasTanah || 0,
                          formData.luasBangunan || 0,
                          formData.njopTanahPerMeter || 0,
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Total NJOP (Kalkulasi)</label>
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg font-bold">
                      {formatRupiah(formData.totalNjop || 0)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Tagihan PBB 2026 (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.totalTagihan || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalTagihan: Number(e.target.value),
                          tagihanPokok: Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 font-black text-emerald-800 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Pembayaran */}
              <div className="pt-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Status Pembayaran Tahun 2026
                    </label>
                    <select
                      value={formData.statusPembayaran || 'Belum Lunas'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusPembayaran: e.target.value as StatusBayarPbb
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    >
                      <option value="Belum Lunas">Belum Lunas</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      value={formData.jatuhTempo || '2026-09-30'}
                      onChange={(e) => setFormData({ ...formData, jatuhTempo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan Tambahan / Keterangan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Misal: SPPT telah disampaikan, dalam proses balik nama sertifikat, dsb."
                      value={formData.catatan || ''}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data PBB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PEMBAYARAN PBB TAHUN BERJALAN (LUNASI PBB) */}
      {bayarItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base">
                  Pembayaran PBB Tahun Berjalan ({bayarItem.tahunPajak})
                </h3>
              </div>
              <button
                onClick={() => setBayarItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
              {/* Summary Card */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800">NOP:</span>
                  <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {bayarItem.nop}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-slate-700">
                  <span>Wajib Pajak:</span>
                  <strong className="text-slate-900">{bayarItem.namaWajibPajak}</strong>
                </div>
                <div className="mt-1 flex items-center justify-between text-slate-700">
                  <span>Pemilik SHM:</span>
                  <strong className="text-slate-900">{bayarItem.namaPemilikShm}</strong>
                </div>
                <div className="mt-1 flex items-center justify-between text-slate-700">
                  <span>Alamat:</span>
                  <span className="text-right text-[11px] max-w-[200px] truncate">{bayarItem.alamatObjek}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">Total Tagihan PBB:</span>
                  <span className="text-base font-black text-emerald-800">
                    {formatRupiah(bayarItem.totalTagihan)}
                  </span>
                </div>
              </div>

              {/* Payment Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payFormData.tanggalBayar}
                    onChange={(e) => setPayFormData({ ...payFormData, tanggalBayar: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Metode Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payFormData.metodeBayar}
                    onChange={(e) =>
                      setPayFormData({
                        ...payFormData,
                        metodeBayar: e.target.value as MetodeBayarPbb
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="Tunai Kolektif RW">Tunai Kolektif RW 018</option>
                    <option value="QRIS / Mobile Banking">QRIS / Mobile Banking</option>
                    <option value="Bank Lampung">Bank Lampung (Teller / ATM)</option>
                    <option value="Pos Indonesia">Kantor Pos Indonesia</option>
                    <option value="Indomaret / Alfamart">Gerai Ritel (Indomaret / Alfamart)</option>
                    <option value="Bapenda Metro">Kantor Bapenda Kota Metro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Bukti Transaksi / NTPN / Kuitansi
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor bukti setor atau NTPN"
                    value={payFormData.buktiBayarNo}
                    onChange={(e) => setPayFormData({ ...payFormData, buktiBayarNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Penyetor</label>
                    <input
                      type="text"
                      value={payFormData.namaPenyetor}
                      onChange={(e) => setPayFormData({ ...payFormData, namaPenyetor: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Petugas / Kolektor</label>
                    <input
                      type="text"
                      value={payFormData.petugasKolektor}
                      onChange={(e) => setPayFormData({ ...payFormData, petugasKolektor: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                  <input
                    type="text"
                    placeholder="Keterangan pembayaran..."
                    value={payFormData.catatan}
                    onChange={(e) => setPayFormData({ ...payFormData, catatan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBayarItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Lunas PBB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL LENGKAP PBB & SHM */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-black text-sm sm:text-base">Rincian Lengkap PBB & Pemilik SHM</h3>
                  <p className="text-[11px] text-emerald-200">NOP: {detailItem.nop}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detail Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Header Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Status PBB 2026</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {detailItem.statusPembayaran === 'Lunas' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Lunas
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Belum Lunas
                      </span>
                    )}
                    <span className="text-xs font-black text-slate-800">
                      {formatRupiah(detailItem.totalTagihan)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintReceiptItem(detailItem);
                      setDetailItem(null);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Tanda Terima</span>
                  </button>
                  {detailItem.statusPembayaran !== 'Lunas' && (
                    <button
                      onClick={() => {
                        handleOpenBayar(detailItem);
                        setDetailItem(null);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Bayar Sekarang</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Data Section 1: Pemilik SHM */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5 text-amber-800 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Rincian Kepemilikan Hak Milik (SHM)
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nama Pemilik SHM</span>
                    <strong className="text-slate-900 text-xs">{detailItem.namaPemilikShm}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Status Hak Atas Tanah</span>
                    <strong className="text-amber-800 text-xs">{detailItem.statusHak}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nomor Sertifikat (SHM)</span>
                    <span className="font-mono text-slate-800 font-bold">{detailItem.noShm || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nomor Surat Ukur (SU)</span>
                    <span className="font-mono text-slate-800">{detailItem.noSuratUkur || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Atas Nama Tercantum</span>
                    <span className="text-slate-800">{detailItem.atasNamaSertifikat || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tahun Terbit Sertifikat</span>
                    <span className="text-slate-800">{detailItem.tahunTerbitSertifikat || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Data Section 2: Objek Pajak & SPPT */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5 text-emerald-800 border-b border-slate-100 pb-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Rincian Objek Pajak (SPPT PBB)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nama Wajib Pajak</span>
                    <strong className="text-slate-900">{detailItem.namaWajibPajak}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Wilayah RT</span>
                    <strong className="text-slate-900">RT {detailItem.rt} RW 018</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Penggunaan</span>
                    <span className="text-slate-800">{detailItem.penggunaanBangunan}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-500 block">Alamat Objek Pajak</span>
                    <span className="text-slate-800 font-medium">{detailItem.alamatObjek}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Luas Tanah</span>
                    <span className="text-slate-900 font-bold">{detailItem.luasTanah} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Luas Bangunan</span>
                    <span className="text-slate-900 font-bold">{detailItem.luasBangunan} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total NJOP</span>
                    <span className="text-emerald-800 font-black">{formatRupiah(detailItem.totalNjop)}</span>
                  </div>
                </div>
              </div>

              {/* Data Section 3: History Tunggakan Tahun Lalu */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5 text-rose-800 border-b border-slate-100 pb-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Catatan Tunggakan PBB Tahun Lalu
                </h4>
                {detailItem.tunggakanTahunLalu.length === 0 ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tidak ada tunggakan tahun lalu. Objek pajak tertib administrasi.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailItem.tunggakanTahunLalu.map((tgk, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800">Tahun {tgk.tahun}</div>
                          <div className="text-[11px] text-slate-500">
                            Pokok: {formatRupiah(tgk.pokok)} • Denda: {formatRupiah(tgk.denda)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-black text-xs text-slate-900">{formatRupiah(tgk.total)}</div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tgk.status === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {tgk.status}
                            </span>
                          </div>

                          {tgk.status === 'Belum Lunas' && (
                            <button
                              onClick={() => handleOpenBayarTunggakan(detailItem, tgk)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px]"
                            >
                              Lunasi
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Data terdaftar: {detailItem.createdAt ? formatTanggalIndo(detailItem.createdAt) : '-'}
              </span>
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PEMBAYARAN TUNGGAKAN PBB */}
      {tunggakanModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm">
                  Pelunasan Tunggakan PBB Tahun {tunggakanModalData.tunggakan.tahun}
                </h3>
              </div>
              <button
                onClick={() => setTunggakanModalData(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTunggakanPayment} className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                <div className="font-bold text-slate-800">
                  {tunggakanModalData.pbb.namaWajibPajak} (NOP: {tunggakanModalData.pbb.nop})
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Pokok: {formatRupiah(tunggakanModalData.tunggakan.pokok)} + Denda:{' '}
                  {formatRupiah(tunggakanModalData.tunggakan.denda)}
                </div>
                <div className="mt-2 pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="font-bold text-rose-900">Total Tagihan Tunggakan:</span>
                  <span className="text-base font-black text-rose-800">
                    {formatRupiah(tunggakanModalData.tunggakan.total)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pelunasan</label>
                <input
                  type="date"
                  required
                  value={payTunggakanFormData.tanggalBayar}
                  onChange={(e) =>
                    setPayTunggakanFormData({ ...payTunggakanFormData, tanggalBayar: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payTunggakanFormData.metodeBayar}
                  onChange={(e) =>
                    setPayTunggakanFormData({
                      ...payTunggakanFormData,
                      metodeBayar: e.target.value as MetodeBayarPbb
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Tunai Kolektif RW">Tunai Kolektif RW 018</option>
                  <option value="QRIS / Mobile Banking">QRIS / Mobile Banking</option>
                  <option value="Bank Lampung">Bank Lampung</option>
                  <option value="Bapenda Metro">Kantor Bapenda Kota Metro</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Kuitansi Pelunasan</label>
                <input
                  type="text"
                  value={payTunggakanFormData.kuitansiNo}
                  onChange={(e) =>
                    setPayTunggakanFormData({ ...payTunggakanFormData, kuitansiNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTunggakanModalData(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RINCIAN DETAIL OBJEK & TUNGGAKAN PER RT */}
      {activeRtDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-xs">
                  {activeRtDetailModal.slice(-2)}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">
                    Rincian Objek PBB & Tagihan Tunggakan RT {activeRtDetailModal}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    RW 018 Kelurahan Iringmulyo • Tahun Pajak 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRtDetailModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* RT Metric Cards */}
              {(() => {
                const rtSum = rtSummaries.find((s) => s.rt === activeRtDetailModal);
                if (!rtSum) return null;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Total Target 2026</span>
                      <div className="font-black text-slate-900 text-xs mt-0.5">{formatRupiah(rtSum.targetPbb)}</div>
                      <span className="text-[10px] text-slate-500">{rtSum.totalNop} Objek Pajak</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase">Realisasi Lunas</span>
                      <div className="font-black text-emerald-800 text-xs mt-0.5">{formatRupiah(rtSum.lunasNominal)}</div>
                      <span className="text-[10px] text-emerald-700 font-semibold">{rtSum.lunasCount} NOP ({rtSum.persentaseLunas}%)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-700 font-bold uppercase">Sisa Belum Lunas</span>
                      <div className="font-black text-amber-900 text-xs mt-0.5">{formatRupiah(rtSum.belumLunasNominal)}</div>
                      <span className="text-[10px] text-amber-700 font-semibold">{rtSum.belumLunasCount} NOP</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-rose-700 font-bold uppercase">Tunggakan Tahun Lalu</span>
                      <div className="font-black text-rose-800 text-xs mt-0.5">{formatRupiah(rtSum.totalTunggakanNominal)}</div>
                      <span className="text-[10px] text-rose-700 font-semibold">{rtSum.objekTunggakanCount} Objek Nunggak</span>
                    </div>
                  </div>
                );
              })()}

              {/* Table of NOP in this RT */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">NOP & Wajib Pajak</th>
                      <th className="py-2.5 px-3">Alamat & Luas</th>
                      <th className="py-2.5 px-3">Tagihan 2026</th>
                      <th className="py-2.5 px-3">Status 2026</th>
                      <th className="py-2.5 px-3">Tunggakan Tahun Lalu</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pbbList
                      .filter((p) => p.rt === activeRtDetailModal)
                      .map((item) => {
                        const unpaidTgk = item.tunggakanTahunLalu.filter((t) => t.status === 'Belum Lunas');
                        const totalTgkNominal = unpaidTgk.reduce((sum, t) => sum + t.total, 0);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 align-top">
                              <span className="font-mono font-bold text-emerald-800 text-[10px] block">
                                {item.nop}
                              </span>
                              <strong className="text-slate-900 text-xs block">{item.namaWajibPajak}</strong>
                              <span className="text-[10px] text-slate-500">SHM: {item.namaPemilikShm}</span>
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              <div className="text-slate-700 text-[11px] line-clamp-1">{item.alamatObjek}</div>
                              <div className="text-[10px] text-slate-500">
                                {item.luasTanah}m² / {item.luasBangunan}m² • NJOP {formatRupiah(item.totalNjop)}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              <div className="font-bold text-slate-900">{formatRupiah(item.totalTagihan)}</div>
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              {item.statusPembayaran === 'Lunas' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                  <Clock className="w-3 h-3 text-amber-600" /> Belum Lunas
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              {unpaidTgk.length > 0 ? (
                                <div>
                                  <div className="font-bold text-rose-800 text-xs">{formatRupiah(totalTgkNominal)}</div>
                                  <div className="text-[10px] text-rose-600">
                                    {unpaidTgk.map((t) => `Thn ${t.tahun}`).join(', ')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-emerald-600 text-[10px] font-semibold">Nihil</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 align-top text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setDetailItem(item);
                                    setActiveRtDetailModal(null);
                                  }}
                                  title="Detail NOP"
                                  className="p-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                {item.statusPembayaran !== 'Lunas' && (
                                  <button
                                    onClick={() => {
                                      handleOpenBayar(item);
                                      setActiveRtDetailModal(null);
                                    }}
                                    title="Bayar PBB 2026"
                                    className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold"
                                  >
                                    Bayar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRt(activeRtDetailModal);
                  setActiveSubTab('data');
                  setActiveRtDetailModal(null);
                }}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>Buka di Tab Data PBB</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveRtDetailModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CETAK REKAPITULASI TARGET & TUNGGAKAN PBB PER RT */}
      {printRekapModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="px-6 py-3 bg-slate-800 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                Pratinjau Cetak Rekapitulasi Target PBB & Tagihan Tunggakan per RT
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setPrintRekapModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 text-slate-900 font-serif bg-white" id="printable-rekap-rt">
              {/* Kop Surat Resmi */}
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900 text-center">
                <img
                  src={LOGO_RW_018}
                  alt="Logo RW"
                  className="w-16 h-16 object-contain shrink-0"
                />
                <div className="flex-1">
                  <div className="text-[11px] font-sans font-bold tracking-wider uppercase text-slate-700">
                    Pemerintah Kota Metro • Kecamatan Metro Timur
                  </div>
                  <div className="text-sm font-sans font-black tracking-tight text-slate-900 uppercase">
                    Rukun Warga (RW) 018 Kelurahan Iringmulyo
                  </div>
                  <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                    Jl. Pala RT 039 - 042, Kel. Iringmulyo, Metro Timur, Kota Metro, Lampung 34112
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center my-4">
                <div className="text-xs font-sans font-black uppercase tracking-wider text-slate-900">
                  Laporan Rekapitulasi Target PBB & Tagihan Tunggakan per RT
                </div>
                <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                  Tahun Pajak 2026 • Wilayah RW 018 Kelurahan Iringmulyo
                </div>
              </div>

              {/* Rekap Table */}
              <div className="my-4 overflow-x-auto font-sans text-xs">
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-2 text-center">No</th>
                      <th className="border border-slate-300 p-2">Wilayah RT</th>
                      <th className="border border-slate-300 p-2 text-center">Jumlah NOP</th>
                      <th className="border border-slate-300 p-2 text-right">Target PBB 2026</th>
                      <th className="border border-slate-300 p-2 text-right">Realisasi Lunas</th>
                      <th className="border border-slate-300 p-2 text-right">Sisa Tagihan 2026</th>
                      <th className="border border-slate-300 p-2 text-right">Tunggakan Tahun Lalu</th>
                      <th className="border border-slate-300 p-2 text-right">Total Beban Tagihan</th>
                      <th className="border border-slate-300 p-2 text-center">% Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rtSummaries.map((s, idx) => (
                      <tr key={s.rt} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold">RT {s.rt}</td>
                        <td className="border border-slate-300 p-2 text-center">{s.totalNop}</td>
                        <td className="border border-slate-300 p-2 text-right font-medium">{formatRupiah(s.targetPbb)}</td>
                        <td className="border border-slate-300 p-2 text-right text-emerald-800 font-bold">{formatRupiah(s.lunasNominal)}</td>
                        <td className="border border-slate-300 p-2 text-right text-amber-800 font-medium">{formatRupiah(s.belumLunasNominal)}</td>
                        <td className="border border-slate-300 p-2 text-right text-rose-800 font-medium">{formatRupiah(s.totalTunggakanNominal)}</td>
                        <td className="border border-slate-300 p-2 text-right font-bold">{formatRupiah(s.totalBebanKeseluruhan)}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{s.persentaseLunas}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-400">
                      <td colSpan={2} className="border border-slate-300 p-2 text-center uppercase">
                        TOTAL RW 018
                      </td>
                      <td className="border border-slate-300 p-2 text-center">{grandTotalSummary.totalNop} NOP</td>
                      <td className="border border-slate-300 p-2 text-right">{formatRupiah(grandTotalSummary.targetPbb)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatRupiah(grandTotalSummary.lunasNominal)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatRupiah(grandTotalSummary.belumLunasNominal)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatRupiah(grandTotalSummary.totalTunggakanNominal)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatRupiah(grandTotalSummary.totalBebanKeseluruhan)}</td>
                      <td className="border border-slate-300 p-2 text-center">{grandPersentaseLunas}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Rincian Catatan / Tindak Lanjut */}
              <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-[10px] font-sans text-slate-700 space-y-1">
                <div className="font-bold uppercase tracking-wider text-slate-900">Catatan & Rencana Tindak Lanjut:</div>
                <div>1. Target SPPT PBB Tahun Pajak 2026 jatuh tempo pada tanggal 30 September 2026.</div>
                <div>2. Penagihan tunggakan tahun lalu dikoordinasikan secara kolektif bersama Ketua RT masing-masing.</div>
                <div>3. Rekapitulasi disahkan untuk pelaporan ke Kantor Kelurahan Iringmulyo dan Bapenda Kota Metro.</div>
              </div>

              {/* Tanda Tangan */}
              <div className="mt-8 pt-4 grid grid-cols-2 gap-4 text-center font-sans text-xs">
                <div>
                  <div className="text-slate-600">Koordinator Kolektor PBB RW 018,</div>
                  <div className="h-16" />
                  <div className="font-bold text-slate-900 underline">( Koordinator Kolektor PBB )</div>
                  <div className="text-[10px] text-slate-500">Petugas Pungut PBB-P2</div>
                </div>

                <div>
                  <div className="text-slate-600">
                    Iringmulyo, {formatTanggalIndo(new Date().toISOString().split('T')[0])}
                  </div>
                  <div className="text-slate-600">Ketua RW 018 Iringmulyo,</div>
                  <div className="h-16" />
                  <div className="font-bold text-slate-900 underline">{profile.namaKetuaRw}</div>
                  <div className="text-[10px] text-slate-500">Rukun Warga 018 Iringmulyo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CETAK TANDA TERIMA / KUITANSI PBB & SHM */}
      {printReceiptItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Action Header */}
            <div className="px-6 py-3 bg-slate-800 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                Pratinjau Tanda Terima PBB & SHM
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setPrintReceiptItem(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-8 text-slate-900 font-serif bg-white" id="printable-pbb-receipt">
              {/* Kop Surat Resmi */}
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900 text-center">
                <img
                  src={LOGO_RW_018}
                  alt="Logo RW"
                  className="w-16 h-16 object-contain shrink-0"
                />
                <div className="flex-1">
                  <div className="text-[11px] font-sans font-bold tracking-wider uppercase text-slate-700">
                    Pemerintah Kota Metro • Kecamatan Metro Timur
                  </div>
                  <div className="text-sm font-sans font-black tracking-tight text-slate-900 uppercase">
                    Rukun Warga (RW) 018 Kelurahan Iringmulyo
                  </div>
                  <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                    Jl. Pala RT 039 - 042, Kel. Iringmulyo, Metro Timur, Kota Metro, Lampung 34112
                  </div>
                </div>
              </div>

              <div className="text-center my-4">
                <div className="text-xs font-sans font-black uppercase tracking-wider text-slate-900">
                  Tanda Terima Pembayaran PBB-P2 & Sertifikat SHM
                </div>
                <div className="text-[10px] font-sans text-slate-500">
                  Tahun Pajak {printReceiptItem.tahunPajak} • No. Bukti: {printReceiptItem.buktiBayarNo || 'PBB-RW018-KOLEKTIF'}
                </div>
              </div>

              {/* Receipt Body */}
              <div className="space-y-2.5 text-xs font-sans">
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Objek Pajak (NOP)</span>
                  <span className="col-span-2 font-mono font-bold text-slate-900">{printReceiptItem.nop}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nama Wajib Pajak</span>
                  <span className="col-span-2 font-bold text-slate-900">{printReceiptItem.namaWajibPajak}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nama Pemilik SHM</span>
                  <span className="col-span-2 font-bold text-slate-900">{printReceiptItem.namaPemilikShm}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Sertifikat (SHM)</span>
                  <span className="col-span-2 text-slate-800">{printReceiptItem.noShm || '-'} ({printReceiptItem.statusHak})</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Alamat Objek Pajak</span>
                  <span className="col-span-2 text-slate-800">{printReceiptItem.alamatObjek} (RT {printReceiptItem.rt})</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Luas Tanah & Bangunan</span>
                  <span className="col-span-2 text-slate-800">
                    Tanah: {printReceiptItem.luasTanah} m² | Bangunan: {printReceiptItem.luasBangunan} m²
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Nilai Jual (NJOP)</span>
                  <span className="col-span-2 text-slate-900 font-bold">{formatRupiah(printReceiptItem.totalNjop)}</span>
                </div>
                <div className="grid grid-cols-3 py-2 bg-emerald-50 px-2 rounded-lg border border-emerald-200 mt-2">
                  <span className="font-bold text-emerald-900">Total Tagihan PBB</span>
                  <span className="col-span-2 font-black text-sm text-emerald-900">
                    {formatRupiah(printReceiptItem.totalTagihan)}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status & Tgl Bayar</span>
                  <span className="col-span-2 font-bold text-emerald-800">
                    {printReceiptItem.statusPembayaran} (
                    {printReceiptItem.tanggalBayar ? formatTanggalIndo(printReceiptItem.tanggalBayar) : '-'} via {printReceiptItem.metodeBayar || 'Kolektif RW'}
                    )
                  </span>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center font-sans text-xs">
                <div>
                  <div className="text-slate-500">Wajib Pajak / Penyetor,</div>
                  <div className="h-16" />
                  <div className="font-bold text-slate-900">({printReceiptItem.namaPenyetor || printReceiptItem.namaWajibPajak})</div>
                </div>

                <div>
                  <div className="text-slate-500">
                    Iringmulyo, {formatTanggalIndo(printReceiptItem.tanggalBayar || new Date().toISOString().split('T')[0])}
                  </div>
                  <div className="text-slate-500">Pengurus / Kolektor RW 018,</div>
                  <div className="h-14" />
                  <div className="font-bold text-slate-900 underline">{profile.namaKetuaRw}</div>
                  <div className="text-[10px] text-slate-500">Ketua RW 018 Iringmulyo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: CETAK SURAT PEMBERITAHUAN TAGIHAN & RINCIAN TUNGGAKAN KK */}
      {printKkNoticeData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Action Bar Header */}
            <div className="px-4 sm:px-6 py-3 bg-slate-800 text-white flex items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setPrintKkNoticeData(null)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-600 shadow-2xs shrink-0 cursor-pointer active:scale-95"
                  title="Kembali ke menu sebelumnya"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kembali</span>
                </button>
                <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                  <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Pratinjau Surat PBB (KK: {printKkNoticeData.namaKepala})</span>
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Surat</span>
                </button>
                <button
                  onClick={() => setPrintKkNoticeData(null)}
                  title="Tutup Pratinjau (Kembali)"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Printable Official Notice Sheet */}
            <div className="p-8 sm:p-10 text-slate-900 font-serif bg-white" id="printable-kk-notice">
              {/* Kop Surat Resmi */}
              <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-900 text-center">
                <img
                  src={LOGO_RW_018}
                  alt="Logo RW"
                  className="w-16 h-16 object-contain shrink-0"
                />
                <div className="flex-1">
                  <div className="text-[11px] font-sans font-bold tracking-wider uppercase text-slate-700">
                    Pemerintah Kota Metro • Kecamatan Metro Timur
                  </div>
                  <div className="text-base font-sans font-black tracking-tight text-slate-900 uppercase">
                    Rukun Warga (RW) 018 Kelurahan Iringmulyo
                  </div>
                  <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                    Jl. Pala RT 039 s.d. 042, Kel. Iringmulyo, Metro Timur, Kota Metro, Lampung 34112
                  </div>
                </div>
              </div>

              {/* Letter Meta & Addressee */}
              <div className="mt-5 grid grid-cols-2 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="w-20 text-slate-500">Nomor</span>
                    <span>: 018/PBB-TAG/RT.{printKkNoticeData.rt}/{new Date().getMonth() + 1}/2026</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 text-slate-500">Sifat</span>
                    <span className="font-bold text-rose-700">: Penting / Penagihan</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 text-slate-500">Lampiran</span>
                    <span>: 1 (satu) Berkas Rincian</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20 text-slate-500">Perihal</span>
                    <span className="font-bold">: Pemberitahuan Kewajiban Pembayaran PBB-P2</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-600">
                    Iringmulyo, {formatTanggalIndo(new Date().toISOString().split('T')[0])}
                  </div>
                  <div className="mt-2 text-left inline-block">
                    <div className="text-slate-500">Kepada Yth.</div>
                    <div className="font-bold text-slate-900">Bapak / Ibu {printKkNoticeData.namaKepala}</div>
                    <div className="text-slate-700 text-[11px]">Kepala Keluarga (No. KK: {printKkNoticeData.noKk})</div>
                    <div className="text-slate-600 text-[11px]">
                      {printKkNoticeData.alamat}, RT {printKkNoticeData.rt} RW 018
                    </div>
                    <div className="text-slate-600 text-[11px]">di Tempat</div>
                  </div>
                </div>
              </div>

              {/* Letter Intro */}
              <div className="mt-6 text-xs font-sans text-slate-800 leading-relaxed space-y-3">
                <p>Dengan hormat,</p>
                <p>
                  Sehubungan dengan pelaksanaan tertib administrasi Pajak Bumi dan Bangunan Perdesaan dan
                  Perkotaan (PBB-P2) Tahun Pajak 2026 serta pemutakhiran data piutang pajak wilayah RW 018 Kelurahan
                  Iringmulyo, kami sampaikan rincian kewajiban SPPT PBB atas objek pajak yang terdaftar dalam lingkungan
                  keluarga Bapak/Ibu sebagai berikut:
                </p>
              </div>

              {/* Table of Unpaid Taxes & Arrears */}
              <div className="my-4 font-sans text-xs">
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-2 text-center">No</th>
                      <th className="border border-slate-300 p-2">Tahun Pajak</th>
                      <th className="border border-slate-300 p-2">NOP & Alamat Objek</th>
                      <th className="border border-slate-300 p-2 text-right">Pokok (Rp)</th>
                      <th className="border border-slate-300 p-2 text-right">Denda (Rp)</th>
                      <th className="border border-slate-300 p-2 text-right">Total Tagihan (Rp)</th>
                      <th className="border border-slate-300 p-2 text-center">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printKkNoticeData.riwayatTahun
                      .filter((r) => r.status === 'Belum Lunas')
                      .map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-bold text-slate-900">
                            Tahun {item.tahun}
                          </td>
                          <td className="border border-slate-300 p-2">
                            <span className="font-mono font-bold text-emerald-900 block">{item.nop}</span>
                            <span className="text-[10px] text-slate-600 line-clamp-1">{item.alamatObjek}</span>
                          </td>
                          <td className="border border-slate-300 p-2 text-right">{formatRupiah(item.pokok)}</td>
                          <td className="border border-slate-300 p-2 text-right text-rose-700">
                            {item.denda > 0 ? formatRupiah(item.denda) : '-'}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">
                            {formatRupiah(item.total)}
                          </td>
                          <td className="border border-slate-300 p-2 text-center">
                            {item.isTahunBerjalan ? (
                              <span className="text-amber-800 font-bold text-[10px]">Tahun 2026</span>
                            ) : (
                              <span className="text-rose-700 font-bold text-[10px]">Tunggakan Thn Lalu</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={3} className="border border-slate-300 p-2 text-center uppercase text-[10px]">
                        TOTAL KEWAJIBAN YANG HARUS DIBAYAR
                      </td>
                      <td className="border border-slate-300 p-2 text-right">
                        {formatRupiah(
                          printKkNoticeData.riwayatTahun
                            .filter((r) => r.status === 'Belum Lunas')
                            .reduce((sum, r) => sum + r.pokok, 0)
                        )}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-rose-700">
                        {formatRupiah(
                          printKkNoticeData.riwayatTahun
                            .filter((r) => r.status === 'Belum Lunas')
                            .reduce((sum, r) => sum + r.denda, 0)
                        )}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-black text-rose-900 text-xs">
                        {formatRupiah(printKkNoticeData.totalBebanKeseluruhan)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center text-[10px] text-rose-700 font-bold">
                        Belum Lunas
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                  Petunjuk & Saluran Pembayaran:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>
                    Pembayaran dapat diserahkan langsung secara tunai kepada <strong>Ketua RT {printKkNoticeData.rt}</strong> atau <strong>Kolektor PBB RW 018</strong> untuk diterbitkan Kuitansi Tanda Terima Resmi.
                  </li>
                  <li>
                    Dapat dibayarkan secara mandiri melalui <strong>Teller / ATM Bank Lampung</strong>, <strong>Kantor Pos</strong>, gerai <strong>Indomaret / Alfamart</strong>, atau <strong>QRIS Bank Lampung</strong> dengan memasukkan Nomor Objek Pajak (NOP) yang tertera.
                  </li>
                  <li>
                    Mohon bukti pembayaran disimpan dan dilaporkan kepada Ketua RT untuk pemutakhiran data warga.
                  </li>
                </ul>
              </div>

              {/* Closing */}
              <p className="mt-4 text-xs font-sans text-slate-800 leading-relaxed">
                Demikian surat pemberitahuan ini kami sampaikan. Atas partisipasi dan ketertiban Bapak/Ibu dalam
                mendukung pembangunan Kota Metro dan wilayah RW 018 Iringmulyo, kami ucapkan terima kasih.
              </p>

              {/* Tanda Tangan */}
              <div className="mt-8 pt-4 grid grid-cols-2 gap-4 text-center font-sans text-xs">
                <div>
                  <div className="text-slate-600">Mengetahui / Menagih,</div>
                  <div className="text-slate-700 font-bold">Ketua RT {printKkNoticeData.rt} RW 018,</div>
                  <div className="h-16" />
                  <div className="font-bold text-slate-900 underline">( Ketua RT {printKkNoticeData.rt} )</div>
                  <div className="text-[10px] text-slate-500">Rukun Tetangga {printKkNoticeData.rt}</div>
                </div>

                <div>
                  <div className="text-slate-600">
                    Iringmulyo, {formatTanggalIndo(new Date().toISOString().split('T')[0])}
                  </div>
                  <div className="text-slate-700 font-bold">Ketua RW 018 Kelurahan Iringmulyo,</div>
                  <div className="h-16" />
                  <div className="font-bold text-slate-900 underline">{profile.namaKetuaRw}</div>
                  <div className="text-[10px] text-slate-500">Rukun Warga 018 Iringmulyo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
