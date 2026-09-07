import React, { useState } from 'react';
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
  Plus,
  Trash2,
  Edit,
  Move,
  Search,
  RotateCcw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CustomPetaMarker, SimbolBentukType } from '../../data/petaData';

interface ManageMarkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  markers: CustomPetaMarker[];
  onOpenAddModal: () => void;
  onOpenEditModal: (marker: CustomPetaMarker) => void;
  onDeleteMarker: (id: string) => void;
  onResetMarkers: () => void;
  onFocusMarker: (marker: CustomPetaMarker) => void;
  onStartMoveMarker: (marker: CustomPetaMarker) => void;
}

export const ManageMarkersModal: React.FC<ManageMarkersModalProps> = ({
  isOpen,
  onClose,
  markers,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMarker,
  onResetMarkers,
  onFocusMarker,
  onStartMoveMarker
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredMarkers = markers.filter(m => {
    if (selectedRt !== 'ALL' && m.rt !== selectedRt) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        m.nama.toLowerCase().includes(q) ||
        m.kategoriLabel.toLowerCase().includes(q) ||
        (m.keterangan && m.keterangan.toLowerCase().includes(q)) ||
        (m.penanggungJawab && m.penanggungJawab.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const renderShapeIcon = (shape: SimbolBentukType, color: string) => {
    switch (shape) {
      case 'kotak':
        return (
          <div className="w-6 h-6 rounded-md bg-black border border-white flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        );
      case 'segitiga':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Triangle className="w-3.5 h-3.5 fill-current" />
          </div>
        );
      case 'portal':
        return (
          <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        );
      case 'kamera':
        return (
          <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Camera className="w-3.5 h-3.5" />
          </div>
        );
      case 'lampu':
        return (
          <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
        );
      case 'shield':
        return (
          <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" />
          </div>
        );
      case 'toko':
        return (
          <div className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
        );
      case 'medis':
        return (
          <div className="w-6 h-6 rounded-md bg-pink-600 text-white flex items-center justify-center shrink-0">
            <HeartPulse className="w-3.5 h-3.5" />
          </div>
        );
      case 'rumah':
        return (
          <div className="w-6 h-6 rounded-md bg-green-600 text-white flex items-center justify-center shrink-0">
            <Home className="w-3.5 h-3.5" />
          </div>
        );
      case 'taman':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Trees className="w-3.5 h-3.5" />
          </div>
        );
      case 'bintang':
        return (
          <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
        );
      case 'lingkaran':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
            <Circle className="w-2.5 h-2.5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-md text-white flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
            <MapPin className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Daftar Simbol Tanda Peta Satelit Live</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {markers.length} Tanda
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Kelola tanda, pindahkan koordinat di peta, perbarui informasi, atau hapus tanda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tanda Baru</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari simbol tanda, pos ronda, masjid, PJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* RT Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', '039', '040', '041', '042', 'UMUM'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRt(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRt === r
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {r === 'ALL' ? 'Semua RT' : r === 'UMUM' ? 'RW' : `RT ${r}`}
              </button>
            ))}
          </div>
        </div>

        {/* List of Custom Markers */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredMarkers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak ada simbol tanda yang cocok
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan tambah tanda baru atau ubah kata kunci pencarian
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Letakkan Simbol Tanda Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    {renderShapeIcon(marker.simbolBentuk, marker.warna)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                          style={{ backgroundColor: marker.rt === '039' ? '#ef4444' : marker.rt === '040' ? '#22c55e' : marker.rt === '041' ? '#f97316' : marker.rt === '042' ? '#eab308' : '#2563eb' }}
                        >
                          {marker.rt === 'UMUM' ? 'RW' : `RT ${marker.rt}`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Posisi: X:{marker.svgPos.x}, Y:{marker.svgPos.y}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mt-1">
                        {marker.nama}
                      </h4>

                      {marker.keterangan && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {marker.keterangan}
                        </p>
                      )}

                      {marker.penanggungJawab && (
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1">
                          PJ: <strong>{marker.penanggungJawab}</strong>
                          {marker.kontak && <span> ({marker.kontak})</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        onClose();
                        onFocusMarker(marker);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Lihat & Fokus di Peta Satelit"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>Fokus Peta</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onClose();
                          onStartMoveMarker(marker);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Pindahkan / Geser Posisi"
                      >
                        <Move className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenEditModal(marker);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Edit Info Tanda"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-600" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus simbol tanda "${marker.nama}" dari peta?`)) {
                            onDeleteMarker(marker.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                        title="Hapus Tanda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <button
            onClick={() => {
              if (confirm('Kembalikan semua simbol tanda ke konfigurasi standar RW 018? Tanda kustom baru akan direset.')) {
                onResetMarkers();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ke Tanda Standar</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
