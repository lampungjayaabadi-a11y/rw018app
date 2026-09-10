import React, { useState, useEffect } from 'react';
import {
  X,
  Lightbulb,
  Save,
  Trash2,
  AlertTriangle,
  Zap,
  Calendar,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { PjuData } from '../../data/petaData';

interface PjuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pju: PjuData) => void;
  onDelete?: (id: string) => void;
  editingPju: PjuData | null;
}

export const PjuFormModal: React.FC<PjuFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingPju
}) => {
  const [formData, setFormData] = useState({
    id: '',
    nomorTiang: '',
    lokasi: '',
    rt: 'RT 039',
    jenisLampu: 'LED Hemat Energi 50W' as 'LED Hemat Energi 50W' | 'Solar Cell 40W' | 'Lampu Merkuri 80W' | 'LED 100W Super Bright',
    kondisi: 'Menyala' as 'Menyala' | 'Redup' | 'Mati' | 'Perlu Tiang Baru',
    tanggalPengecekan: new Date().toISOString().split('T')[0]
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingPju) {
      setFormData({
        id: editingPju.id,
        nomorTiang: editingPju.nomorTiang || '',
        lokasi: editingPju.lokasi || '',
        rt: editingPju.rt || 'RT 039',
        jenisLampu: editingPju.jenisLampu || 'LED Hemat Energi 50W',
        kondisi: editingPju.kondisi || 'Menyala',
        tanggalPengecekan: editingPju.tanggalPengecekan || new Date().toISOString().split('T')[0]
      });
    } else {
      const randomNum = Math.floor(Math.random() * 80 + 15);
      setFormData({
        id: `pju-${Date.now()}`,
        nomorTiang: `PJU-RW18-${randomNum}`,
        lokasi: 'Jl. Pala / Persimpangan Gang',
        rt: 'RT 039',
        jenisLampu: 'LED Hemat Energi 50W',
        kondisi: 'Menyala',
        tanggalPengecekan: new Date().toISOString().split('T')[0]
      });
    }
    setErrorMsg(null);
  }, [editingPju, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorTiang.trim()) {
      setErrorMsg('Nomor Tiang PJU wajib diisi!');
      return;
    }
    if (!formData.lokasi.trim()) {
      setErrorMsg('Lokasi PJU wajib diisi!');
      return;
    }

    const payload: PjuData = {
      id: formData.id || `pju-${Date.now()}`,
      nomorTiang: formData.nomorTiang.trim(),
      lokasi: formData.lokasi.trim(),
      rt: formData.rt,
      jenisLampu: formData.jenisLampu,
      kondisi: formData.kondisi,
      tanggalPengecekan: formData.tanggalPengecekan
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-800 via-amber-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                {editingPju ? 'Edit Titik Lampu PJU' : 'Input Titik Lampu PJU Baru'}
              </h3>
              <p className="text-xs text-amber-200">
                Penerangan Jalan Umum Lingkungan RW 018
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
            {/* Nomor Tiang */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nomor Tiang / Kode PJU <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Zap className="w-4 h-4 absolute left-3 top-2.5 text-amber-600" />
                <input
                  type="text"
                  required
                  value={formData.nomorTiang}
                  onChange={(e) => setFormData({ ...formData, nomorTiang: e.target.value })}
                  placeholder="PJU-RW18-01"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase"
                />
              </div>
            </div>

            {/* Lokasi Pemasangan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Lokasi / Titik Pemasangan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Simpang Gang Manggis & Jl. Pala Barat"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Wilayah RT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Wilayah Sektor RT <span className="text-rose-500">*</span>
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
              </select>
            </div>

            {/* Jenis Lampu */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tipe Lampu PJU
              </label>
              <select
                value={formData.jenisLampu}
                onChange={(e) => setFormData({ ...formData, jenisLampu: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="LED Hemat Energi 50W">LED Hemat Energi 50W</option>
                <option value="Solar Cell 40W">Solar Cell 40W (Tenaga Surya)</option>
                <option value="LED 100W Super Bright">LED 100W Super Bright</option>
                <option value="Lampu Merkuri 80W">Lampu Merkuri 80W</option>
              </select>
            </div>

            {/* Kondisi Operasional */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Kondisi Lampu Saat Ini <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Menyala">🟢 Menyala Normal</option>
                <option value="Redup">🟡 Redup / Perlu Pembersihan</option>
                <option value="Mati">🔴 Mati / Bohlam Putus</option>
                <option value="Perlu Tiang Baru">🟠 Perlu Penggantian Tiang / Kabel</option>
              </select>
            </div>

            {/* Tanggal Pengecekan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tanggal Terakhir Pengecekan
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={formData.tanggalPengecekan}
                  onChange={(e) => setFormData({ ...formData, tanggalPengecekan: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            {editingPju && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus titik PJU "${editingPju.nomorTiang}"?`)) {
                    onDelete(editingPju.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Titik</span>
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
                <span>{editingPju ? 'Simpan Perubahan' : 'Tambah Titik PJU'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
