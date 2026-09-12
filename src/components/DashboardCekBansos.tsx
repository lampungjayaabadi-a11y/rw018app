import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Gift,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Warga, KartuKeluarga } from '../types';

interface DashboardCekBansosProps {
  wargaList: Warga[];
  kkList: KartuKeluarga[];
  onNavigateToBansos?: () => void;
}

export const DashboardCekBansos: React.FC<DashboardCekBansosProps> = ({
  wargaList,
  kkList,
  onNavigateToBansos,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesil, setFilterDesil] = useState<string>('ALL');

  // Map No KK ke Desil
  const kkDesilMap = useMemo(() => {
    const map = new Map<string, string>();
    kkList.forEach((kk) => {
      if (kk.noKk) {
        map.set(kk.noKk.trim(), kk.desil || 'Non-Desil');
      }
    });
    return map;
  }, [kkList]);

  // Helper untuk mendapatkan Desil dari Warga
  const getDesil = (warga: Warga): string => {
    if (!warga.noKk) return 'Non-Desil';
    return kkDesilMap.get(warga.noKk.trim()) || 'Non-Desil';
  };

  // Helper Badge Styling Desil
  const getDesilBadge = (desil: string) => {
    const d = desil?.trim() || 'Non-Desil';
    if (d === 'Desil 1') {
      return {
        label: 'Desil 1',
        subLabel: 'Sangat Miskin',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-300/60 font-black',
        isPrioritas: true,
      };
    }
    if (d === 'Desil 2') {
      return {
        label: 'Desil 2',
        subLabel: 'Miskin',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 ring-1 ring-orange-300/60 font-black',
        isPrioritas: true,
      };
    }
    if (d === 'Desil 3') {
      return {
        label: 'Desil 3',
        subLabel: 'Hampir Miskin',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
        isPrioritas: true,
      };
    }
    if (d === 'Desil 4') {
      return {
        label: 'Desil 4',
        subLabel: 'Rentan Miskin',
        badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-black',
        isPrioritas: true,
      };
    }
    if (d === 'Desil 5') {
      return {
        label: 'Desil 5',
        subLabel: 'Menengah Bawah',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
        isPrioritas: false,
      };
    }
    if (['Desil 6', 'Desil 7', 'Desil 8'].includes(d)) {
      return {
        label: d,
        subLabel: 'Menengah',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
        isPrioritas: false,
      };
    }
    if (['Desil 9', 'Desil 10'].includes(d)) {
      return {
        label: d,
        subLabel: 'Mampu',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
        isPrioritas: false,
      };
    }
    return {
      label: 'Non-Desil',
      subLabel: 'Belum Terdata',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 font-medium',
      isPrioritas: false,
    };
  };

  // Hasil Pencarian Data Warga
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return wargaList
      .filter((w) => {
        const desil = getDesil(w);

        // Filter Desil
        if (filterDesil === 'PRIORITAS') {
          if (!['Desil 1', 'Desil 2', 'Desil 3', 'Desil 4'].includes(desil)) {
            return false;
          }
        } else if (filterDesil === 'NON_DESIL') {
          if (desil !== 'Non-Desil') return false;
        } else if (filterDesil !== 'ALL') {
          if (desil !== filterDesil) return false;
        }

        // Jika tidak ada query search dan filter ALL, batasi tampilan awal agar ramping
        if (!q) {
          if (filterDesil !== 'ALL') return true;
          return false;
        }

        const matchNik = w.nik.toLowerCase().includes(q);
        const matchNama = w.nama.toLowerCase().includes(q);

        return matchNik || matchNama;
      })
      .slice(0, 50); // Batasi max 50 hasil agar tetap super ringan di Android
  }, [wargaList, searchQuery, filterDesil, kkDesilMap]);

  // Hitung total prioritas (Desil 1 - 4)
  const totalPrioritasCount = useMemo(() => {
    return wargaList.filter((w) => {
      const d = getDesil(w);
      return ['Desil 1', 'Desil 2', 'Desil 3', 'Desil 4'].includes(d);
    }).length;
  }, [wargaList, kkDesilMap]);

  return (
    <div
      id="menu-cek-bansos-pemerintah"
      className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-200 shadow-xs p-3.5 sm:p-4 space-y-3 transition-all"
    >
      {/* Header Ramping & Bersih dengan Tombol Utama Link Cek Bansos Kemensos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Cek Bansos Pemerintah
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Kemensos RI
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Pengecekan bantuan sosial resmi & desil kesejahteraan sosial warga
            </p>
          </div>
        </div>

        {/* Tombol Utama Buka Link Resmi https://cekbansos.kemensos.go.id/ */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <a
            href="https://cekbansos.kemensos.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer text-decoration-none"
            title="Buka Website Resmi https://cekbansos.kemensos.go.id/"
          >
            <Globe className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-200" />
            <span className="truncate">Buka cekbansos.kemensos.go.id</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" />
          </a>

          {onNavigateToBansos && (
            <button
              onClick={onNavigateToBansos}
              className="text-[11px] text-slate-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer px-1 py-1 shrink-0"
              title="Akses data bansos internal RW"
            >
              <span>Data Bansos RW</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Input Pencarian & Dropdown Filter Desil - Ramping & Nyaman Android */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Input Pencarian NIK / Nama */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik NIK atau Nama warga..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Bersihkan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Menu Filter Desil */}
        <div className="relative sm:w-60 shrink-0">
          <select
            value={filterDesil}
            onChange={(e) => setFilterDesil(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-slate-700 cursor-pointer transition-all"
          >
            <option value="ALL">Semua Desil</option>
            <option value="PRIORITAS">★ Desil 1 - 4 (Prioritas Bansos: {totalPrioritasCount})</option>
            <option value="Desil 1">Desil 1 (Sangat Miskin)</option>
            <option value="Desil 2">Desil 2 (Miskin)</option>
            <option value="Desil 3">Desil 3 (Hampir Miskin)</option>
            <option value="Desil 4">Desil 4 (Rentan Miskin)</option>
            <option value="Desil 5">Desil 5 (Menengah Bawah)</option>
            <option value="Desil 6">Desil 6 (Menengah)</option>
            <option value="Desil 7">Desil 7 (Menengah)</option>
            <option value="Desil 8">Desil 8 (Menengah Atas)</option>
            <option value="Desil 9">Desil 9 (Mampu)</option>
            <option value="Desil 10">Desil 10 (Sangat Mampu)</option>
            <option value="NON_DESIL">Non-Desil / Belum Terdata</option>
          </select>
        </div>
      </div>

      {/* HASIL PENCARIAN (HANYA NAMA, NIK, DAN DESIL SAJA - RAMPING & NYAMAN ANDROID) */}
      <div className="space-y-1.5">
        {searchResults.length > 0 ? (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 scroll-smooth">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
              <span>Menampilkan {searchResults.length} data warga:</span>
              <span className="font-mono">Nama • NIK • Desil</span>
            </div>

            {searchResults.map((warga) => {
              const desil = getDesil(warga);
              const badgeInfo = getDesilBadge(desil);

              return (
                <div
                  key={warga.id}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5"
                >
                  {/* Sisi Kiri: Nama & NIK saja */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                      {warga.nama}
                    </h4>
                    <p className="font-mono text-[11px] sm:text-xs text-slate-600 mt-0.5 tracking-tight flex items-center gap-1">
                      <span className="text-slate-400 font-sans font-medium text-[10px]">NIK:</span>
                      <strong className="text-slate-800 font-semibold">{warga.nik}</strong>
                    </p>
                  </div>

                  {/* Sisi Kanan: Desil saja */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] border shadow-2xs whitespace-nowrap ${badgeInfo.badgeClass}`}
                    >
                      {badgeInfo.label}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                      {badgeInfo.subLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim() || filterDesil !== 'ALL' ? (
          <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-1">
            <AlertCircle className="w-5 h-5 mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">Data Tidak Ditemukan</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              Tidak ada data warga yang cocok dengan kata kunci & filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Ketik <strong>NIK</strong> atau <strong>Nama</strong> di atas, atau gunakan <strong>menu dropdown desil</strong> untuk melihat data kesejahteraan sosial warga.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
