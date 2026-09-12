import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Save,
  Trash2,
  AlertTriangle,
  Layers,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { InfrastrukturJalan } from '../../data/petaData';

interface JalanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jalan: InfrastrukturJalan) => void;
  onDelete?: (id: string) => void;
  editingJalan: InfrastrukturJalan | null;
}

export const JalanFormModal: React.FC<JalanFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingJalan
}) => {
  const [formData, setFormData] = useState({
    id: '',
    namaJalan: '',
    rt: 'RT 039',
    panjangMeter: 250,
    lebarMeter: 3.5,
    jenisPermukaan: 'Paving Block',
    kondisi: 'Baik' as 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat',
    tahunPembangunan: 2023,
    catatanMusrenbang: ''
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingJalan) {
      setFormData({
        id: editingJalan.id,
        namaJalan: editingJalan.namaJalan || '',
        rt: editingJalan.rt || 'RT 039',
        panjangMeter: editingJalan.panjangMeter || 100,
        lebarMeter: editingJalan.lebarMeter || 3.0,
        jenisPermukaan: editingJalan.jenisPermukaan || 'Paving Block',
        kondisi: editingJalan.kondisi || 'Baik',
        tahunPembangunan: editingJalan.tahunPembangunan || 2023,
        catatanMusrenbang: editingJalan.catatanMusrenbang || ''
      });
    } else {
      setFormData({
        id: `jln-${Date.now()}`,
        namaJalan: '',
        rt: 'RT 039',
        panjangMeter: 200,
        lebarMeter: 3.5,
        jenisPermukaan: 'Paving Block',
        kondisi: 'Baik',
        tahunPembangunan: new Date().getFullYear(),
        catatanMusrenbang: 'Usulan pavingisasi jalan lingkungan warga RW 018.'
      });
    }
    setErrorMsg(null);
  }, [editingJalan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaJalan.trim()) {
      setErrorMsg('Nama ruas jalan wajib diisi!');
      return;
    }

    const payload: InfrastrukturJalan = {
      id: formData.id || `jln-${Date.now()}`,
      namaJalan: formData.namaJalan.trim(),
      rt: formData.rt,
      panjangMeter: Number(formData.panjangMeter) || 0,
      lebarMeter: Number(formData.lebarMeter) || 0,
      jenisPermukaan: formData.jenisPermukaan,
      kondisi: formData.kondisi,
      tahunPembangunan: Number(formData.tahunPembangunan) || 2024,
      catatanMusrenbang: formData.catatanMusrenbang.trim()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                {editingJalan ? 'Edit Ruas Jalan & Kondisi' : 'Input Ruas Jalan & Kondisi Baru'}
              </h3>
              <p className="text-xs text-amber-200">
                Infrastruktur Fisik & Jalan Lingkungan RW 018
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Jalan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nama Ruas Jalan / Gang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.namaJalan}
                onChange={(e) => setFormData({ ...formData, namaJalan: e.target.value })}
                placeholder="Contoh: Jl. Pala Barat Utama, Gang Manggis"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Wilayah RT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Wilayah RT <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.rt}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="RT 039">RT 039 (Sektor Tenggara)</option>
                <option value="RT 040">RT 040 (Sektor Timur)</option>
                <option value="RT 041">RT 041 (Sektor Barat Daya)</option>
                <option value="RT 042">RT 042 (Sektor Barat Laut)</option>
                <option value="Lintas RT">Lintas RT (Jalan Poros RW 018)</option>
              </select>
            </div>

            {/* Jenis Permukaan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Jenis Permukaan Jalan
              </label>
              <select
                value={formData.jenisPermukaan}
                onChange={(e) => setFormData({ ...formData, jenisPermukaan: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="Paving Block">Paving Block</option>
                <option value="Beton Cor (Rigid)">Beton Cor (Rigid)</option>
                <option value="Aspal Hotmix">Aspal Hotmix</option>
                <option value="Onderlagh / Batu Belah">Onderlagh / Batu Belah</option>
                <option value="Tanah Padat">Tanah Padat</option>
              </select>
            </div>

            {/* Dimensi: Panjang & Lebar */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Panjang Ruas (Meter)
              </label>
              <input
                type="number"
                min="1"
                value={formData.panjangMeter}
                onChange={(e) => setFormData({ ...formData, panjangMeter: parseFloat(e.target.value) || 0 })}
                placeholder="250"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Lebar Jalan (Meter)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={formData.lebarMeter}
                onChange={(e) => setFormData({ ...formData, lebarMeter: parseFloat(e.target.value) || 0 })}
                placeholder="3.5"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono font-semibold"
              />
            </div>

            {/* Kondisi Fisik */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Kondisi Fisik Saat Ini <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Baik">🟢 Baik (Mulus & Layak)</option>
                <option value="Rusak Ringan">🟡 Rusak Ringan (Berlubang Kecil / Amblas Parsial)</option>
                <option value="Rusak Sedang">🟠 Rusak Sedang (Perlu Patching / Paving Ulang)</option>
                <option value="Rusak Berat">🔴 Rusak Berat (Perlu Rekonstruksi Total)</option>
              </select>
            </div>

            {/* Tahun Pembangunan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tahun Bangun / Perbaikan Terakhir
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                value={formData.tahunPembangunan}
                onChange={(e) => setFormData({ ...formData, tahunPembangunan: parseInt(e.target.value) || 2024 })}
                placeholder="2023"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono font-semibold"
              />
            </div>

            {/* Catatan Usulan Musrenbang */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Catatan Usulan Musrenbang / Swadaya
              </label>
              <textarea
                rows={2}
                value={formData.catatanMusrenbang}
                onChange={(e) => setFormData({ ...formData, catatanMusrenbang: e.target.value })}
                placeholder="Prioritas perbaikan paving blok melalui Musrenbang Kelurahan atau Swadaya Warga."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            {editingJalan && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus data jalan "${editingJalan.namaJalan}"?`)) {
                    onDelete(editingJalan.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Ruas</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingJalan ? 'Simpan Perubahan' : 'Tambah Ruas Jalan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
