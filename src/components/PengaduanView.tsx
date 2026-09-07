import React, { useState, useMemo } from 'react';
import {
  MessageSquareWarning,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User,
  Phone,
  PhoneCall,
  MapPin,
  Trash2,
  Edit2,
  X,
  MessageCircle,
  ShieldAlert,
  Check
} from 'lucide-react';
import {
  PengaduanItem,
  PengaduanKategori,
  PengaduanStatus,
  PengaduanPrioritas,
  Warga,
  RWProfile,
  AppUser
} from '../types';
import { generateId, formatTanggalIndo } from '../utils/formatters';

interface PengaduanViewProps {
  profile: RWProfile;
  pengaduanList: PengaduanItem[];
  wargaList: Warga[];
  onSavePengaduan: (item: PengaduanItem) => void;
  onDeletePengaduan: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: AppUser | null;
}

export const PengaduanView: React.FC<PengaduanViewProps> = ({
  profile,
  pengaduanList,
  wargaList,
  onSavePengaduan,
  onDeletePengaduan,
  searchQuery,
  onSearchChange,
  currentUser,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPrioritas, setSelectedPrioritas] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [activePengaduan, setActivePengaduan] = useState<PengaduanItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Response Form
  const [responseStatus, setResponseStatus] = useState<PengaduanStatus>('Diproses');
  const [responseTindakLanjut, setResponseTindakLanjut] = useState<string>('');

  const initialForm: Partial<PengaduanItem> = {
    namaPelapor: '',
    nikPelapor: '',
    rt: profile.daftarRt[0] || '039',
    noHpPelapor: '0812',
    kategori: 'Kebersihan & Sampah',
    judul: '',
    isiPengaduan: '',
    lokasiSpesifik: `Wilayah RT ${profile.daftarRt[0] || '039'} ${profile.namaRw}`,
    prioritas: 'Sedang',
    tanggalLapor: new Date().toISOString().slice(0, 10),
    status: 'Masuk',
  };
  const [formData, setFormData] = useState<Partial<PengaduanItem>>(initialForm);

  // Filtered List
  const filteredPengaduan = useMemo(() => {
    return pengaduanList.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.judul.toLowerCase().includes(q) ||
        p.namaPelapor.toLowerCase().includes(q) ||
        p.isiPengaduan.toLowerCase().includes(q) ||
        p.lokasiSpesifik.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchPrioritas = selectedPrioritas === 'ALL' || p.prioritas === selectedPrioritas;

      return matchSearch && matchStatus && matchPrioritas;
    });
  }, [pengaduanList, searchQuery, selectedStatus, selectedPrioritas]);

  // Handle citizen selection
  const handleSelectCitizen = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNik = e.target.value;
    const found = wargaList.find((w) => w.nik === selectedNik);
    if (found) {
      setFormData({
        ...formData,
        namaPelapor: found.nama,
        nikPelapor: found.nik,
        rt: found.rt,
        noHpPelapor: found.noHp || '08',
        lokasiSpesifik: `Sekitar rumah Bpk/Ibu ${found.nama} (RT ${found.rt})`,
      });
    }
  };

  const handleOpenAdd = () => {
    setActivePengaduan(null);
    setFormData({
      ...initialForm,
      tanggalLapor: new Date().toISOString().slice(0, 10),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenRespond = (item: PengaduanItem) => {
    setActivePengaduan(item);
    setResponseStatus(item.status);
    setResponseTindakLanjut(item.tindakLanjut || '');
    setIsRespondModalOpen(true);
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePengaduan) return;

    const updated: PengaduanItem = {
      ...activePengaduan,
      status: responseStatus,
      tindakLanjut: responseTindakLanjut,
      tanggalSelesai: responseStatus === 'Selesai' ? new Date().toISOString().slice(0, 10) : undefined,
    };

    onSavePengaduan(updated);
    setIsRespondModalOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.namaPelapor || !formData.isiPengaduan) {
      alert('Mohon lengkapi Judul, Nama Pelapor, dan Isi Laporan!');
      return;
    }

    const saved: PengaduanItem = {
      id: activePengaduan ? activePengaduan.id : generateId('pgd'),
      namaPelapor: formData.namaPelapor || '',
      nikPelapor: formData.nikPelapor || '',
      rt: formData.rt || profile.daftarRt[0] || '039',
      noHpPelapor: formData.noHpPelapor || '',
      kategori: (formData.kategori as PengaduanKategori) || 'Fasilitas Umum & Jalan',
      judul: formData.judul || '',
      isiPengaduan: formData.isiPengaduan || '',
      lokasiSpesifik: formData.lokasiSpesifik || `Wilayah RT ${formData.rt || profile.daftarRt[0] || '039'} ${profile.namaRw}`,
      prioritas: (formData.prioritas as PengaduanPrioritas) || 'Sedang',
      tanggalLapor: formData.tanggalLapor || new Date().toISOString().slice(0, 10),
      status: (formData.status as PengaduanStatus) || 'Masuk',
      tindakLanjut: formData.tindakLanjut || '',
    };

    onSavePengaduan(saved);
    setIsFormModalOpen(false);
  };

  const handleWhatsAppContact = (phone: string, judul: string, nama: string) => {
    const cleanPhone = phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Halo Bpk/Ibu ${nama}, ini Ketua RW 018 terkait pengaduan Anda mengenai "${judul}". Kami telah menindaklanjuti laporan tersebut.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const allCategories: PengaduanKategori[] = [
    'Keamanan & Ketertiban',
    'Kebersihan & Sampah',
    'Fasilitas Umum & Jalan',
    'Saluran Air & Drainase',
    'Sosial & Tetangga',
    'Lainnya',
  ];

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                Pusat Pengaduan & Aspirasi Warga {profile.namaRw}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {pengaduanList.filter((p) => p.status === 'Masuk' || p.status === 'Diproses').length} Laporan Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Layanan responsif & transparan untuk menampung keluhan fasilitas, sampah, drainase, dan keamanan warga.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Input Pengaduan</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'Masuk', 'Diproses', 'Selesai'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                  selectedStatus === st ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          <select
            value={selectedPrioritas}
            onChange={(e) => setSelectedPrioritas(e.target.value)}
            className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="Tinggi / Darurat">Tinggi / Darurat</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>
        </div>
      </div>

      {/* Emergency Callout */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-rose-950 block">Kejadian Kriminal, Medis, Damkar, atau Kebocoran Listrik Mendesak?</span>
            <span className="text-[11px] text-rose-800/90 block mt-0.5">
              Bhabinkamtibmas (081379712721) • Babinsa (081269138684) • Ambulan (085266725346) • Damkar (081279707203) • PLN (08117901867)
            </span>
          </div>
        </div>
        <a
          href="tel:081379712721"
          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shrink-0 text-center transition-colors shadow-2xs"
        >
          Hubungi Bhabinkamtibmas
        </a>
      </div>

      {/* Complaint List */}
      <div className="space-y-3">
        {filteredPengaduan.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {item.kategori}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    RT {item.rt}
                  </span>
                  {item.prioritas === 'Tinggi / Darurat' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-rose-600" />
                      <span>Darurat</span>
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    item.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'Diproses'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status === 'Selesai' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{item.status}</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mt-2">
                {item.judul}
              </h3>

              <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                &quot;{item.isiPengaduan}&quot;
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pelapor: <strong className="text-slate-800">{item.namaPelapor}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lokasi: {item.lokasiSpesifik}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tgl Lapor: {formatTanggalIndo(item.tanggalLapor)}
                </div>
              </div>

              {/* Tindak Lanjut Box */}
              {item.tindakLanjut && (
                <div className="mt-2 text-xs bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-900">
                  <strong>✅ Tindak Lanjut RW:</strong> {item.tindakLanjut}
                  {item.tanggalSelesai && (
                    <span className="block text-[10px] text-emerald-700 mt-0.5">
                      Diselesaikan pada: {formatTanggalIndo(item.tanggalSelesai)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions Bottom */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentUser?.role !== 'warga' ? (
                  <button
                    onClick={() => handleOpenRespond(item)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update & Tindak Lanjut</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenRespond(item)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Detail Tindak Lanjut RW</span>
                  </button>
                )}

                {item.noHpPelapor && (
                  <button
                    onClick={() => handleWhatsAppContact(item.noHpPelapor, item.judul, item.namaPelapor)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Kirim Pesan WA ke Pelapor"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              {currentUser?.role !== 'warga' && (
                <button
                  onClick={() => setDeleteConfirmId(item.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl"
                  title="Hapus Pengaduan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Response / Tindak Lanjut Modal */}
      {isRespondModalOpen && activePengaduan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800">
                Tindak Lanjut Laporan Warga
              </h4>
              <button
                onClick={() => setIsRespondModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Judul Pengaduan:</span>
              <p className="font-bold text-slate-800 text-sm">{activePengaduan.judul}</p>
              <p className="text-slate-500 mt-0.5">
                Pelapor: {activePengaduan.namaPelapor} (RT {activePengaduan.rt})
              </p>
            </div>

            <form onSubmit={handleSaveResponse} className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Penanganan *</label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value as PengaduanStatus)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Masuk">Masuk (Belum Diproses)</option>
                  <option value="Diproses">Diproses (Sedang Dikerjakan)</option>
                  <option value="Selesai">Selesai (Tuntas)</option>
                  <option value="Ditolak">Ditolak / Luar Wewenang</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Uraian Tindak Lanjut / Solusi Pengurus RW *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Petugas kebersihan RW telah membersihkan tumpukan sampah dan saluran air telah diperbaiki."
                  value={responseTindakLanjut}
                  onChange={(e) => setResponseTindakLanjut(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRespondModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Tindak Lanjut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Input Pengaduan Baru */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-rose-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Catat Pengaduan Warga Baru</h3>
                <p className="text-xs text-rose-200">Layanan Aspirasi & Keluhan RW 018</p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-rose-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              {/* Quick Select Warga */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <label className="block font-bold text-rose-900 mb-1">
                  Pilih Pelapor dari Database Warga (Opsional)
                </label>
                <select
                  onChange={handleSelectCitizen}
                  className="w-full p-2 bg-white border border-rose-300 rounded-lg font-semibold"
                >
                  <option value="">-- Warga Terdaftar / Input Manual --</option>
                  {wargaList.map((w) => (
                    <option key={w.id} value={w.nik}>
                      {w.nama} (NIK: {w.nik} - RT {w.rt})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Laporan / Keluhan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lampu Penerangan Jalan Gang Merpati Mati"
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Pengaduan</label>
                  <select
                    value={formData.kategori || 'Fasilitas Umum & Jalan'}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as PengaduanKategori })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas Penanganan</label>
                  <select
                    value={formData.prioritas || 'Sedang'}
                    onChange={(e) =>
                      setFormData({ ...formData, prioritas: e.target.value as PengaduanPrioritas })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi / Darurat">Tinggi / Darurat</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Pelapor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Warga"
                    value={formData.namaPelapor || ''}
                    onChange={(e) => setFormData({ ...formData, namaPelapor: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RT Pelapor</label>
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
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Pelapor</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={formData.noHpPelapor || ''}
                    onChange={(e) => setFormData({ ...formData, noHpPelapor: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Spesifik Kejadian</label>
                  <input
                    type="text"
                    placeholder="Depan Pos Kamling RT 002"
                    value={formData.lokasiSpesifik || ''}
                    onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rincian Isi Pengaduan / Kronologi *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan secara rinci kendala atau kondisi di lapangan..."
                  value={formData.isiPengaduan || ''}
                  onChange={(e) => setFormData({ ...formData, isiPengaduan: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 text-white rounded-xl font-bold"
                >
                  Kirim Laporan Pengaduan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Arsip Pengaduan?</h4>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePengaduan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
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
