import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Square,
  Triangle,
  Circle,
  Star,
  Camera,
  Lightbulb,
  Shield,
  AlertTriangle,
  Store,
  HeartPulse,
  Home,
  Trees,
  Check,
  Trash2,
  Move,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { CustomPetaMarker, SimbolBentukType } from '../../data/petaData';

interface CustomMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (marker: CustomPetaMarker) => void;
  onDelete?: (id: string) => void;
  editingMarker?: CustomPetaMarker | null;
  initialPos?: { x: number; y: number } | null;
  selectedRtDefault?: string;
  onStartClickToPlace?: (draftData: Partial<CustomPetaMarker>) => void;
}

const SHAPE_OPTIONS: { id: SimbolBentukType; label: string; icon: any; defaultColor: string; description: string }[] = [
  { id: 'pin', label: 'Pin Lokasi', icon: MapPin, defaultColor: '#2563eb', description: 'Titik penanda lokasi penting' },
  { id: 'kotak', label: 'Gardu Pos Ronda (Kotak Hitam)', icon: Square, defaultColor: '#000000', description: 'Pos kamling & siskamling malam' },
  { id: 'segitiga', label: 'Masjid / Tempat Ibadah', icon: Triangle, defaultColor: '#059669', description: 'Simbol segitiga tempat ibadah' },
  { id: 'portal', label: 'Portal / Penutupan Jalan', icon: AlertTriangle, defaultColor: '#dc2626', description: 'Palang pintu & gerbang malam' },
  { id: 'kamera', label: 'Kamera CCTV Pantau', icon: Camera, defaultColor: '#0284c7', description: 'Titik kamera keamanan surveillance' },
  { id: 'lampu', label: 'Lampu Jalan PJU', icon: Lightbulb, defaultColor: '#eab308', description: 'Titik penerangan jalan umum' },
  { id: 'shield', label: 'Pos Jaga / Keamanan', icon: Shield, defaultColor: '#475569', description: 'Pos satpam / posko darurat' },
  { id: 'toko', label: 'Warung UMKM / Kios', icon: Store, defaultColor: '#ea580c', description: 'Tempat usaha & UMKM warga' },
  { id: 'medis', label: 'Posyandu & Fasum', icon: HeartPulse, defaultColor: '#db2777', description: 'Pelayanan kesehatan & balai RW' },
  { id: 'rumah', label: 'Rumah Warga / Tokoh', icon: Home, defaultColor: '#16a34a', description: 'Kediaman warga / pengurus RT' },
  { id: 'taman', label: 'Taman / Lapangan Hijau', icon: Trees, defaultColor: '#10b981', description: 'Area terbuka hijau & olahraga' },
  { id: 'bintang', label: 'Titik Khusus / Utama', icon: Star, defaultColor: '#d97706', description: 'Penanda prioritas istimewa' },
  { id: 'lingkaran', label: 'Titik Lingkaran Ringkas', icon: Circle, defaultColor: '#6366f1', description: 'Simbol titik koordinat ringkas' },
  { id: 'peringatan', label: 'Titik Rawan / Hati-hati', icon: AlertTriangle, defaultColor: '#ef4444', description: 'Lokasi rawan genangan / tikungan' }
];

const PRESET_COLORS = [
  { label: 'Merah (RT 039)', color: '#ef4444' },
  { label: 'Hijau (RT 040)', color: '#22c55e' },
  { label: 'Orange (RT 041)', color: '#f97316' },
  { label: 'Kuning (RT 042)', color: '#eab308' },
  { label: 'Hitam Pos Ronda', color: '#000000' },
  { label: 'Biru Pemda RW', color: '#2563eb' },
  { label: 'Emerald Masjid', color: '#059669' },
  { label: 'Ungu Fasum', color: '#7c3aed' },
  { label: 'Pink Posyandu', color: '#db2777' },
  { label: 'Cyan CCTV', color: '#06b6d4' }
];

export const CustomMarkerModal: React.FC<CustomMarkerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMarker,
  initialPos,
  selectedRtDefault = 'UMUM',
  onStartClickToPlace
}) => {
  const [nama, setNama] = useState('');
  const [simbolBentuk, setSimbolBentuk] = useState<SimbolBentukType>('pin');
  const [rt, setRt] = useState<'039' | '040' | '041' | '042' | 'UMUM'>('UMUM');
  const [warna, setWarna] = useState('#2563eb');
  const [keterangan, setKeterangan] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [kontak, setKontak] = useState('');
  const [svgPos, setSvgPos] = useState({ x: 500, y: 440 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMarker) {
      setNama(editingMarker.nama);
      setSimbolBentuk(editingMarker.simbolBentuk);
      setRt(editingMarker.rt);
      setWarna(editingMarker.warna);
      setKeterangan(editingMarker.keterangan || '');
      setPenanggungJawab(editingMarker.penanggungJawab || '');
      setKontak(editingMarker.kontak || '');
      setSvgPos(editingMarker.svgPos || { x: 500, y: 440 });
    } else {
      setNama('');
      setSimbolBentuk('pin');
      const validRt = ['039', '040', '041', '042'].includes(selectedRtDefault)
        ? (selectedRtDefault as '039' | '040' | '041' | '042')
        : 'UMUM';
      setRt(validRt);
      setWarna(
        validRt === '039'
          ? '#ef4444'
          : validRt === '040'
          ? '#22c55e'
          : validRt === '041'
          ? '#f97316'
          : validRt === '042'
          ? '#eab308'
          : '#2563eb'
      );
      setKeterangan('');
      setPenanggungJawab('');
      setKontak('');
      setSvgPos(initialPos || { x: 500, y: 440 });
    }
    setErrors({});
  }, [editingMarker, initialPos, isOpen, selectedRtDefault]);

  if (!isOpen) return null;

  const handleShapeSelect = (shape: SimbolBentukType) => {
    setSimbolBentuk(shape);
    const shapeCfg = SHAPE_OPTIONS.find(s => s.id === shape);
    if (shapeCfg && (!editingMarker || warna === '#2563eb')) {
      if (shape === 'kotak') setWarna('#000000');
      else if (shape === 'segitiga') setWarna('#059669');
      else if (shape === 'portal') setWarna('#dc2626');
      else if (shape === 'kamera') setWarna('#0284c7');
    }
  };

  const handleRtSelect = (newRt: '039' | '040' | '041' | '042' | 'UMUM') => {
    setRt(newRt);
    if (simbolBentuk !== 'kotak') {
      if (newRt === '039') setWarna('#ef4444');
      else if (newRt === '040') setWarna('#22c55e');
      else if (newRt === '041') setWarna('#f97316');
      else if (newRt === '042') setWarna('#eab308');
      else setWarna('#2563eb');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!nama.trim()) {
      newErrors.nama = 'Nama simbol tanda wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedShape = SHAPE_OPTIONS.find(s => s.id === simbolBentuk);

    const markerData: CustomPetaMarker = {
      id: editingMarker?.id || `custom-marker-${Date.now()}`,
      nama: nama.trim(),
      simbolBentuk,
      kategoriLabel: selectedShape?.label || 'Simbol Wilayah',
      rt,
      warna,
      keterangan: keterangan.trim(),
      penanggungJawab: penanggungJawab.trim() || undefined,
      kontak: kontak.trim() || undefined,
      svgPos,
      createdAt: editingMarker?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(markerData);
    onClose();
  };

  const handlePickOnMap = () => {
    if (onStartClickToPlace) {
      onStartClickToPlace({
        id: editingMarker?.id,
        nama: nama.trim() || 'Simbol Tanda Baru',
        simbolBentuk,
        rt,
        warna,
        keterangan: keterangan.trim(),
        penanggungJawab: penanggungJawab.trim(),
        kontak: kontak.trim()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {editingMarker ? 'Edit Simbol Tanda Peta' : 'Letakkan Simbol Tanda pada Peta Satelit'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                Pilih jenis simbol, warna RT, dan atur posisi presisi di peta visual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* 1. Nama Tanda / Simbol */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Nama Simbol Tanda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Gardu Pos Ronda Baru, Titik Lampu Belokan, CCTV Gang Manggis..."
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none text-xs"
            />
            {errors.nama && <p className="text-red-500 text-[11px] mt-1">{errors.nama}</p>}
          </div>

          {/* 2. Pilihan Bentuk Simbol Visual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Bentuk & Jenis Simbol Peta</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              {SHAPE_OPTIONS.map((shape) => {
                const IconComponent = shape.icon;
                const isSelected = simbolBentuk === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleShapeSelect(shape.id)}
                    className={`p-2 rounded-xl flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isSelected ? warna : 'rgba(100, 116, 139, 0.15)',
                        color: isSelected ? (warna === '#000000' ? '#ffffff' : '#ffffff') : '#64748b'
                      }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[11px] block truncate">{shape.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Pilihan RT & Warna Tema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pilihan Blok RT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Wilayah Blok RT
              </label>
              <div className="grid grid-cols-5 gap-1">
                {(['039', '040', '041', '042', 'UMUM'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRtSelect(r)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                      rt === r
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs ring-2 ring-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r === 'UMUM' ? 'RW' : `RT ${r}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Warna Simbol Visual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                <span>Warna Simbol</span>
                <span className="text-[10px] font-mono text-slate-400">{warna}</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_COLORS.map((pc) => (
                  <button
                    key={pc.color}
                    type="button"
                    onClick={() => setWarna(pc.color)}
                    title={pc.label}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      warna.toLowerCase() === pc.color.toLowerCase()
                        ? 'scale-125 ring-2 ring-emerald-500 ring-offset-1 border-white'
                        : 'border-white/50 hover:scale-110'
                    }`}
                    style={{ backgroundColor: pc.color }}
                  />
                ))}
                {/* Custom Color Input */}
                <input
                  type="color"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                  className="w-6 h-6 rounded-full p-0 border-0 cursor-pointer overflow-hidden"
                  title="Pilih warna bebas"
                />
              </div>
            </div>
          </div>

          {/* 4. Keterangan / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Keterangan / Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan peruntukan tanda, fasilitas di sekitar, atau catatan penting lainnya..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* 5. Penanggung Jawab & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Penanggung Jawab / Pengelola
              </label>
              <input
                type="text"
                placeholder="Contoh: Bpk. Zaenal (Ketua RT 039)"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Kontak No HP / WA
              </label>
              <input
                type="text"
                placeholder="Contoh: 0812-7890-xxxx"
                value={kontak}
                onChange={(e) => setKontak(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 6. Info Posisi Peta & Tombol Langsung Klik Peta */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-[11px] text-emerald-950 dark:text-emerald-200 block">
                  Koordinat Posisi Peta: X: {svgPos.x}, Y: {svgPos.y}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Tanda dapat digeser/dipindahkan kapan saja secara langsung di atas peta satelit.
                </span>
              </div>
            </div>

            {onStartClickToPlace && (
              <button
                type="button"
                onClick={handlePickOnMap}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Klik Posisi di Peta</span>
              </button>
            )}
          </div>

          {/* Form Actions Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {editingMarker && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus simbol tanda "${editingMarker.nama}" dari peta?`)) {
                    onDelete(editingMarker.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-700 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Tanda</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingMarker ? 'Simpan Perubahan' : 'Letakkan Tanda di Peta'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
