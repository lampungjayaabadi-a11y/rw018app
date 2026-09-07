import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Filter,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  Trash2,
  Edit2,
  Download,
  ExternalLink,
  MessageCircle,
  X,
  Store,
  Award,
  Utensils,
  Wrench,
  Palette,
  Scissors,
  Sprout,
  Package,
  RotateCcw,
  Sparkles,
  Clock,
  BadgePercent,
  Check
} from 'lucide-react';
import { UmkmItem, UmkmCategory, Warga, RWProfile } from '../types';
import { generateId, formatRupiah } from '../utils/formatters';

interface UmkmViewProps {
  profile: RWProfile;
  umkmList: UmkmItem[];
  wargaList: Warga[];
  onSaveUMKM: (item: UmkmItem) => void;
  onDeleteUMKM: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export type CategoryFilterKey =
  | 'ALL'
  | 'KULINER'
  | 'JASA'
  | 'KERAJINAN'
  | 'SEMBAKO'
  | 'FASHION'
  | 'PERTANIAN'
  | 'LAINNYA';

interface CategoryFilterDef {
  id: CategoryFilterKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  activeColor: string;
  cardColor: string;
  matches: (category: string) => boolean;
}

export const UmkmView: React.FC<UmkmViewProps> = ({
  profile,
  umkmList,
  wargaList,
  onSaveUMKM,
  onDeleteUMKM,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryFilterKey>('ALL');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [onlyBinaanRw, setOnlyBinaanRw] = useState<boolean>(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUMKM, setEditingUMKM] = useState<UmkmItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper safe accessors
  const getOwnerName = (u: UmkmItem) => u.namaPemilik || u.pemilik || 'Warga RW 018';
  const getPhoneNumber = (u: UmkmItem) => u.kontakHp || u.noWa || '';
  const getDescription = (u: UmkmItem) => u.deskripsiProduk || u.deskripsi || '';

  // Category definitions with regex matching for maximum compatibility
  const categoryFilters: CategoryFilterDef[] = useMemo(
    () => [
      {
        id: 'ALL',
        label: 'Semua Kategori',
        shortLabel: 'Semua',
        icon: ShoppingBag,
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        activeColor: 'bg-slate-900 text-white shadow-xs',
        cardColor: 'border-slate-200',
        matches: () => true,
      },
      {
        id: 'KULINER',
        label: 'Kuliner & Makanan',
        shortLabel: 'Kuliner',
        icon: Utensils,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        activeColor: 'bg-amber-600 text-white shadow-xs',
        cardColor: 'border-amber-200 bg-amber-50/20',
        matches: (c: string) => /kuliner|makanan|kue|snack|catering|minuman/i.test(c || ''),
      },
      {
        id: 'JASA',
        label: 'Jasa & Servis / Reparasi',
        shortLabel: 'Jasa & Servis',
        icon: Wrench,
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
        activeColor: 'bg-sky-600 text-white shadow-xs',
        cardColor: 'border-sky-200 bg-sky-50/20',
        matches: (c: string) => /jasa|servis|reparasi|bengkel|elektronik/i.test(c || ''),
      },
      {
        id: 'KERAJINAN',
        label: 'Kerajinan & Seni Kreatif',
        shortLabel: 'Kerajinan',
        icon: Palette,
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        activeColor: 'bg-purple-600 text-white shadow-xs',
        cardColor: 'border-purple-200 bg-purple-50/20',
        matches: (c: string) => /kerajinan|seni|souvenir|anyaman|kreatif|dekorasi/i.test(c || ''),
      },
      {
        id: 'SEMBAKO',
        label: 'Sembako & Toko Kelontong',
        shortLabel: 'Sembako & Toko',
        icon: Store,
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        activeColor: 'bg-emerald-700 text-white shadow-xs',
        cardColor: 'border-emerald-200 bg-emerald-50/20',
        matches: (c: string) => /sembako|toko|kelontong|agen|galon|gas/i.test(c || ''),
      },
      {
        id: 'FASHION',
        label: 'Fashion & Konveksi / Jahit',
        shortLabel: 'Fashion & Jahit',
        icon: Scissors,
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        activeColor: 'bg-rose-600 text-white shadow-xs',
        cardColor: 'border-rose-200 bg-rose-50/20',
        matches: (c: string) => /fashion|konveksi|jahit|busana|tailor/i.test(c || ''),
      },
      {
        id: 'PERTANIAN',
        label: 'Pertanian & Ternak Urban',
        shortLabel: 'Pertanian',
        icon: Sprout,
        badgeColor: 'bg-lime-100 text-lime-900 border-lime-300',
        activeColor: 'bg-lime-700 text-white shadow-xs',
        cardColor: 'border-lime-200 bg-lime-50/20',
        matches: (c: string) => /pertanian|peternakan|ternak|urban|hidroponik/i.test(c || ''),
      },
      {
        id: 'LAINNYA',
        label: 'Usaha Lainnya',
        shortLabel: 'Lainnya',
        icon: Package,
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        activeColor: 'bg-slate-700 text-white shadow-xs',
        cardColor: 'border-slate-200 bg-slate-50/20',
        matches: (c: string) => /lainnya/i.test(c || ''),
      },
    ],
    []
  );

  // Helper to find filter def for a given unit
  const getCategoryDefForUnit = (categoryString: string): CategoryFilterDef => {
    const found = categoryFilters
      .slice(1) // skip 'ALL'
      .find((f) => f.matches(categoryString));
    return (
      found || {
        id: 'LAINNYA',
        label: categoryString || 'Usaha Lainnya',
        shortLabel: categoryString || 'Lainnya',
        icon: Package,
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        activeColor: 'bg-slate-700 text-white',
        cardColor: 'border-slate-200',
        matches: () => true,
      }
    );
  };

  const initialForm: Partial<UmkmItem> = {
    namaUsaha: '',
    namaPemilik: '',
    pemilik: '',
    nikPemilik: '',
    kategori: 'Kuliner & Makanan',
    rt: profile.daftarRt[0] || '039',
    alamatUsaha: `Wilayah RT ${profile.daftarRt[0] || '039'} ${profile.namaRw}`,
    kontakHp: '08',
    noWa: '08',
    deskripsiProduk: '',
    deskripsi: '',
    jamBuka: '08.00 - 17.00 WIB',
    kisaranHarga: 'Terjangkau Warga',
    izinUsaha: 'NIB',
    omsetBulanan: 3500000,
    jumlahKaryawan: 1,
    isBinaanRw: true,
    statusAktif: true,
  };
  const [formData, setFormData] = useState<Partial<UmkmItem>>(initialForm);

  // Filtered UMKM
  const filteredUMKM = useMemo(() => {
    return umkmList.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const namaUsaha = (u.namaUsaha || '').toLowerCase();
      const namaPemilik = getOwnerName(u).toLowerCase();
      const deskripsi = getDescription(u).toLowerCase();
      const kategori = (u.kategori || '').toLowerCase();
      const alamat = (u.alamatUsaha || '').toLowerCase();
      const rt = (u.rt || '').toLowerCase();

      const matchSearch =
        !q ||
        namaUsaha.includes(q) ||
        namaPemilik.includes(q) ||
        deskripsi.includes(q) ||
        kategori.includes(q) ||
        alamat.includes(q) ||
        rt.includes(q);

      // Match Category
      let matchCat = true;
      if (selectedCategoryKey !== 'ALL') {
        const activeFilter = categoryFilters.find((f) => f.id === selectedCategoryKey);
        if (activeFilter) {
          matchCat = activeFilter.matches(u.kategori || '');
        }
      }

      // Match RT
      const matchRt = selectedRt === 'ALL' || u.rt === selectedRt;

      // Match Binaan RW
      const matchBinaan = !onlyBinaanRw || u.isBinaanRw === true;

      return matchSearch && matchCat && matchRt && matchBinaan;
    });
  }, [umkmList, searchQuery, selectedCategoryKey, selectedRt, onlyBinaanRw, categoryFilters]);

  // Handle citizen selection
  const handleSelectCitizen = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNik = e.target.value;
    const found = wargaList.find((w) => w.nik === selectedNik);
    if (found) {
      setFormData({
        ...formData,
        namaPemilik: found.nama,
        pemilik: found.nama,
        nikPemilik: found.nik,
        rt: found.rt,
        kontakHp: found.noHp || '08',
        noWa: found.noHp || '08',
        alamatUsaha: `${found.alamat}, RT ${found.rt} RW 018`,
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingUMKM(null);
    setFormData({ ...initialForm });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: UmkmItem) => {
    setEditingUMKM(item);
    setFormData({
      ...item,
      namaPemilik: getOwnerName(item),
      kontakHp: getPhoneNumber(item),
      deskripsiProduk: getDescription(item),
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaUsaha || (!formData.namaPemilik && !formData.pemilik)) {
      alert('Mohon lengkapi Nama Usaha dan Nama Pemilik!');
      return;
    }

    const owner = formData.namaPemilik || formData.pemilik || '';
    const phone = formData.kontakHp || formData.noWa || '';
    const desc = formData.deskripsiProduk || formData.deskripsi || '';

    const saved: UmkmItem = {
      id: editingUMKM ? editingUMKM.id : generateId('umkm'),
      namaUsaha: formData.namaUsaha || '',
      namaPemilik: owner,
      pemilik: owner,
      nikPemilik: formData.nikPemilik || '',
      kategori: (formData.kategori as UmkmCategory) || 'Kuliner & Makanan',
      rt: formData.rt || profile.daftarRt[0] || '039',
      alamatUsaha:
        formData.alamatUsaha ||
        `Wilayah RT ${formData.rt || profile.daftarRt[0] || '039'} ${profile.namaRw}`,
      kontakHp: phone,
      noWa: phone,
      deskripsiProduk: desc,
      deskripsi: desc,
      jamBuka: formData.jamBuka || '08.00 - 17.00 WIB',
      kisaranHarga: formData.kisaranHarga || 'Terjangkau',
      izinUsaha: formData.izinUsaha || 'Belum Ada',
      omsetBulanan: Number(formData.omsetBulanan) || 0,
      jumlahKaryawan: Number(formData.jumlahKaryawan) || 1,
      isBinaanRw: formData.isBinaanRw !== undefined ? formData.isBinaanRw : true,
      statusAktif: formData.statusAktif !== undefined ? formData.statusAktif : true,
    };

    onSaveUMKM(saved);
    setIsFormModalOpen(false);
  };

  const handleWhatsAppOrder = (phone: string, usahaName: string) => {
    const cleanPhone = phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Halo Bapak/Ibu pengelola ${usahaName}, saya warga RW 018 ingin bertanya seputar produk/layanan Anda.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleExportCSV = () => {
    const headers = [
      'Nama Usaha',
      'Kategori',
      'Nama Pemilik',
      'NIK',
      'RT',
      'Alamat',
      'No HP/WA',
      'Legalitas / Izin',
      'Jam Buka',
      'Kisaran Harga',
      'Binaan RW',
      'Deskripsi Produk',
    ];
    const rows = filteredUMKM.map((u) => [
      `"${u.namaUsaha}"`,
      `"${u.kategori}"`,
      `"${getOwnerName(u)}"`,
      `="${u.nikPemilik}"`,
      `RT ${u.rt}`,
      `"${u.alamatUsaha}"`,
      `="${getPhoneNumber(u)}"`,
      `"${u.izinUsaha || '-'}"`,
      `"${u.jamBuka || '-'}"`,
      `"${u.kisaranHarga || '-'}"`,
      u.isBinaanRw ? 'Binaan RW 018' : 'Mandiri',
      `"${getDescription(u)}"`,
    ]);
    const csv =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `Direktori_UMKM_RW018_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleResetFilters = () => {
    setSelectedCategoryKey('ALL');
    setSelectedRt('ALL');
    setOnlyBinaanRw(false);
    onSearchChange('');
  };

  const isAnyFilterActive =
    selectedCategoryKey !== 'ALL' ||
    selectedRt !== 'ALL' ||
    onlyBinaanRw ||
    Boolean(searchQuery.trim());

  const availableCategoriesForForm: UmkmCategory[] = [
    'Kuliner & Makanan',
    'Jasa & Servis',
    'Jasa & Reparasi',
    'Kerajinan & Seni',
    'Sembako & Toko',
    'Toko Kelontong & Sembako',
    'Fashion & Konveksi',
    'Pertanian & Peternakan Urban',
    'Lainnya',
  ];

  return (
    <div className="space-y-4 p-3.5 sm:p-4 pb-16 max-w-6xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Direktori & Pemberdayaan UMKM Warga {profile.namaRw}</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {umkmList.length} Unit Usaha Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Daftar produk kuliner, jasa perbaikan, kerajinan tangan, sembako, dan aneka usaha
              mandiri warga untuk menggerakkan perekonomian lokal lingkungan RW 018.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Ekspor Direktori UMKM ke file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Usaha</span>
            </button>
          </div>
        </div>

        {/* SEARCH & SECONDARY FILTER BAR */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Direct Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama toko, jenis produk, kuliner, bengkel, atau nama pemilik..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-400 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RT Filter Select */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Wilayah:</span>
            <button
              type="button"
              onClick={() => setSelectedRt('ALL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRt === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua RT
            </button>
            {profile.daftarRt.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => setSelectedRt(rt)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRt === rt
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                RT {rt}
              </button>
            ))}

            {/* Binaan RW Toggle */}
            <button
              type="button"
              onClick={() => setOnlyBinaanRw(!onlyBinaanRw)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                onlyBinaanRw
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
              title="Tampilkan hanya unit usaha yang dibina resmi oleh RW 018"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Binaan RW</span>
            </button>
          </div>
        </div>

        {/* CATEGORY FILTER TABS (Kuliner, Jasa, Kerajinan, Sembako, dll) */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Pilih Kategori Bidang Usaha:</span>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {categoryFilters.map((cat) => {
              const count =
                cat.id === 'ALL'
                  ? umkmList.length
                  : umkmList.filter((u) => cat.matches(u.kategori || '')).length;
              const isActive = selectedCategoryKey === cat.id;
              const IconComp = cat.icon;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryKey(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? cat.activeColor
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-black/20 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILTER STATUS & RESULT COUNT BAR */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Menampilkan <strong className="text-slate-800">{filteredUMKM.length}</strong> dari{' '}
          <strong className="text-slate-800">{umkmList.length}</strong> unit usaha
          {selectedCategoryKey !== 'ALL' && (
            <span className="ml-1 text-amber-700 font-semibold">
              • Kategori:{' '}
              {categoryFilters.find((f) => f.id === selectedCategoryKey)?.label}
            </span>
          )}
          {selectedRt !== 'ALL' && (
            <span className="ml-1 text-emerald-700 font-semibold">• RT {selectedRt}</span>
          )}
          {onlyBinaanRw && (
            <span className="ml-1 text-amber-600 font-semibold">• Binaan RW</span>
          )}
        </div>

        {isAnyFilterActive && (
          <button
            onClick={handleResetFilters}
            className="text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
          >
            Tampilkan Semua
          </button>
        )}
      </div>

      {/* UMKM Cards Grid */}
      {filteredUMKM.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredUMKM.map((umkm) => {
            const catDef = getCategoryDefForUnit(umkm.kategori);
            const CatIcon = catDef.icon;
            const owner = getOwnerName(umkm);
            const phone = getPhoneNumber(umkm);
            const desc = getDescription(umkm);

            return (
              <div
                key={umkm.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 space-y-3">
                  {/* Card Header: Category badge + RT + Binaan */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${catDef.badgeColor}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        <span>{umkm.kategori}</span>
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                        RT {umkm.rt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {umkm.isBinaanRw && (
                        <span
                          className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                          title="Unit Usaha Binaan RW 018"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Binaan RW</span>
                        </span>
                      )}

                      {umkm.izinUsaha && umkm.izinUsaha !== 'Belum Ada' && (
                        <span
                          className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5"
                          title={`Legalitas: ${umkm.izinUsaha}`}
                        >
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span className="max-w-[80px] truncate">{umkm.izinUsaha}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Business Title & Owner */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                      {umkm.namaUsaha}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pengelola: <strong className="text-slate-800">{owner}</strong>
                    </p>
                  </div>

                  {/* Description Box */}
                  <p className="text-xs text-slate-700 bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {desc || 'Menyediakan produk dan layanan unggulan untuk warga lingkungan RW 018.'}
                  </p>

                  {/* Operational Details (Hours, Price Range, Location) */}
                  <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                    {umkm.jamBuka && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Jam Buka: <strong className="text-slate-800">{umkm.jamBuka}</strong></span>
                      </div>
                    )}

                    {umkm.kisaranHarga && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Harga: <strong className="text-emerald-700">{umkm.kisaranHarga}</strong></span>
                      </div>
                    )}

                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px]">{umkm.alamatUsaha}</span>
                    </div>

                    {phone && (
                      <div className="flex items-center gap-1.5 font-mono text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: WhatsApp Order Button & Admin Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {phone ? (
                    <button
                      onClick={() => handleWhatsAppOrder(phone, umkm.namaUsaha)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat / Order WA</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Kontak belum tersedia</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(umkm)}
                      className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Edit Data UMKM"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(umkm.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Hapus UMKM"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              Tidak Ditemukan Unit Usaha yang Cocok
            </h4>
            <p className="text-xs text-slate-500">
              Tidak ada data UMKM yang sesuai dengan kriteria pencarian atau kategori yang Anda pilih saat ini.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Semua Filter
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Daftarkan Usaha Baru
            </button>
          </div>
        </div>
      )}

      {/* Form Tambah / Edit UMKM Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-amber-700 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingUMKM ? 'Edit Data UMKM' : 'Pendaftaran UMKM Warga RW 018'}
                </h3>
                <p className="text-xs text-amber-200">Direktori Usaha Mikro, Kecil & Menengah</p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-amber-600 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              {/* Quick Select Warga */}
              {!editingUMKM && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="block font-bold text-amber-900 mb-1">
                    Pilih Pemilik dari Database Warga
                  </label>
                  <select
                    onChange={handleSelectCitizen}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold"
                  >
                    <option value="">-- Pilih Warga Terdaftar --</option>
                    {wargaList
                      .slice()
                      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                      .map((w) => (
                        <option key={w.id} value={w.nik}>
                          {w.nama} (NIK: {w.nik} - RT {w.rt})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Usaha / Toko / Warung *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kue & Snack Basah Dapur Bu Nurul"
                  value={formData.namaUsaha || ''}
                  onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Usaha</label>
                  <select
                    value={formData.kategori || 'Kuliner & Makanan'}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as UmkmCategory })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {availableCategoriesForForm.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RT</label>
                  <select
                    value={formData.rt || profile.daftarRt[0] || '039'}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    {profile.daftarRt.map((rt) => (
                      <option key={rt} value={rt}>
                        RT {rt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pemilik *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pemilik"
                    value={formData.namaPemilik || formData.pemilik || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        namaPemilik: e.target.value,
                        pemilik: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={formData.kontakHp || formData.noWa || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kontakHp: e.target.value,
                        noWa: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Usaha</label>
                <input
                  type="text"
                  placeholder={`Jl. Pala No. 12 RT ${profile.daftarRt[0] || '039'} ${profile.namaRw}`}
                  value={formData.alamatUsaha || ''}
                  onChange={(e) => setFormData({ ...formData, alamatUsaha: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Menu / Produk Unggulan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Menyediakan snack box arisan, kue bolu marmer, lemper ayam, risoles..."
                  value={formData.deskripsiProduk || formData.deskripsi || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deskripsiProduk: e.target.value,
                      deskripsi: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Buka Operasional</label>
                  <input
                    type="text"
                    placeholder="Contoh: 08.00 - 17.00 WIB"
                    value={formData.jamBuka || ''}
                    onChange={(e) => setFormData({ ...formData, jamBuka: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kisaran Harga</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 5.000 - Rp 50.000"
                    value={formData.kisaranHarga || ''}
                    onChange={(e) => setFormData({ ...formData, kisaranHarga: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Izin / Sertifikasi</label>
                  <input
                    type="text"
                    placeholder="NIB, P-IRT, Sertifikat Halal"
                    value={formData.izinUsaha || ''}
                    onChange={(e) => setFormData({ ...formData, izinUsaha: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Omset/Bulan (Rp)</label>
                  <input
                    type="number"
                    step={500000}
                    value={formData.omsetBulanan || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, omsetBulanan: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isBinaanRw ?? true}
                    onChange={(e) => setFormData({ ...formData, isBinaanRw: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Tandai sebagai Unit Usaha Binaan RW 018</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 active:scale-95 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan UMKM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Data UMKM?</h4>
            <p className="text-xs text-slate-500">
              Unit usaha ini akan dihapus dari direktori warga RW 018.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteUMKM(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
