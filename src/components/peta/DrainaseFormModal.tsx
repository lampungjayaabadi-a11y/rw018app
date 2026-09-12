import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Save,
  Trash2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { DrainaseData } from '../../data/petaData';

interface DrainaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drainase: DrainaseData) => void;
  onDelete?: (id: string) => void;
  editingDrainase: DrainaseData | null;
}

export const DrainaseFormModal: React.FC<DrainaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingDrainase
}) => {
  const [formData, setFormData] = useState({
    id: '',
    lokasi: '',
    rt: '039',
    panjangMeter: 120,
    kondisi: 'Lancar' as 'Lancar' | 'Perlu Pembersihan' | 'Rusak / Tersumbat',
    terakhirDibersihkan: 'Februari 2026',
    status: 'Normal & Terawat'
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingDrainase) {
      setFormData({
        id: editingDrainase.id,
        lokasi: editingDrainase.lokasi || '',
        rt: editingDrainase.rt || '039',
        panjangMeter: editingDrainase.panjangMeter || 100,
        kondisi: editingDrainase.kondisi || 'Lancar',
        terakhirDibersihkan: editingDrainase.terakhirDibersihkan || 'Februari 2026',
        status: editingDrainase.status || 'Normal & Terawat'
      });
    } else {
      setFormData({
        id: `drn-${Date.now()}`,
        lokasi: '',
        rt: '039',
        panjangMeter: 120,
        kondisi: 'Lancar',
        terakhirDibersihkan: 'Februari 2026',
        status: 'Normal & Terawat'
      });
    }
    setErrorMsg(null);
  }, [editingDrainase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lokasi.trim()) {
      setErrorMsg('Lokasi Saluran Drainase wajib diisi!');
      return;
    }

    const payload: DrainaseData = {
      id: formData.id || `drn-${Date.now()}`,
      lokasi: formData.lokasi.trim(),
      rt: formData.rt,
      panjangMeter: Number(formData.panjangMeter) || 100,
      kondisi: formData.kondisi,
      terakhirDibersihkan: formData.terakhirDibersihkan.trim() || 'Februari 2026',
      status: formData.status.trim() || 'Normal & Terawat'
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                {editingDrainase ? 'Edit Saluran Drainase & Got' : 'Input Saluran Drainase Baru'}
              </h3>
              <p className="text-xs text-blue-200">
                Sistem Drainase & Pengendalian Banjir RW 018
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
            {/* Lokasi Drainase */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Lokasi / Ruas Saluran Drainase <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                placeholder="Contoh: Saluran Drainase Utama Sisi Kanan Jl. Sukun"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Wilayah RT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Wilayah Sektor RT <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.rt}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="039">RT 039</option>
                <option value="040">RT 040</option>
                <option value="041">RT 041</option>
                <option value="042">RT 042</option>
              </select>
            </div>

            {/* Kondisi Aliran */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Kondisi Aliran Air <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="Lancar">🟢 Lancar (Bersih & Mengalir)</option>
                <option value="Perlu Pembersihan">🟡 Perlu Pembersihan (Ada Sedimen)</option>
                <option value="Rusak / Tersumbat">🔴 Rusak / Tersumbat (Perlu Perbaikan)</option>
              </select>
            </div>

            {/* Panjang Saluran */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Panjang Saluran (Meter)
              </label>
              <input
                type="number"
                value={formData.panjangMeter}
                onChange={(e) => setFormData({ ...formData, panjangMeter: Number(e.target.value) || 0 })}
                placeholder="120"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Terakhir Dibersihkan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Terakhir Dibersihkan / Cek
              </label>
              <input
                type="text"
                value={formData.terakhirDibersihkan}
                onChange={(e) => setFormData({ ...formData, terakhirDibersihkan: e.target.value })}
                placeholder="Februari 2026"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Status / Catatan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Status Pemeliharaan / Catatan
              </label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="Normal & Terawat / Rutin Kerja Bakti"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            {editingDrainase && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus saluran drainase "${editingDrainase.lokasi}"?`)) {
                    onDelete(editingDrainase.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Saluran</span>
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
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingDrainase ? 'Simpan Perubahan' : 'Tambah Saluran'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
