import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  X,
  Phone,
  Calendar,
  Layers,
  MapPin,
  FileText,
  User,
  Package,
  Clock,
  Printer,
  ShieldAlert,
  ArrowRightLeft,
  Users,
  Award,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Check,
  Eye,
  CreditCard,
  RotateCcw,
  CheckSquare,
  Square,
  Scale,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Coins,
  ArrowRight
} from 'lucide-react';
import {
  IuranRkmRecord,
  WargaMeninggalRecord,
  PerlengkapanRkmItem,
  RWProfile,
  Gender,
  Warga,
  KartuKeluarga,
  BulanIuranItem
} from '../types';
import { formatRupiah, formatTanggalIndo, generateId } from '../utils/formatters';
import { exportRkmModule, exportToCsv, formatIuranRkmForExport, formatWargaMeninggalForExport, formatPerlengkapanRkmForExport } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { RkmCardModal } from './RkmCardModal';
import { RkmReportModal } from './RkmReportModal';
import {
  getCollectorByRt,
  generateDefault12Bulan,
  calculate12BulanSummary,
  calculateSaldoRkmSummary,
  getRkmPaymentStatus,
  PembayaranTerakhirInfo,
  SaldoRkmRwSummary,
  SaldoRkmRtItem,
  NAMA_BULAN_RKM
} from '../utils/rkmUtils';

interface RkmViewProps {
  profile: RWProfile;
  iuranRkmList: IuranRkmRecord[];
  wargaMeninggalList: WargaMeninggalRecord[];
  perlengkapanRkmList: PerlengkapanRkmItem[];
  wargaList?: Warga[];
  kkList?: KartuKeluarga[];
  onSaveIuranRkm: (item: IuranRkmRecord) => void;
  onDeleteIuranRkm: (id: string) => void;
  onSaveWargaMeninggal: (item: WargaMeninggalRecord) => void;
  onDeleteWargaMeninggal: (id: string) => void;
  onSavePerlengkapanRkm: (item: PerlengkapanRkmItem) => void;
  onDeletePerlengkapanRkm: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreateSuratKematian?: (warga: { nama: string; nik: string; rt: string; alamat: string }) => void;
}

export const RkmView: React.FC<RkmViewProps> = ({
  profile,
  iuranRkmList = [],
  wargaMeninggalList = [],
  perlengkapanRkmList = [],
  wargaList = [],
  kkList = [],
  onSaveIuranRkm,
  onDeleteIuranRkm,
  onSaveWargaMeninggal,
  onDeleteWargaMeninggal,
  onSavePerlengkapanRkm,
  onDeletePerlengkapanRkm,
  searchQuery,
  onSearchChange,
  onCreateSuratKematian,
}) => {
  // Active Sub-tab in RKM View: iuran | meninggal | perlengkapan | pengurus | saldo
  const [activeSubTab, setActiveSubTab] = useState<'iuran' | 'meninggal' | 'perlengkapan' | 'pengurus' | 'saldo'>('iuran');

  // Filters
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Helper to determine collector name by RT
  const getPetugasPenarikByRt = (rt: string) => {
    return getCollectorByRt(rt).nama;
  };

  // Modal States
  const [isIuranModalOpen, setIsIuranModalOpen] = useState(false);
  const [editingIuran, setEditingIuran] = useState<IuranRkmRecord | null>(null);

  // 12-Month Card Modal
  const [selectedCardForView, setSelectedCardForView] = useState<IuranRkmRecord | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Laporan Saldo Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalInitialRt, setReportModalInitialRt] = useState<string>('ALL');

  // Resident search/select in modal
  const [wargaSearchQuery, setWargaSearchQuery] = useState('');
  const [isWargaDropdownOpen, setIsWargaDropdownOpen] = useState(false);
  const [duplicateSwitchNotice, setDuplicateSwitchNotice] = useState<string | null>(null);

  const [isMeninggalModalOpen, setIsMeninggalModalOpen] = useState(false);
  const [editingMeninggal, setEditingMeninggal] = useState<WargaMeninggalRecord | null>(null);

  const [isPerlengkapanModalOpen, setIsPerlengkapanModalOpen] = useState(false);
  const [editingPerlengkapan, setEditingPerlengkapan] = useState<PerlengkapanRkmItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'iuran' | 'meninggal' | 'perlengkapan';
    id: string;
    name: string;
  } | null>(null);

  // Forms
  const [iuranForm, setIuranForm] = useState<Partial<IuranRkmRecord>>({
    noKk: '',
    nik: '',
    namaKepala: '',
    rt: '039',
    bulanTahun: '2026',
    tahun: 2026,
    nominal: 10000,
    status: 'Lunas',
    tanggalBayar: new Date().toISOString().split('T')[0],
    penerima: getCollectorByRt('039').nama,
    noRekening: `RKM-039-0012`,
    rincian12Bulan: generateDefault12Bulan(2026, 10000, 8, false, getCollectorByRt('039').nama)
  });

  const [meninggalForm, setMeninggalForm] = useState<Partial<WargaMeninggalRecord>>({
    nik: '',
    nama: '',
    jenisKelamin: 'L',
    usia: 70,
    rt: '039',
    alamat: `Jl. Pala RT 039 ${profile.kelurahan}`,
    tanggalMeninggal: new Date().toISOString().split('T')[0],
    waktuMeninggal: '06.00 WIB',
    tempatMeninggal: 'Rumah Duka',
    penyebab: 'Sakit Usia Lanjut',
    lokasiPemakaman: 'TPU Muslim Iringmulyo',
    santunanRkm: 1500000,
    statusSantunan: 'Diserahkan',
    namaAhliWaris: '',
    hubunganWaris: 'Keluarga Kandung',
    noHpWaris: '',
    keterangan: '',
  });

  const [perlengkapanForm, setPerlengkapanForm] = useState<Partial<PerlengkapanRkmItem>>({
    namaBarang: '',
    kategori: 'Perawatan Jenazah',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    status: 'Tersedia di Gudang',
    lokasiSimpan: `Gudang RKM Balai ${profile.namaRw}`,
    penanggungJawab: 'Koordinator RKM',
  });

  // Filtered lists
  const filteredIuran = useMemo(() => {
    return iuranRkmList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaKepala.toLowerCase().includes(q) ||
        (item.nik && item.nik.includes(q)) ||
        item.noKk.includes(q) ||
        (item.noRekening && item.noRekening.toLowerCase().includes(q)) ||
        item.rt.includes(q) ||
        item.bulanTahun.includes(q);
      const matchRt = selectedRt === 'ALL' || item.rt === selectedRt;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchSearch && matchRt && matchStatus;
    });
  }, [iuranRkmList, searchQuery, selectedRt, selectedStatus]);

  const filteredMeninggal = useMemo(() => {
    return wargaMeninggalList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.nik.includes(q) ||
        item.namaAhliWaris.toLowerCase().includes(q) ||
        item.lokasiPemakaman.toLowerCase().includes(q);
      const matchRt = selectedRt === 'ALL' || item.rt === selectedRt;
      return matchSearch && matchRt;
    });
  }, [wargaMeninggalList, searchQuery, selectedRt]);

  const filteredPerlengkapan = useMemo(() => {
    return perlengkapanRkmList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.lokasiSimpan.toLowerCase().includes(q) ||
        item.penanggungJawab.toLowerCase().includes(q) ||
        (item.peminjamSaatIni && item.peminjamSaatIni.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [perlengkapanRkmList, searchQuery]);

  // Statistics
  const totalIuranTerkumpul = useMemo(() => {
    return iuranRkmList.reduce((acc, curr) => {
      if (curr.rincian12Bulan && curr.rincian12Bulan.length > 0) {
        const sumPaid = curr.rincian12Bulan.reduce((s, b) => b.bayar ? s + (b.nominal || 0) : s, 0);
        return acc + sumPaid;
      }
      return acc + (curr.status === 'Lunas' ? (curr.nominal || 0) : 0);
    }, 0);
  }, [iuranRkmList]);

  const totalSantunanDisalurkan = useMemo(() => {
    return wargaMeninggalList.reduce((acc, curr) => acc + (curr.santunanRkm || 0), 0);
  }, [wargaMeninggalList]);

  // Matching resident from wargaList based on NIK or Nama
  const matchedWarga = useMemo(() => {
    const nikInput = (iuranForm.nik || '').trim();
    const namaInput = (iuranForm.namaKepala || '').trim().toLowerCase();

    if (nikInput.length >= 8) {
      const found = wargaList.find((w) => w.nik === nikInput || w.nik.startsWith(nikInput));
      if (found) return found;
    }
    if (namaInput.length >= 3) {
      const foundExact = wargaList.find((w) => w.nama.toLowerCase() === namaInput);
      if (foundExact) return foundExact;
      const foundPartial = wargaList.find((w) => w.nama.toLowerCase().includes(namaInput));
      if (foundPartial && (!iuranForm.rt || foundPartial.rt === iuranForm.rt)) return foundPartial;
    }
    return null;
  }, [iuranForm.nik, iuranForm.namaKepala, iuranForm.rt, wargaList]);

  // Check if citizen already exists in iuranRkmList
  const existingIuranRecord = useMemo(() => {
    const nik = (iuranForm.nik || matchedWarga?.nik || '').trim();
    const noKk = (iuranForm.noKk || matchedWarga?.noKk || '').trim();
    const nama = (iuranForm.namaKepala || matchedWarga?.nama || '').trim().toLowerCase();
    const rt = iuranForm.rt || matchedWarga?.rt;

    if (!nik && !noKk && !nama) return null;

    return (
      iuranRkmList.find((item) => {
        // Exclude current item if editing
        if (editingIuran && item.id === editingIuran.id) return false;

        // 1. Match by NIK
        if (nik && item.nik && item.nik === nik) return true;
        // 2. Match by No KK (ignore general dummy)
        if (noKk && item.noKk && item.noKk === noKk && !item.noKk.startsWith('1872021001260000')) return true;
        // 3. Match by exact Nama and RT
        if (nama && item.namaKepala.toLowerCase().trim() === nama && (!rt || item.rt === rt)) return true;
        return false;
      }) || null
    );
  }, [iuranForm.nik, iuranForm.noKk, iuranForm.namaKepala, iuranForm.rt, matchedWarga, iuranRkmList, editingIuran]);

  // Duplicate detected when in Add mode and matching record already exists
  const isDuplicateDetected = !editingIuran && !!existingIuranRecord;

  // Active record to evaluate payment status (either existing record or editing record)
  const activeRecordForPayment = editingIuran || existingIuranRecord || null;
  const currentPaymentStatus = useMemo(() => {
    if (activeRecordForPayment) {
      return getRkmPaymentStatus(activeRecordForPayment);
    }
    if (iuranForm.rincian12Bulan && iuranForm.rincian12Bulan.length === 12) {
      return getRkmPaymentStatus(iuranForm as IuranRkmRecord);
    }
    return getRkmPaymentStatus(null);
  }, [activeRecordForPayment, iuranForm]);

  // Handlers for Iuran Form
  const handleOpenAddIuran = () => {
    setEditingIuran(null);
    setWargaSearchQuery('');
    setDuplicateSwitchNotice(null);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const collector = getCollectorByRt('039').nama;
    setIuranForm({
      noKk: '187202100126' + String(randomSuffix),
      nik: '',
      namaKepala: '',
      rt: '039',
      bulanTahun: '2026',
      tahun: 2026,
      nominal: 10000,
      status: 'Belum Lunas',
      tanggalBayar: new Date().toISOString().split('T')[0],
      penerima: collector,
      noRekening: `RKM-039-${randomSuffix}`,
      rincian12Bulan: generateDefault12Bulan(2026, 10000, 0, false, collector)
    });
    setIsIuranModalOpen(true);
  };

  const handleOpenEditIuran = (item: IuranRkmRecord) => {
    setEditingIuran(item);
    setWargaSearchQuery(item.namaKepala || '');
    
    // Ensure rincian12Bulan is valid with 12 items
    const rincian: BulanIuranItem[] = (item.rincian12Bulan && item.rincian12Bulan.length === 12)
      ? item.rincian12Bulan
      : generateDefault12Bulan(
          item.tahun || 2026,
          item.nominal || 10000,
          item.status === 'Lunas' ? 8 : 4,
          item.nominal === 0,
          item.penerima || getCollectorByRt(item.rt).nama
        );

    setIuranForm({
      ...item,
      nik: item.nik || '',
      tahun: item.tahun || 2026,
      noRekening: item.noRekening || item.kuitansiNo || `RKM-${item.rt}-${item.noKk.slice(-4)}`,
      rincian12Bulan: rincian
    });
    setIsIuranModalOpen(true);
  };

  const handleSwitchToExistingRecord = (existing: IuranRkmRecord) => {
    handleOpenEditIuran(existing);
    setDuplicateSwitchNotice(
      `Sistem dialihkan ke Kartu Iuran "${existing.namaKepala}" (Rek: ${existing.noRekening || existing.noKk}). Anda dapat langsung menambahkan pembayaran bulan yang belum dibayar atau tunggakan.`
    );
  };

  const handlePayNextUnpaidMonth = () => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = [...iuranForm.rincian12Bulan];
    const nextIdx = updated.findIndex((b) => !b.bayar);
    if (nextIdx < 0) {
      alert('Semua iuran 12 bulan sudah lunas!');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const target = updated[nextIdx];
    updated[nextIdx] = {
      ...target,
      bayar: true,
      status: target.nominal === 0 ? 'Bebas Iuran (Dhuafa)' : 'Lunas',
      tanggalBayar: today,
      keterangan: 'Lunas Kolektor RT',
      kolektor: iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama
    };
    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handlePayAllRemainingArrears = () => {
    if (!iuranForm.rincian12Bulan) return;
    const today = new Date().toISOString().split('T')[0];
    const updated = iuranForm.rincian12Bulan.map((item) => {
      if (!item.bayar) {
        return {
          ...item,
          bayar: true,
          status: item.nominal === 0 ? 'Bebas Iuran (Dhuafa)' : 'Lunas',
          tanggalBayar: today,
          keterangan: 'Lunas Kolektor RT',
          kolektor: iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama
        };
      }
      return item;
    });
    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  // 12-Month Form Operations
  const handleToggleMonthPaid = (monthIndex: number) => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = [...iuranForm.rincian12Bulan];
    const target = updated[monthIndex];
    const newBayar = !target.bayar;
    const today = new Date().toISOString().split('T')[0];

    updated[monthIndex] = {
      ...target,
      bayar: newBayar,
      status: newBayar ? (target.nominal === 0 ? 'Bebas Iuran (Dhuafa)' : 'Lunas') : 'Belum Lunas',
      tanggalBayar: newBayar ? (target.tanggalBayar || today) : '',
      keterangan: newBayar ? (target.nominal === 0 ? 'Subsidi Kas RKM RW 018' : 'Lunas Kolektor RT') : 'Belum Bayar'
    };

    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleMonthNominalChange = (monthIndex: number, val: number) => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = [...iuranForm.rincian12Bulan];
    updated[monthIndex] = {
      ...updated[monthIndex],
      nominal: Math.max(0, val)
    };
    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleMonthTanggalChange = (monthIndex: number, dateVal: string) => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = [...iuranForm.rincian12Bulan];
    updated[monthIndex] = {
      ...updated[monthIndex],
      tanggalBayar: dateVal
    };
    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleMonthStatusChange = (monthIndex: number, newStatus: BulanIuranItem['status']) => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = [...iuranForm.rincian12Bulan];
    const isPaid = newStatus === 'Lunas' || newStatus === 'Bebas Iuran (Dhuafa)' || newStatus === 'Titip RT';
    const today = new Date().toISOString().split('T')[0];

    updated[monthIndex] = {
      ...updated[monthIndex],
      status: newStatus,
      bayar: isPaid,
      tanggalBayar: isPaid ? (updated[monthIndex].tanggalBayar || today) : '',
      keterangan: newStatus === 'Bebas Iuran (Dhuafa)' ? 'Subsidi Kas Sosial RKM' : newStatus === 'Titip RT' ? 'Titip Kas RT' : isPaid ? 'Lunas Kolektor' : 'Belum Bayar'
    };

    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleBulkCheckAll = (payAll: boolean) => {
    if (!iuranForm.rincian12Bulan) return;
    const today = new Date().toISOString().split('T')[0];
    const updated = iuranForm.rincian12Bulan.map((item) => ({
      ...item,
      bayar: payAll,
      status: payAll ? (item.nominal === 0 ? 'Bebas Iuran (Dhuafa)' : 'Lunas') : ('Belum Lunas' as const),
      tanggalBayar: payAll ? (item.tanggalBayar || today) : '',
      keterangan: payAll ? (item.nominal === 0 ? 'Subsidi Kas RKM RW 018' : 'Lunas Kolektor RT') : 'Belum Bayar'
    }));

    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleBulkCheckSemester = (sem: 1 | 2) => {
    if (!iuranForm.rincian12Bulan) return;
    const today = new Date().toISOString().split('T')[0];
    const startIdx = sem === 1 ? 0 : 6;
    const endIdx = sem === 1 ? 5 : 11;

    const updated = iuranForm.rincian12Bulan.map((item, idx) => {
      if (idx >= startIdx && idx <= endIdx) {
        return {
          ...item,
          bayar: true,
          status: item.nominal === 0 ? 'Bebas Iuran (Dhuafa)' : 'Lunas',
          tanggalBayar: item.tanggalBayar || today,
          keterangan: item.nominal === 0 ? 'Subsidi Kas RKM RW 018' : 'Lunas Kolektor RT'
        };
      }
      return item;
    });

    setIuranForm({
      ...iuranForm,
      rincian12Bulan: updated
    });
  };

  const handleApplyNominalToAll = (nom: number) => {
    if (!iuranForm.rincian12Bulan) return;
    const updated = iuranForm.rincian12Bulan.map((item) => ({
      ...item,
      nominal: nom
    }));
    setIuranForm({
      ...iuranForm,
      nominal: nom,
      rincian12Bulan: updated
    });
  };

  const handleSetFreeDhuafa = () => {
    if (!iuranForm.rincian12Bulan) return;
    const today = new Date().toISOString().split('T')[0];
    const updated = iuranForm.rincian12Bulan.map((item) => ({
      ...item,
      nominal: 0,
      bayar: true,
      status: 'Bebas Iuran (Dhuafa)' as const,
      tanggalBayar: today,
      keterangan: 'Subsidi Kas Sosial RKM RW 018'
    }));
    setIuranForm({
      ...iuranForm,
      nominal: 0,
      rincian12Bulan: updated
    });
  };

  const handleSelectResidentFromList = (warga: Warga) => {
    // Check if this resident already exists in iuranRkmList
    const existing = iuranRkmList.find(
      (item) =>
        (item.nik && item.nik === warga.nik) ||
        (item.noKk && item.noKk === warga.noKk && !item.noKk.startsWith('1872021001260000')) ||
        (item.namaKepala.toLowerCase().trim() === warga.nama.toLowerCase().trim() && item.rt === warga.rt)
    );

    if (existing) {
      // Citizen ALREADY has an RKM card! Switch directly to edit mode
      handleOpenEditIuran(existing);
      setDuplicateSwitchNotice(
        `Warga "${warga.nama}" sudah terdaftar dengan Nomor Rekening ${existing.noRekening || existing.noKk}. Sistem otomatis membuka mode Tambah Pembayaran Tunggakan agar data anggota tidak ganda.`
      );
      setWargaSearchQuery(warga.nama);
      setIsWargaDropdownOpen(false);
      return;
    }

    const collector = getCollectorByRt(warga.rt).nama;
    setEditingIuran(null);
    setDuplicateSwitchNotice(null);
    setIuranForm({
      ...iuranForm,
      namaKepala: warga.nama,
      nik: warga.nik,
      noKk: warga.noKk || iuranForm.noKk || '1872021001260001',
      rt: warga.rt,
      penerima: collector,
      noRekening: `RKM-${warga.rt}-${warga.noKk ? warga.noKk.slice(-4) : warga.nik ? warga.nik.slice(-4) : '0012'}`,
      rincian12Bulan: generateDefault12Bulan(iuranForm.tahun || 2026, 10000, 0, false, collector)
    });
    setWargaSearchQuery(warga.nama);
    setIsWargaDropdownOpen(false);
  };

  // View card modal from form or table
  const handleViewCard = (record: IuranRkmRecord) => {
    setSelectedCardForView(record);
    setIsCardModalOpen(true);
  };

  const handlePrintCardDirect = (record: IuranRkmRecord) => {
    setSelectedCardForView(record);
    setIsCardModalOpen(true);
  };

  const handleViewCurrentFormCard = () => {
    if (!iuranForm.namaKepala) {
      alert('Mohon isi Nama Kepala Keluarga terlebih dahulu untuk melihat kartu.');
      return;
    }
    const tempRecord: IuranRkmRecord = {
      id: editingIuran ? editingIuran.id : 'preview-temp',
      noKk: iuranForm.noKk || '1872021001260000',
      nik: iuranForm.nik || '',
      namaKepala: iuranForm.namaKepala,
      rt: iuranForm.rt || '039',
      bulanTahun: iuranForm.bulanTahun || '2026',
      tahun: iuranForm.tahun || 2026,
      nominal: Number(iuranForm.nominal) || 10000,
      status: (iuranForm.status as 'Lunas' | 'Belum Lunas') || 'Lunas',
      tanggalBayar: iuranForm.tanggalBayar || new Date().toISOString().split('T')[0],
      penerima: iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama,
      kuitansiNo: iuranForm.kuitansiNo || `RKM/${iuranForm.rt || '039'}/2026/01`,
      noRekening: iuranForm.noRekening || `RKM-${iuranForm.rt || '039'}-0001`,
      rincian12Bulan: iuranForm.rincian12Bulan
    };
    setSelectedCardForView(tempRecord);
    setIsCardModalOpen(true);
  };

  const handleSubmitIuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iuranForm.namaKepala || iuranForm.namaKepala.trim() === '') {
      alert('Nama Kepala Keluarga / Warga wajib diisi');
      return;
    }

    // Strict duplicate prevention check when creating new
    if (!editingIuran && existingIuranRecord) {
      alert(
        `⛔ PENCEGAHAN DATA ANGGOTA GANDA:\n\n` +
        `Warga "${existingIuranRecord.namaKepala}" (NIK: ${existingIuranRecord.nik || '-'}) SUDAH TERDAFTAR dalam data RKM dengan Nomor Rekening: ${existingIuranRecord.noRekening || existingIuranRecord.noKk}.\n\n` +
        `Anda tidak dapat menginput warga yang sama 2x agar data anggota RKM tidak ganda.\n\n` +
        `Silakan gunakan tombol "Alihkan ke Tambah Pembayaran Tunggakan Warga Ini" untuk menambahkan pembayaran bulan yang belum dibayar.`
      );
      return;
    }

    const rincian = iuranForm.rincian12Bulan || generateDefault12Bulan(2026, 10000, 8, false, iuranForm.penerima);
    const summary = calculate12BulanSummary(rincian);
    const isOverallLunas = summary.isFullPaid || summary.sisaTunggakan === 0;

    const record: IuranRkmRecord = {
      id: editingIuran ? editingIuran.id : generateId('irkm'),
      noKk: iuranForm.noKk || '1872021001260000',
      nik: iuranForm.nik || '',
      namaKepala: iuranForm.namaKepala || '',
      rt: iuranForm.rt || '039',
      bulanTahun: iuranForm.bulanTahun || '2026',
      tahun: iuranForm.tahun || 2026,
      nominal: Number(iuranForm.nominal) || 10000,
      status: isOverallLunas ? 'Lunas' : 'Belum Lunas',
      tanggalBayar: iuranForm.tanggalBayar || new Date().toISOString().split('T')[0],
      penerima: iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama,
      kuitansiNo: editingIuran?.kuitansiNo || `RKM/${iuranForm.rt || '039'}/${Date.now().toString().slice(-4)}`,
      noRekening: iuranForm.noRekening || `RKM-${iuranForm.rt || '039'}-${Date.now().toString().slice(-4)}`,
      rincian12Bulan: rincian
    };
    onSaveIuranRkm(record);
    setIsIuranModalOpen(false);
  };

  // Handlers for Meninggal
  const handleOpenAddMeninggal = () => {
    setEditingMeninggal(null);
    setMeninggalForm({
      nik: '',
      nama: '',
      jenisKelamin: 'L',
      usia: 70,
      rt: '039',
      alamat: `Jl. Pala RT 039 ${profile.kelurahan}`,
      tanggalMeninggal: new Date().toISOString().split('T')[0],
      waktuMeninggal: '06.00 WIB',
      tempatMeninggal: 'Rumah Duka',
      penyebab: 'Sakit Usia Lanjut',
      lokasiPemakaman: 'TPU Muslim Iringmulyo',
      santunanRkm: 1500000,
      statusSantunan: 'Diserahkan',
      namaAhliWaris: '',
      hubunganWaris: 'Keluarga Kandung',
      noHpWaris: '',
      keterangan: 'Layanan tenda, keranda, pemandian jenazah, dan santunan tunai dari RKM RW 018.',
    });
    setIsMeninggalModalOpen(true);
  };

  const handleOpenEditMeninggal = (item: WargaMeninggalRecord) => {
    setEditingMeninggal(item);
    setMeninggalForm({ ...item });
    setIsMeninggalModalOpen(true);
  };

  const handleSubmitMeninggal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meninggalForm.nama || !meninggalForm.tanggalMeninggal) {
      alert('Nama dan Tanggal Meninggal wajib diisi');
      return;
    }
    const record: WargaMeninggalRecord = {
      id: editingMeninggal ? editingMeninggal.id : generateId('wm'),
      nik: meninggalForm.nik || '1872020000000000',
      nama: meninggalForm.nama || '',
      jenisKelamin: (meninggalForm.jenisKelamin as Gender) || 'L',
      usia: Number(meninggalForm.usia) || 0,
      rt: meninggalForm.rt || '039',
      alamat: meninggalForm.alamat || `Jl. Pala ${profile.kelurahan}`,
      tanggalMeninggal: meninggalForm.tanggalMeninggal || '',
      waktuMeninggal: meninggalForm.waktuMeninggal || '',
      tempatMeninggal: meninggalForm.tempatMeninggal || 'Rumah Duka',
      penyebab: meninggalForm.penyebab || 'Sakit Usia Lanjut',
      lokasiPemakaman: meninggalForm.lokasiPemakaman || 'TPU Muslim Iringmulyo',
      santunanRkm: Number(meninggalForm.santunanRkm) || 1500000,
      statusSantunan: (meninggalForm.statusSantunan as any) || 'Diserahkan',
      namaAhliWaris: meninggalForm.namaAhliWaris || '',
      hubunganWaris: meninggalForm.hubunganWaris || 'Keluarga Kandung',
      noHpWaris: meninggalForm.noHpWaris || '',
      keterangan: meninggalForm.keterangan || '',
    };
    onSaveWargaMeninggal(record);
    setIsMeninggalModalOpen(false);
  };

  // Handlers for Perlengkapan
  const handleOpenAddPerlengkapan = () => {
    setEditingPerlengkapan(null);
    setPerlengkapanForm({
      namaBarang: '',
      kategori: 'Perawatan Jenazah',
      jumlah: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      status: 'Tersedia di Gudang',
      lokasiSimpan: `Gudang RKM Balai ${profile.namaRw}`,
      penanggungJawab: 'Koordinator RKM',
    });
    setIsPerlengkapanModalOpen(true);
  };

  const handleOpenEditPerlengkapan = (item: PerlengkapanRkmItem) => {
    setEditingPerlengkapan(item);
    setPerlengkapanForm({ ...item });
    setIsPerlengkapanModalOpen(true);
  };

  const handleSubmitPerlengkapan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perlengkapanForm.namaBarang) {
      alert('Nama Perlengkapan RKM wajib diisi');
      return;
    }
    const record: PerlengkapanRkmItem = {
      id: editingPerlengkapan ? editingPerlengkapan.id : generateId('prkm'),
      namaBarang: perlengkapanForm.namaBarang || '',
      kategori: perlengkapanForm.kategori || 'Perawatan Jenazah',
      jumlah: Number(perlengkapanForm.jumlah) || 1,
      satuan: perlengkapanForm.satuan || 'Unit',
      kondisi: (perlengkapanForm.kondisi as any) || 'Baik',
      status: (perlengkapanForm.status as any) || 'Tersedia di Gudang',
      lokasiSimpan: perlengkapanForm.lokasiSimpan || `Gudang RKM ${profile.namaRw}`,
      peminjamSaatIni: perlengkapanForm.peminjamSaatIni || '',
      kontakPeminjam: perlengkapanForm.kontakPeminjam || '',
      tanggalPinjam: perlengkapanForm.tanggalPinjam || '',
      penanggungJawab: perlengkapanForm.penanggungJawab || 'Pengurus RKM',
    };
    onSavePerlengkapanRkm(record);
    setIsPerlengkapanModalOpen(false);
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'iuran') {
      onDeleteIuranRkm(deleteConfirm.id);
    } else if (deleteConfirm.type === 'meninggal') {
      onDeleteWargaMeninggal(deleteConfirm.id);
    } else if (deleteConfirm.type === 'perlengkapan') {
      onDeletePerlengkapanRkm(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  // Perhitungan Saldo Kas RKM per RT dan Konsolidasi RW 018
  const saldoRkmSummary = useMemo(() => {
    return calculateSaldoRkmSummary(iuranRkmList, wargaMeninggalList, ['039', '040', '041', '042'], 2026);
  }, [iuranRkmList, wargaMeninggalList]);

  const handleExportExcel = () => {
    exportRkmModule(iuranRkmList, wargaMeninggalList, perlengkapanRkmList, 'xlsx');
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'saldo') {
      const dataSaldo = saldoRkmSummary.perRt.map((r, idx) => ({
        No: idx + 1,
        Wilayah: r.namaRt,
        Petugas: r.namaPetugas,
        'Total KK': r.totalKk,
        'Penerimaan (Rp)': r.totalPenerimaanIuran,
        'Tunggakan (Rp)': r.totalTunggakanIuran,
        'Santunan (Rp)': r.totalSantunanDisalurkan,
        'Warga Meninggal': r.totalWargaMeninggal,
        'Saldo Bersih (Rp)': r.saldoBersih,
        'Tertib (%)': `${r.persentaseLunas}%`,
      }));
      exportToCsv(`Rekap_Saldo_Kas_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, dataSaldo);
    } else if (activeSubTab === 'meninggal') {
      const data = formatWargaMeninggalForExport(wargaMeninggalList);
      exportToCsv(`Rekap_Warga_Meninggal_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    } else if (activeSubTab === 'perlengkapan') {
      const data = formatPerlengkapanRkmForExport(perlengkapanRkmList);
      exportToCsv(`Inventaris_Perlengkapan_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    } else {
      const data = formatIuranRkmForExport(iuranRkmList);
      exportToCsv(`Laporan_Iuran_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-800 p-4 sm:p-5 rounded-3xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Rukun Kematian Masyarakat (RKM) {profile.namaRw}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-emerald-950">
                  Sosial & Duka
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Pengelolaan iuran kematian, pencatatan warga wafat & santunan duka, serta inventaris perlengkapan jenazah (RT 039, RT 040, RT 041, RT 042).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => {
                setReportModalInitialRt('ALL');
                setIsReportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs border border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
              title="Buka Menu Cetak Laporan Saldo RKM"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak Laporan Saldo RKM</span>
            </button>

            <ExportButton
              label="Ekspor RKM"
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCSV}
              variant="subtle"
            />
            {activeSubTab === 'iuran' && (
              <button
                onClick={handleOpenAddIuran}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Input / Kelola Kartu Iuran 12 Bulan</span>
              </button>
            )}
            {activeSubTab === 'meninggal' && (
              <button
                onClick={handleOpenAddMeninggal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Warga Wafat</span>
              </button>
            )}
            {activeSubTab === 'perlengkapan' && (
              <button
                onClick={handleOpenAddPerlengkapan}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Inventaris</span>
              </button>
            )}
            {activeSubTab === 'saldo' && (
              <button
                onClick={() => {
                  setReportModalInitialRt(selectedRt);
                  setIsReportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Cetak / PDF Dokumen</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-emerald-700/60 text-xs">
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Total Iuran Masuk</span>
            <span className="text-sm font-black text-amber-300">{formatRupiah(totalIuranTerkumpul)}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Santunan Duka Keluar</span>
            <span className="text-sm font-black text-rose-300">{formatRupiah(totalSantunanDisalurkan)}</span>
          </div>
          <div className="bg-emerald-950/60 p-2.5 rounded-2xl border-2 border-amber-400/80 col-span-2 sm:col-span-1 shadow-xs">
            <span className="text-[11px] text-amber-300 block font-bold">Saldo Kas RKM RW 018</span>
            <span className="text-sm font-black text-white">{formatRupiah(totalIuranTerkumpul - totalSantunanDisalurkan)}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Warga Meninggal</span>
            <span className="text-sm font-black text-white">{wargaMeninggalList.length} Jiwa</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Perlengkapan Siaga</span>
            <span className="text-sm font-black text-white">{perlengkapanRkmList.length} Alat</span>
          </div>
        </div>
      </div>

      {/* Main Tab Selector (5 Sub-modules) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSubTab('iuran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'iuran'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>1. Data Iuran RKM Warga ({iuranRkmList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('meninggal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'meninggal'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>2. Data Warga Yang Meninggal ({wargaMeninggalList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('perlengkapan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'perlengkapan'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>3. Data Perlengkapan RKM ({perlengkapanRkmList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pengurus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'pengurus'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Pengurus & Penarik Iuran</span>
        </button>

        <button
          onClick={() => setActiveSubTab('saldo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'saldo'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>5. Laporan Saldo Kas RKM (RT & RW)</span>
        </button>
      </div>

      {/* Filter and Search Bar for active sub-tab */}
      {activeSubTab !== 'pengurus' && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter RT:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRt('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedRt === 'ALL' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Semua RT
              </button>
              {['039', '040', '041', '042'].map((rt) => (
                <button
                  key={rt}
                  onClick={() => setSelectedRt(rt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedRt === rt ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  RT {rt}
                </button>
              ))}
            </div>

            {activeSubTab === 'iuran' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
              >
                <option value="ALL">Semua Status Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            {activeSubTab === 'saldo'
              ? `Rekapitulasi Saldo Kas 4 Wilayah RT & Total RW 018`
              : `Menampilkan ${activeSubTab === 'iuran' ? filteredIuran.length : activeSubTab === 'meninggal' ? filteredMeninggal.length : filteredPerlengkapan.length} data`}
          </div>
        </div>
      )}

      {/* SUBTAB 1: DATA IURAN RKM WARGA */}
      {activeSubTab === 'iuran' && (
        <div className="space-y-3">
          {/* Banner Petugas Penarik Iuran RKM per RT */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-bold text-emerald-950 text-xs">
                Seksi Penarik Iuran RKM: Ketua RT 039 - RT 042
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 039</span>
                <span className="font-bold text-slate-800 text-xs block">Zaenal Fanani</span>
                <span className="text-[10px] text-slate-500">Ketua RT 039</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 040</span>
                <span className="font-bold text-slate-800 text-xs block">Epi</span>
                <span className="text-[10px] text-slate-500">Ketua RT 040</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 041</span>
                <span className="font-bold text-slate-800 text-xs block">Etty Herawati</span>
                <span className="text-[10px] text-slate-500">Ketua RT 041</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 042</span>
                <span className="font-bold text-slate-800 text-xs block">Sefrizal</span>
                <span className="text-[10px] text-slate-500">Ketua RT 042</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Warga & No. Rekening RKM</th>
                    <th className="p-3">Wilayah & Petugas Kolektor</th>
                    <th className="p-3">Progres Iuran 12 Bulan</th>
                    <th className="p-3">Total Terbayar</th>
                    <th className="p-3">Status Kas</th>
                    <th className="p-3 text-right">Aksi & Kartu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIuran.map((item) => {
                    const summary = calculate12BulanSummary(item.rincian12Bulan);
                    const percent = Math.round((summary.lunasCount / 12) * 100);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.namaKepala.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{item.namaKepala}</span>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 font-mono">
                                <span className="text-emerald-700 font-bold">{item.noRekening || `RKM-${item.rt}-${item.noKk.slice(-4)}`}</span>
                                <span>•</span>
                                <span>KK: {item.noKk}</span>
                                {item.nik && (
                                  <>
                                    <span>•</span>
                                    <span>NIK: {item.nik}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 block w-fit mb-0.5">
                            RT {item.rt}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {item.penerima || getCollectorByRt(item.rt).nama}
                          </span>
                        </td>
                        <td className="p-3 min-w-[140px]">
                          <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                            <span className={summary.isFullPaid ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                              {summary.lunasCount}/12 Bulan
                            </span>
                            <span className="text-slate-400 font-mono">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                summary.isFullPaid
                                  ? 'bg-emerald-600'
                                  : summary.lunasCount >= 6
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {summary.totalTerbayar === 0 && summary.lunasCount > 0 ? (
                            <span className="text-emerald-700 italic text-[11px]">Bebas Kas (Dhuafa)</span>
                          ) : (
                            <div>
                              <div>{formatRupiah(summary.totalTerbayar)}</div>
                              {summary.sisaTunggakan > 0 && (
                                <div className="text-[10px] font-normal text-rose-500">
                                  Sisa: {formatRupiah(summary.sisaTunggakan)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              summary.isFullPaid || item.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {summary.isFullPaid || item.status === 'Lunas' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lunas 12 Bulan</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{12 - summary.lunasCount} Bln Tertunggak</span>
                              </>
                            )}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Tgl: {item.tanggalBayar ? formatTanggalIndo(item.tanggalBayar) : '-'}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewCard(item)}
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Lihat Kartu Iuran 12 Bulan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Kartu</span>
                            </button>
                            <button
                              onClick={() => handlePrintCardDirect(item)}
                              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Cetak Kartu Iuran 12 Bulan Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditIuran(item)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Kartu Iuran 12 Bulan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'iuran',
                                  id: item.id,
                                  name: `Iuran RKM ${item.namaKepala} (Rek: ${item.noRekening || item.noKk})`,
                                })
                              }
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Iuran"
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

            {filteredIuran.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data iuran RKM yang sesuai kriteria pencarian.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: DATA WARGA YANG MENINGGAL */}
      {activeSubTab === 'meninggal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMeninggal.map((wm) => (
            <div
              key={wm.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white mr-1.5">
                      RT {wm.rt}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Usia {wm.usia} Tahun ({wm.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Santunan: {formatRupiah(wm.santunanRkm)}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-800 mt-2 leading-snug">
                  {wm.nama}
                </h3>
                <p className="font-mono text-[10px] text-slate-400">NIK: {wm.nik}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Wafat: {formatTanggalIndo(wm.tanggalMeninggal)} ({wm.waktuMeninggal || 'Pagi'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Pemakaman: {wm.lokasiPemakaman}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ahli Waris: {wm.namaAhliWaris} ({wm.hubunganWaris})</span>
                  </div>
                  {wm.noHpWaris && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{wm.noHpWaris}</span>
                    </div>
                  )}
                </div>

                {wm.keterangan && (
                  <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {wm.keterangan}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {onCreateSuratKematian && (
                  <button
                    onClick={() =>
                      onCreateSuratKematian({
                        nama: wm.nama,
                        nik: wm.nik,
                        rt: wm.rt,
                        alamat: wm.alamat,
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buat Surat Kematian</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleOpenEditMeninggal(wm)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                    title="Edit Data"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'meninggal',
                        id: wm.id,
                        name: `Data Kematian: ${wm.nama}`,
                      })
                    }
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMeninggal.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada data warga meninggal yang tercatat.
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: DATA PERLENGKAPAN RKM */}
      {activeSubTab === 'perlengkapan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPerlengkapan.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {item.kategori}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Tersedia di Gudang'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-2">{item.namaBarang}</h3>

                <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jumlah / Satuan:</span>
                    <span className="font-bold text-slate-800">
                      {item.jumlah} {item.satuan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kondisi Alat:</span>
                    <span
                      className={`font-bold ${
                        item.kondisi === 'Baik'
                          ? 'text-emerald-700'
                          : item.kondisi === 'Perlu Perbaikan'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {item.kondisi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lokasi Simpan:</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]">
                      {item.lokasiSimpan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penanggung Jawab:</span>
                    <span className="font-semibold text-slate-700">{item.penanggungJawab}</span>
                  </div>

                  {item.peminjamSaatIni && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                      <div className="font-bold">Sedang Dipinjam Oleh:</div>
                      <div>{item.peminjamSaatIni} (Kontak: {item.kontakPeminjam || '-'})</div>
                      <div className="text-[10px] text-amber-700">Tgl Pinjam: {item.tanggalPinjam || '-'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEditPerlengkapan(item)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                  title="Edit Inventaris / Status Pinjam"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      type: 'perlengkapan',
                      id: item.id,
                      name: item.namaBarang,
                    })
                  }
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs"
                  title="Hapus Inventaris"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredPerlengkapan.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada inventaris perlengkapan RKM yang tercatat.
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: DATA PENGURUS RKM & PETUGAS PENARIK IURAN */}
      {activeSubTab === 'pengurus' && (
        <div className="space-y-4">
          {/* Header Card Pengurus RKM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Struktur Organisasi & Kepengurusan
                </span>
                <h3 className="text-base font-black text-slate-800 mt-2">
                  Pengurus Rukun Kematian Masyarakat (RKM) {profile.namaRw}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile.alamatRw}, Kelurahan {profile.kelurahan}, Kecamatan {profile.kecamatan}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Pengurus Inti */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Pengurus Inti RKM
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ketua RKM
                    </span>
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.ketua || 'H. Daryanto'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Penanggung Jawab Umum RKM</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Sekretaris RKM
                    </span>
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.sekretaris || 'Rafly'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Administrasi & Pencatatan Data Wafat</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Bendahara RKM
                    </span>
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.bendahara || 'H. Yayat S. Nur'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pengelolaan Kas & Santunan Duka</div>
                </div>
              </div>
            </div>

            {/* Seksi-Seksi RKM */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Seksi - Seksi Pelayanan RKM
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Pengurusan & Pemakaman Jenazah</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPengurusanPemakaman || 'Ust Khaerudin'}</span>
                    <span className="text-[10px] text-slate-500">Memandikan, mengafani, menyalatkan, & mendampingi pemakaman</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Penggali Kubur</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPenggaliKubur || 'Husni Thamrin'}</span>
                    <span className="text-[10px] text-slate-500">Koordinasi penggalian liang lahat di TPU Muslim Iringmulyo</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Perlengkapan</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPerlengkapan || 'Alan'}</span>
                    <span className="text-[10px] text-slate-500">Penyediaan keranda, tempat mandi, tenda duka, kursi & sound system</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Humas & Informasi</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiHumas || 'Muhammad Rifai'}</span>
                    <span className="text-[10px] text-slate-500">Pemberitahuan berita duka via toa masjid, grup WA warga & koordinasi takziah</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seksi Penarik Iuran RKM per RT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Kolektor Iuran Wilayah
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-2">
                  Petugas Penarik Iuran RKM ({profile.pengurusRkm?.seksiPenarikIuran || 'Ketua RT'})
                </h4>
                <p className="text-xs text-slate-500">
                  Penarikan iuran RKM Rp 10.000 / KK / bulan dilakukan langsung oleh masing-masing Ketua RT.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {(profile.pengurusRkm?.petugasPenarik || [
                { rt: '039', namaPetugas: 'Zaenal Fanani', jabatan: 'Ketua RT 039', noHp: '0812-7890-0391' },
                { rt: '040', namaPetugas: 'Epi', jabatan: 'Ketua RT 040', noHp: '0813-6655-0402' },
                { rt: '041', namaPetugas: 'Etty Herawati', jabatan: 'Ketua RT 041', noHp: '0821-8899-0413' },
                { rt: '042', namaPetugas: 'Sefrizal', jabatan: 'Ketua RT 042', noHp: '0852-7711-0424' }
              ]).map((petugas) => {
                const iuranRtList = iuranRkmList.filter((i) => i.rt === petugas.rt);
                const lunasCount = iuranRtList.filter((i) => i.status === 'Lunas').length;
                return (
                  <div
                    key={petugas.rt}
                    className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 hover:border-emerald-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-800 text-white">
                          Wilayah RT {petugas.rt}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          {lunasCount} / {iuranRtList.length} KK Lunas
                        </span>
                      </div>

                      <h5 className="text-sm font-black text-slate-800 mt-2.5">
                        {petugas.namaPetugas}
                      </h5>
                      <p className="text-xs text-slate-600 font-semibold">{petugas.jabatan}</p>

                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-mono">{petugas.noHp}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
                      <a
                        href={`https://wa.me/${petugas.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Assalamu'alaikum%20${encodeURIComponent(petugas.namaPetugas)}%2C%20koordinasi%20iuran%20RKM%20RW%20018`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                      >
                        Hubungi WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          setSelectedRt(petugas.rt);
                          setActiveSubTab('iuran');
                        }}
                        className="py-1.5 px-2.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors"
                      >
                        Lihat Data Iuran
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: LAPORAN SALDO KAS RKM PER RT DAN TOTAL RW 018 */}
      {activeSubTab === 'saldo' && (
        <div className="space-y-4">
          {/* Header Card Saldo RKM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Laporan Keuangan & Saldo Kas
                </span>
                <h3 className="text-base font-black text-slate-800 mt-2 flex items-center gap-2">
                  <span>Rekapitulasi Saldo Kas RKM per RT & Total {profile.namaRw}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konsolidasi iuran masuk, santunan duka kematian yang disalurkan, serta sisa saldo kas bersih per wilayah RT (039, 040, 041, 042).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setReportModalInitialRt(selectedRt);
                    setIsReportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Cetak Laporan Saldo (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh CSV</span>
                </button>
              </div>
            </div>

            {/* 4 Executive Metric Cards in Saldo Tab */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider">
                    Total Penerimaan Iuran
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-base font-black text-emerald-900 mt-1">
                  {formatRupiah(saldoRkmSummary.totalPenerimaanIuran)}
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  {saldoRkmSummary.totalKkLunas} KK Tertib Bayar
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-rose-900 tracking-wider">
                    Total Santunan Duka
                  </span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-base font-black text-rose-900 mt-1">
                  {formatRupiah(saldoRkmSummary.totalSantunanDisalurkan)}
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  {saldoRkmSummary.totalWargaMeninggal} Jiwa Warga Wafat
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border-2 border-teal-500 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-teal-950 tracking-wider">
                    Saldo Kas Bersih RW 018
                  </span>
                  <Wallet className="w-4 h-4 text-teal-700" />
                </div>
                <div className="text-base font-black text-teal-900 mt-1">
                  {formatRupiah(saldoRkmSummary.totalSaldoBersih)}
                </div>
                <span className="text-[10px] text-teal-800 block mt-0.5 font-bold">
                  Dana Siaga Kas RKM
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                    Sisa Piutang / Tunggakan
                  </span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-base font-black text-amber-900 mt-1">
                  {formatRupiah(saldoRkmSummary.totalTunggakanIuran)}
                </div>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  {saldoRkmSummary.totalKkBelumLunas} KK Belum Selesai
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Saldo Kas RKM per RT & Total RW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <span>Tabel Rekapitulasi Saldo Kas RKM per Wilayah RT (RW 018)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Perhitungan iuran Rp 10.000 / KK / bulan & santunan duka kematian Rp 1.500.000 / jiwa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportModalInitialRt('ALL');
                    setIsReportModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekapitulasi Lengkap</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 text-center w-8">No</th>
                    <th className="p-3">Wilayah</th>
                    <th className="p-3">Petugas Kolektor RT</th>
                    <th className="p-3 text-center">KK</th>
                    <th className="p-3 text-center">Lunas</th>
                    <th className="p-3 text-center">Tunggak</th>
                    <th className="p-3 text-right">Penerimaan (Rp)</th>
                    <th className="p-3 text-right">Santunan (Rp)</th>
                    <th className="p-3 text-center">Wafat</th>
                    <th className="p-3 text-right">Saldo Bersih</th>
                    <th className="p-3 text-center">Tingkat Tertib</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {saldoRkmSummary.perRt
                    .filter((r) => selectedRt === 'ALL' || r.rt === selectedRt)
                    .map((r, idx) => (
                      <tr key={r.rt} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                          {r.namaRt}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{r.namaPetugas}</div>
                          <div className="text-[10px] text-slate-500">{r.noHpPetugas || r.jabatanPetugas}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{r.totalKk}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{r.totalKkLunas}</td>
                        <td className="p-3 text-center font-bold text-amber-700">{r.totalKkBelumLunas}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {formatRupiah(r.totalPenerimaanIuran)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                          {formatRupiah(r.totalSantunanDisalurkan)}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{r.totalWargaMeninggal}</td>
                        <td className="p-3 text-right font-mono font-black text-teal-950 whitespace-nowrap bg-teal-50/40">
                          {formatRupiah(r.saldoBersih)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.saldoBersih >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.persentaseLunas}% Lunas
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setReportModalInitialRt(r.rt);
                              setIsReportModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title={`Cetak Laporan Saldo ${r.namaRt}`}
                          >
                            <Printer className="w-3 h-3 text-emerald-700" />
                            <span>Cetak RT</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                  {/* Total Baris RW 018 */}
                  <tr className="bg-emerald-50/90 font-black text-slate-900 border-t-2 border-emerald-700">
                    <td colSpan={3} className="p-3.5 text-center uppercase tracking-wider text-emerald-950">
                      TOTAL KONSOLIDASI RW 018
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">{saldoRkmSummary.totalKk} KK</td>
                    <td className="p-3.5 text-center text-emerald-800 font-bold">{saldoRkmSummary.totalKkLunas} KK</td>
                    <td className="p-3.5 text-center text-amber-800 font-bold">{saldoRkmSummary.totalKkBelumLunas} KK</td>
                    <td className="p-3.5 text-right font-mono text-emerald-900 text-sm whitespace-nowrap">
                      {formatRupiah(saldoRkmSummary.totalPenerimaanIuran)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-rose-900 text-sm whitespace-nowrap">
                      {formatRupiah(saldoRkmSummary.totalSantunanDisalurkan)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">{saldoRkmSummary.totalWargaMeninggal} Jiwa</td>
                    <td className="p-3.5 text-right font-mono text-teal-950 text-sm font-black whitespace-nowrap bg-teal-100/70">
                      {formatRupiah(saldoRkmSummary.totalSaldoBersih)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                        {saldoRkmSummary.persentaseLunas}% Tertib
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setReportModalInitialRt('ALL');
                          setIsReportModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-amber-300" />
                        <span>Cetak RW</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards Breakdown per RT */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kartu Rincian Saldo Kas Tiap RT (Wilayah Kerja RW 018)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {saldoRkmSummary.perRt.map((r) => (
                <div
                  key={r.rt}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-800 text-white">
                          {r.namaRt}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {r.totalKkLunas} / {r.totalKk} KK Lunas ({r.persentaseLunas}%)
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.saldoBersih >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.saldoBersih >= 0 ? 'Surplus' : 'Defisit'}
                      </span>
                    </div>

                    {/* Collector Info */}
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Petugas Kolektor:</span>
                        <span className="font-bold text-slate-800">{r.namaPetugas}</span>
                      </div>
                      {r.noHpPetugas && (
                        <a
                          href={`https://wa.me/${r.noHpPetugas.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Assalamu'alaikum%20${encodeURIComponent(r.namaPetugas)}%2C%20koordinasi%20saldo%20RKM%20RT%20${r.rt}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Progress Bar KK Lunas */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, r.persentaseLunas)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rincian Finansial RT */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[9px] text-slate-400 block uppercase">Penerimaan</span>
                        <span className="text-xs font-bold text-emerald-800 font-mono">
                          {formatRupiah(r.totalPenerimaanIuran)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[9px] text-slate-400 block uppercase">Santunan</span>
                        <span className="text-xs font-bold text-rose-800 font-mono">
                          {formatRupiah(r.totalSantunanDisalurkan)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                        <span className="text-[9px] text-teal-800 block uppercase font-bold">Saldo Bersih</span>
                        <span className="text-xs font-black text-teal-950 font-mono">
                          {formatRupiah(r.saldoBersih)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReportModalInitialRt(r.rt);
                        setIsReportModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-300" />
                      <span>Cetak Laporan RT {r.rt}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRt(r.rt);
                        setActiveSubTab('iuran');
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Rincian KK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rincian Santunan Duka Kematian Terbaru */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <span>Riwayat Penyaluran Santunan Duka Kematian</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Data realisasi santunan kematian Rp 1.500.000 kepada ahli waris warga RW 018.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('meninggal')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Lihat Semua ({wargaMeninggalList.length})
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 text-center w-8">No</th>
                    <th className="p-2.5">Nama Almarhum/ah</th>
                    <th className="p-2.5 text-center">RT</th>
                    <th className="p-2.5">Tanggal Wafat</th>
                    <th className="p-2.5">Lokasi Pemakaman</th>
                    <th className="p-2.5">Ahli Waris Penerima</th>
                    <th className="p-2.5 text-right">Santunan Duka</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wargaMeninggalList.slice(0, 5).map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {m.nama}
                        <span className="block text-[10px] font-normal text-slate-400">NIK: {m.nik}</span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">RT {m.rt}</td>
                      <td className="p-2.5 text-slate-600 whitespace-nowrap">
                        {formatTanggalIndo(m.tanggalMeninggal)}
                      </td>
                      <td className="p-2.5 text-slate-600">{m.lokasiPemakaman}</td>
                      <td className="p-2.5 text-slate-800">
                        <div className="font-bold">{m.namaAhliWaris}</div>
                        <div className="text-[10px] text-slate-400">Hubungan: {m.hubunganWaris}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                        {formatRupiah(m.santunanRkm)}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {m.statusSantunan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM PENGELOLAAN KARTU IURAN RKM 12 BULAN */}
      {isIuranModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-900 p-4 sm:px-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <span>{editingIuran ? 'Kelola & Edit Kartu Iuran RKM 12 Bulan' : 'Input Kartu Iuran RKM 12 Bulan Baru'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-emerald-950">
                      Tahun {iuranForm.tahun || 2026}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Rukun Kematian Masyarakat (RKM) {profile.namaRw} Kelurahan {profile.kelurahan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIuranModalOpen(false)}
                className="p-2 rounded-full hover:bg-emerald-700/60 text-white transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitIuran} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Notice Banner: Duplicate Switch Notice */}
              {duplicateSwitchNotice && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{duplicateSwitchNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDuplicateSwitchNotice(null)}
                    className="text-blue-500 hover:text-blue-800 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Warning Banner: Strict Duplicate Detection */}
              {isDuplicateDetected && existingIuranRecord && (
                <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-rose-950 text-sm">
                          ⛔ DATA ANGGOTA RKM SUDAH TERDAFTAR! (PENCEGAHAN DATA GANDA)
                        </span>
                        <span className="bg-rose-200/80 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          No. Rek: {existingIuranRecord.noRekening || existingIuranRecord.noKk}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        Warga atas nama <strong className="underline">{existingIuranRecord.namaKepala}</strong> {existingIuranRecord.nik ? `(NIK: ${existingIuranRecord.nik})` : ''} di <strong>RT {existingIuranRecord.rt}</strong> sudah terdaftar dalam data RKM. Sistem melarang penginputan anggota yang sama 2x agar data keanggotaan tidak ganda.
                      </p>
                      <p className="text-xs text-rose-700 font-semibold mt-1">
                        Gunakan tombol di bawah untuk beralih dan menambah pembayaran bulan yang belum dibayar atau tunggakan warga ini:
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSwitchToExistingRecord(existingIuranRecord)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>Alihkan ke Tambah Pembayaran Tunggakan Warga Ini</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD INFO DATA WARGA LENGKAP & STATUS ANGGOTA */}
              {(matchedWarga || iuranForm.namaKepala || iuranForm.nik) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm">Kartu Data Warga & Status Kependudukan</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {matchedWarga ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Terverifikasi di Data Induk Warga
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full">
                          Input Manual (Warga Belum Terdata di Induk)
                        </span>
                      )}
                      <span className="bg-emerald-50 text-emerald-800 font-mono px-2.5 py-0.5 rounded-md font-bold border border-emerald-200">
                        RT {matchedWarga?.rt || iuranForm.rt || '039'} / RW 018
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-500 font-semibold block">Nama Lengkap:</span>
                      <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                        {matchedWarga?.nama || iuranForm.namaKepala || '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Status Keluarga: <strong className="text-slate-700">{matchedWarga?.statusKeluarga || 'Kepala Keluarga'}</strong>
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-500 font-semibold block">NIK & No. Kartu Keluarga:</span>
                      <span className="font-mono font-bold text-slate-900 block mt-0.5">
                        NIK: {matchedWarga?.nik || iuranForm.nik || '-'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 block mt-1">
                        No. KK: {matchedWarga?.noKk || iuranForm.noKk || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-500 font-semibold block">Alamat Domisili & HP:</span>
                      <span className="text-slate-800 font-medium block truncate mt-0.5" title={matchedWarga?.alamat || '-'}>
                        {matchedWarga?.alamat || `Jl. Pala RT ${iuranForm.rt || '039'} RW 018`}
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        No. HP: <strong className="text-slate-800">{matchedWarga?.noHp || '-'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD STATUS PEMBAYARAN KARTU IURAN RKM & SALDO TERAKHIR */}
              {(matchedWarga || iuranForm.namaKepala || iuranForm.nik) && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  activeRecordForPayment
                    ? 'bg-emerald-950/5 border-emerald-300 text-emerald-950'
                    : 'bg-blue-50/60 border-blue-200 text-blue-950'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-2 font-bold">
                      <Coins className="w-4.5 h-4.5 text-emerald-700" />
                      <span className="text-sm">Status Data Pembayaran Kartu Iuran RKM & Saldo Terakhir</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeRecordForPayment ? (
                        <span className="bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ANGGOTA RKM TERDAFTAR (AKTIF)
                        </span>
                      ) : (
                        <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-[11px]">
                          CALON ANGGOTA RKM BARU (Belum Pernah Terdaftar)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detailed Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Card 1: Nomor Rekening / Kartu RKM */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">Nomor Rekening / Kartu RKM:</span>
                      <span className="font-mono font-extrabold text-emerald-800 text-sm block mt-0.5">
                        {activeRecordForPayment?.noRekening || iuranForm.noRekening || '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Kolektor: <strong>{activeRecordForPayment?.penerima || iuranForm.penerima || 'Kolektor RT'}</strong>
                      </span>
                    </div>

                    {/* Card 2: Total Iuran Terbayar */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">Total Iuran Terbayar ({iuranForm.tahun || 2026}):</span>
                      <span className="font-extrabold text-emerald-700 text-sm block mt-0.5">
                        {formatRupiah(currentPaymentStatus.totalNominalTerbayar)}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                        {currentPaymentStatus.totalBulanLunas} dari 12 Bulan Lunas
                      </span>
                    </div>

                    {/* Card 3: Saldo Pembayaran Terakhir */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">Saldo Pembayaran Terakhir:</span>
                      {currentPaymentStatus.bulanTerakhirLunas ? (
                        <>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            Bulan {currentPaymentStatus.bulanTerakhirLunas} {iuranForm.tahun || 2026}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Tgl Bayar: <strong className="text-slate-700">{currentPaymentStatus.tanggalBayarTerakhir ? formatTanggalIndo(currentPaymentStatus.tanggalBayarTerakhir) : '-'}</strong>
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic block mt-0.5">Belum ada pembayaran tercatat</span>
                      )}
                    </div>

                    {/* Card 4: Sisa Tunggakan Belum Dibayar */}
                    <div className={`p-3 rounded-xl border shadow-2xs ${
                      currentPaymentStatus.totalBulanTunggakan === 0
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-rose-50 border-rose-300'
                    }`}>
                      <span className="text-[10px] text-slate-600 font-semibold block">Status Saldo Tunggakan:</span>
                      {currentPaymentStatus.totalBulanTunggakan === 0 ? (
                        <span className="font-extrabold text-emerald-900 text-xs block mt-1">
                          ✓ LUNAS 12 BULAN (TIDAK ADA TUNGGAKAN)
                        </span>
                      ) : (
                        <>
                          <span className="font-extrabold text-rose-800 text-sm block mt-0.5">
                            {formatRupiah(currentPaymentStatus.totalNominalTunggakan)}
                          </span>
                          <span className="text-[10px] text-rose-700 font-bold block mt-1">
                            {currentPaymentStatus.totalBulanTunggakan} Bulan Belum Dibayar
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrears breakdown list if any */}
                  {currentPaymentStatus.totalBulanTunggakan > 0 && currentPaymentStatus.daftarBulanTunggakan.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold text-slate-700">Daftar Bulan Tunggakan:</span>
                      {currentPaymentStatus.daftarBulanTunggakan.map((b) => (
                        <span key={b.bulan} className="bg-rose-100 text-rose-800 font-medium px-2 py-0.5 rounded-md border border-rose-200">
                          {b.namaBulan}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 1: DATA IDENTITAS WARGA & REKENING IURAN */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>1. Input / Kelola Data Warga & Rekening Iuran</span>
                  </div>
                  
                  {/* Quick search/select helper by Nama or NIK from wargaList */}
                  {wargaList.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-[11px] shadow-2xs">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="🔍 Masukkan Nama atau NIK Warga..."
                          value={wargaSearchQuery}
                          onChange={(e) => {
                            setWargaSearchQuery(e.target.value);
                            setIsWargaDropdownOpen(true);
                          }}
                          onFocus={() => setIsWargaDropdownOpen(true)}
                          className="bg-transparent border-none outline-hidden text-xs w-56 font-medium"
                        />
                      </div>
                      {isWargaDropdownOpen && wargaSearchQuery.length >= 2 && (
                        <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 text-xs">
                          <div className="p-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Pilih Warga untuk Otomatis Tampilkan Data & Saldo:
                          </div>
                          {wargaList
                            .filter((w) => w.nama.toLowerCase().includes(wargaSearchQuery.toLowerCase()) || w.nik.includes(wargaSearchQuery))
                            .slice(0, 8)
                            .map((w) => {
                              const alreadyInRkm = iuranRkmList.some(
                                (item) => (item.nik && item.nik === w.nik) || (item.namaKepala.toLowerCase().trim() === w.nama.toLowerCase().trim() && item.rt === w.rt)
                              );
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => handleSelectResidentFromList(w)}
                                  className="w-full text-left p-2 hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 block">{w.nama}</span>
                                    <span className="text-[10px] text-slate-500 font-mono block">NIK: {w.nik} • RT {w.rt}</span>
                                  </div>
                                  {alreadyInRkm ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                      Sudah Anggota RKM
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                                      Anggota Baru
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          <button
                            type="button"
                            onClick={() => setIsWargaDropdownOpen(false)}
                            className="w-full text-center py-1.5 text-[10px] text-slate-400 hover:text-slate-600 border-t border-slate-100 mt-1"
                          >
                            Tutup Pencarian
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Fields: Data Nama, NIK, RT, Kartu/Rekening */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Data Nama Kepala Keluarga / Warga *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan Nama Lengkap Warga"
                      value={iuranForm.namaKepala || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuplicateSwitchNotice(null);
                        const match = wargaList.find((w) => w.nama.toLowerCase().trim() === val.toLowerCase().trim());
                        if (match) {
                          setIuranForm({
                            ...iuranForm,
                            namaKepala: val,
                            nik: match.nik,
                            noKk: match.noKk || iuranForm.noKk,
                            rt: match.rt,
                            penerima: getCollectorByRt(match.rt).nama,
                            noRekening: `RKM-${match.rt}-${match.noKk ? match.noKk.slice(-4) : match.nik.slice(-4)}`
                          });
                        } else {
                          setIuranForm({ ...iuranForm, namaKepala: val });
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="16 Digit NIK Warga"
                      value={iuranForm.nik || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuplicateSwitchNotice(null);
                        const match = wargaList.find((w) => w.nik === val.trim());
                        if (match) {
                          setIuranForm({
                            ...iuranForm,
                            nik: val,
                            namaKepala: match.nama,
                            noKk: match.noKk || iuranForm.noKk,
                            rt: match.rt,
                            penerima: getCollectorByRt(match.rt).nama,
                            noRekening: `RKM-${match.rt}-${match.noKk ? match.noKk.slice(-4) : match.nik.slice(-4)}`
                          });
                        } else {
                          setIuranForm({ ...iuranForm, nik: val });
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Wilayah RT *
                    </label>
                    <select
                      value={iuranForm.rt || '039'}
                      onChange={(e) => {
                        const newRt = e.target.value;
                        const collector = getCollectorByRt(newRt).nama;
                        setIuranForm({
                          ...iuranForm,
                          rt: newRt,
                          penerima: collector,
                          noRekening: `RKM-${newRt}-${iuranForm.noKk?.slice(-4) || '0012'}`
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                    >
                      <option value="039">RT 039 - Petugas: Zaenal Fanani</option>
                      <option value="040">RT 040 - Petugas: Epi</option>
                      <option value="041">RT 041 - Petugas: Etty Herawati</option>
                      <option value="042">RT 042 - Petugas: Sefrizal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kartu / Rekening Iuran 12 Bulan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: RKM-039-0012"
                      value={iuranForm.noRekening || ''}
                      onChange={(e) => setIuranForm({ ...iuranForm, noRekening: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                    />
                  </div>
                </div>

                {/* Secondary Row: No. KK, Tahun, Petugas Kolektor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <input
                      type="text"
                      placeholder="16 Digit Nomor KK"
                      value={iuranForm.noKk || ''}
                      onChange={(e) => setIuranForm({ ...iuranForm, noKk: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Tahun Kartu Iuran
                    </label>
                    <input
                      type="number"
                      value={iuranForm.tahun || 2026}
                      onChange={(e) => {
                        const yr = Number(e.target.value) || 2026;
                        setIuranForm({
                          ...iuranForm,
                          tahun: yr,
                          bulanTahun: String(yr)
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Petugas / Kolektor Wilayah
                    </label>
                    <input
                      type="text"
                      value={iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama}
                      onChange={(e) => setIuranForm({ ...iuranForm, penerima: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TABEL KARTU / REKENING IURAN 12 BULAN */}
              {(() => {
                const rincian = iuranForm.rincian12Bulan || [];
                const summary = calculate12BulanSummary(rincian);
                return (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                      <div>
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                          <Layers className="w-4 h-4 text-emerald-700" />
                          <span>2. Kartu / Rekening Iuran 12 Bulan (Januari – Desember)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Centang ☑ Bayar pada bulan yang telah lunas. Tanggal bayar dan status akan terisi otomatis.
                        </p>
                      </div>

                      {/* Summary Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Lunas:</span>
                          <span className="font-extrabold text-emerald-900">{summary.lunasCount}/12 Bulan</span>
                        </div>
                        <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-2">
                          <span className="text-[10px] text-slate-600 font-bold uppercase">Terbayar:</span>
                          <span className="font-extrabold text-slate-800">{formatRupiah(summary.totalTerbayar)}</span>
                        </div>
                        {summary.sisaTunggakan > 0 && (
                          <div className="bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl flex items-center gap-2">
                            <span className="text-[10px] text-rose-700 font-bold uppercase">Sisa Tunggakan:</span>
                            <span className="font-extrabold text-rose-900">{formatRupiah(summary.sisaTunggakan)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Helper Penambahan Pembayaran Tunggakan */}
                    {currentPaymentStatus.totalBulanTunggakan > 0 && (
                      <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-950 block">
                              Penambahan Pembayaran Tunggakan ({currentPaymentStatus.totalBulanTunggakan} Bulan Belum Dibayar)
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Untuk menambah pembayaran tunggakan warga ini, gunakan tombol cepat di samping atau centang langsung pada tabel bulan di bawah.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <button
                            type="button"
                            onClick={handlePayNextUnpaidMonth}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Bayar 1 Bln Tunggakan ({currentPaymentStatus.daftarBulanTunggakan[0]?.namaBulan || 'Berikutnya'})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handlePayAllRemainingArrears}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lunasi Semua Tunggakan</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Action Toolbar */}
                    <div className="bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-600 mr-1">Tindakan Cepat:</span>
                        <button
                          type="button"
                          onClick={() => handleBulkCheckAll(true)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          ☑ Centang Semua (12 Bulan)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkCheckSemester(1)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          ☑ Semester 1 (Jan-Jun)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkCheckSemester(2)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          ☑ Semester 2 (Jul-Des)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkCheckAll(false)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          Kosongkan Centang
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApplyNominalToAll(10000)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-2xs text-xs"
                        >
                          Terapkan Rp. 10.000 / Bln
                        </button>
                        <button
                          type="button"
                          onClick={handleSetFreeDhuafa}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-2xs text-xs"
                        >
                          Bebas Kas (Dhuafa)
                        </button>
                      </div>
                    </div>

                    {/* The 12-Month Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5 text-center w-12">No</th>
                              <th className="p-2.5 w-36">Bulan (Tahun {iuranForm.tahun || 2026})</th>
                              <th className="p-2.5 text-center w-28">Checkbox ☑ Bayar</th>
                              <th className="p-2.5 w-36">Nominal (Rp)</th>
                              <th className="p-2.5 w-36">Tanggal Bayar</th>
                              <th className="p-2.5">Keterangan / Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rincian.map((item, idx) => (
                              <tr
                                key={item.bulan}
                                className={`transition-colors ${
                                  item.bayar
                                    ? 'bg-emerald-50/50 hover:bg-emerald-50/80'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Kolom No */}
                                <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                                  {item.bulan}
                                </td>

                                {/* Kolom Bulan */}
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        item.bayar ? 'bg-emerald-600' : 'bg-rose-400'
                                      }`}
                                    />
                                    <div>
                                      <span className="font-bold text-slate-800 block">
                                        {item.namaBulan}
                                      </span>
                                      <span className="text-[10px] block">
                                        {item.bayar ? (
                                          <span className="text-emerald-700 font-semibold">
                                            ✓ Lunas ({formatRupiah(item.nominal || 10000)})
                                          </span>
                                        ) : (
                                          <span className="text-rose-600 font-medium">
                                            ⚠️ Tunggakan (Belum Bayar)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Checkbox ☑ Bayar */}
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMonthPaid(idx)}
                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                      item.bayar
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-300'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                                    }`}
                                  >
                                    {item.bayar ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Lunas</span>
                                      </>
                                    ) : (
                                      <span>Belum</span>
                                    )}
                                  </button>
                                </td>

                                {/* Kolom Nominal */}
                                <td className="p-2.5">
                                  <input
                                    type="number"
                                    step={5000}
                                    min={0}
                                    placeholder="10000"
                                    value={item.nominal}
                                    onChange={(e) => handleMonthNominalChange(idx, Number(e.target.value))}
                                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:border-emerald-600 outline-hidden"
                                  />
                                </td>

                                {/* Kolom Tanggal Bayar */}
                                <td className="p-2.5">
                                  <input
                                    type="date"
                                    value={item.tanggalBayar || ''}
                                    onChange={(e) => handleMonthTanggalChange(idx, e.target.value)}
                                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:border-emerald-600 outline-hidden"
                                  />
                                </td>

                                {/* Kolom Keterangan/Status */}
                                <td className="p-2.5">
                                  <select
                                    value={item.status}
                                    onChange={(e) => handleMonthStatusChange(idx, e.target.value as any)}
                                    className={`w-full p-1.5 rounded-lg text-xs font-semibold border ${
                                      item.status === 'Lunas'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : item.status === 'Bebas Iuran (Dhuafa)'
                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                        : 'bg-white border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <option value="Lunas">Lunas</option>
                                    <option value="Belum Lunas">Belum Lunas</option>
                                    <option value="Bebas Iuran (Dhuafa)">Bebas Iuran (Dhuafa)</option>
                                    <option value="Titip RT">Titip RT</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 3: AREA TANDA TANGAN */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span className="font-bold text-emerald-950 text-xs">
                    3. Area Pengesahan & Tanda Tangan Kartu Iuran RKM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  {/* Tanda Tangan: Petugas / Kolektor */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Petugas Kolektor Penerima:</span>
                      <span className="text-xs font-bold text-emerald-900 block mt-0.5">
                        Petugas / Kolektor RT {iuranForm.rt || '039'}
                      </span>
                    </div>

                    <div className="h-16 flex items-center justify-center my-2 border-b border-dashed border-slate-200 text-slate-300 italic text-[11px]">
                      [ Paraf / Tanda Tangan Petugas ]
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-800 underline block">
                        {iuranForm.penerima || getCollectorByRt(iuranForm.rt || '039').nama}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Ketua RT {iuranForm.rt || '039'} RW 018
                      </span>
                    </div>
                  </div>

                  {/* Tanda Tangan: Ketua RKM RW 018 */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Mengetahui & Menyetujui:</span>
                      <span className="text-xs font-bold text-emerald-900 block mt-0.5">
                        Ketua RKM RW 018
                      </span>
                    </div>

                    <div className="h-16 flex items-center justify-center my-2 border-b border-dashed border-slate-200 text-slate-300 italic text-[11px] relative">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-14 h-14 rounded-full border-2 border-emerald-700 flex items-center justify-center text-[8px] font-bold text-emerald-900 rotate-12">
                          RKM RW 018
                        </div>
                      </div>
                      [ Tanda Tangan & Cap Stempel ]
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-800 underline block">
                        {profile.pengurusRkm?.ketua || 'H. Daryanto'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Ketua Pengurus RKM {profile.namaRw}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions: Tombol Melihat Kartu, Tombol Cetak Kartu, Batal & Simpan */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleViewCurrentFormCard}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Tombol Melihat Kartu Iuran 12 Bulan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleViewCurrentFormCard}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Tombol Cetak Kartu</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsIuranModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isDuplicateDetected}
                    title={
                      isDuplicateDetected
                        ? 'Warga ini sudah terdaftar sebagai anggota RKM. Sistem mencegah input data ganda. Alihkan ke warga terdaftar untuk tambah tunggakan.'
                        : 'Simpan data kartu iuran'
                    }
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      isDuplicateDetected
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md cursor-pointer'
                    }`}
                  >
                    {isDuplicateDetected ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Warga Sudah Terdaftar (Cegah Ganda)</span>
                      </>
                    ) : (
                      <span>Simpan Data Kartu Iuran</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & CETAK KARTU IURAN 12 BULAN RESMI */}
      {isCardModalOpen && (
        <RkmCardModal
          record={selectedCardForView}
          profile={profile}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedCardForView(null);
          }}
        />
      )}

      {/* MODAL 2: FORM WARGA MENINGGAL */}
      {isMeninggalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingMeninggal ? 'Edit Data Kematian' : 'Catat Warga Yang Meninggal'}
                </h3>
                <p className="text-xs text-emerald-200">Pelayanan Duka & Santunan RKM RW 018</p>
              </div>
              <button
                onClick={() => setIsMeninggalModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMeninggal} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Nama Almarhum/Almarhumah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Alm. Suwandi bin Kartorejo"
                    value={meninggalForm.nama || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, nama: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="187202xxxxxxxxxx"
                    value={meninggalForm.nik || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, nik: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RT</label>
                  <select
                    value={meninggalForm.rt || '039'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, rt: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="039">RT 039</option>
                    <option value="040">RT 040</option>
                    <option value="041">RT 041</option>
                    <option value="042">RT 042</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={meninggalForm.jenisKelamin || 'L'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, jenisKelamin: e.target.value as Gender })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={meninggalForm.usia || 0}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, usia: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Meninggal *</label>
                  <input
                    type="date"
                    required
                    value={meninggalForm.tanggalMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, tanggalMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Meninggal</label>
                  <input
                    type="text"
                    placeholder="06.30 WIB"
                    value={meninggalForm.waktuMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, waktuMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Meninggal</label>
                  <input
                    type="text"
                    placeholder="Rumah Duka / RSUD Ahmad Yani"
                    value={meninggalForm.tempatMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, tempatMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Pemakaman</label>
                  <input
                    type="text"
                    placeholder="TPU Muslim Iringmulyo"
                    value={meninggalForm.lokasiPemakaman || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, lokasiPemakaman: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Santunan RKM (Rp)</label>
                  <input
                    type="number"
                    step={100000}
                    value={meninggalForm.santunanRkm || 1500000}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, santunanRkm: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Santunan</label>
                  <select
                    value={meninggalForm.statusSantunan || 'Diserahkan'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, statusSantunan: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Diserahkan">Diserahkan</option>
                    <option value="Proses Administrasi">Proses Administrasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Ahli Waris</label>
                  <input
                    type="text"
                    placeholder="Nama anak / pasangan"
                    value={meninggalForm.namaAhliWaris || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, namaAhliWaris: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hubungan</label>
                  <input
                    type="text"
                    placeholder="Anak / Istri / Suami"
                    value={meninggalForm.hubunganWaris || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, hubunganWaris: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA Ahli Waris</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={meninggalForm.noHpWaris || ''}
                  onChange={(e) => setMeninggalForm({ ...meninggalForm, noHpWaris: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMeninggalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Data Wafat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FORM PERLENGKAPAN RKM */}
      {isPerlengkapanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingPerlengkapan ? 'Edit Perlengkapan RKM' : 'Tambah Perlengkapan RKM'}
                </h3>
                <p className="text-xs text-emerald-200">Inventaris Peralatan Jenazah & Duka RW 018</p>
              </div>
              <button
                onClick={() => setIsPerlengkapanModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPerlengkapan} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perlengkapan / Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keranda Jenazah Stainless"
                  value={perlengkapanForm.namaBarang || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, namaBarang: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={perlengkapanForm.kategori || 'Perawatan Jenazah'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kategori: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Perawatan Jenazah">Perawatan Jenazah</option>
                    <option value="Tenda & Kursi">Tenda & Kursi</option>
                    <option value="Sound & Kelistrikan">Sound & Kelistrikan</option>
                    <option value="Kendaraan Jenazah">Kendaraan Jenazah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={perlengkapanForm.kondisi || 'Baik'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kondisi: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={perlengkapanForm.jumlah || 1}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, jumlah: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Unit / Set / Pcs"
                    value={perlengkapanForm.satuan || 'Unit'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, satuan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                <select
                  value={perlengkapanForm.status || 'Tersedia di Gudang'}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, status: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Tersedia di Gudang">Tersedia di Gudang</option>
                  <option value="Dipinjam Warga">Dipinjam Warga</option>
                </select>
              </div>

              {perlengkapanForm.status === 'Dipinjam Warga' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="font-bold text-amber-900">Informasi Peminjaman:</div>
                  <div>
                    <label className="block text-slate-700 mb-0.5">Nama Peminjam / Keluarga</label>
                    <input
                      type="text"
                      placeholder="Nama Warga / RT"
                      value={perlengkapanForm.peminjamSaatIni || ''}
                      onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, peminjamSaatIni: e.target.value })}
                      className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-0.5">No Kontak WA Peminjam</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={perlengkapanForm.kontakPeminjam || ''}
                      onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kontakPeminjam: e.target.value })}
                      className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Penyimpanan</label>
                <input
                  type="text"
                  placeholder="Gudang Balai RW 018"
                  value={perlengkapanForm.lokasiSimpan || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, lokasiSimpan: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                <input
                  type="text"
                  placeholder="Koordinator RKM"
                  value={perlengkapanForm.penanggungJawab || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, penanggungJawab: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPerlengkapanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Inventaris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Data RKM?</h4>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus data: <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN SALDO RKM PER RT & TOTAL RW 018 (PRINT & EXPORT) */}
      {isReportModalOpen && (
        <RkmReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          iuranList={iuranRkmList}
          meninggalList={wargaMeninggalList}
          profile={profile}
          initialRt={reportModalInitialRt}
          initialTahun={2026}
        />
      )}
    </div>
  );
};
