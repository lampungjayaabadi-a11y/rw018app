import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  Calendar,
  MessageCircle,
  Camera,
  Star,
  Download
} from 'lucide-react';
import { UmkmItem, UmkmFotoItem } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

interface UmkmGalleryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  umkm: UmkmItem | null;
  initialIndex?: number;
}

export const UmkmGalleryViewerModal: React.FC<UmkmGalleryViewerModalProps> = ({
  isOpen,
  onClose,
  umkm,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  if (!isOpen || !umkm) return null;

  // Build unified list of photos
  const rawList: UmkmFotoItem[] = [];

  if (umkm.fotoList && umkm.fotoList.length > 0) {
    umkm.fotoList.forEach((item, idx) => {
      if (typeof item === 'string') {
        rawList.push({
          id: `f-${idx}`,
          url: item,
          caption: `Foto Dokumentasi ${idx + 1}`,
          isUtama: idx === 0,
        });
      } else {
        rawList.push(item);
      }
    });
  } else if (umkm.foto) {
    rawList.push({
      id: 'f-cover',
      url: umkm.foto,
      caption: 'Foto Utama Usaha',
      isUtama: true,
    });
  } else if (umkm.fotoUrls && umkm.fotoUrls.length > 0) {
    umkm.fotoUrls.forEach((url, idx) => {
      rawList.push({
        id: `f-${idx}`,
        url,
        caption: `Foto Usaha ${idx + 1}`,
        isUtama: idx === 0,
      });
    });
  }

  if (rawList.length === 0) {
    return null;
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), rawList.length - 1);
  const currentPhoto = rawList[safeIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : rawList.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < rawList.length - 1 ? prev + 1 : 0));
  };

  const handleWhatsAppContact = () => {
    const rawNo = umkm.kontakHp || umkm.noWa || '';
    if (!rawNo) return;
    const cleanNo = rawNo.replace(/\D/g, '');
    const intlNo = cleanNo.startsWith('0') ? `62${cleanNo.substring(1)}` : cleanNo;
    const text = encodeURIComponent(
      `Halo Bapak/Ibu ${umkm.namaPemilik || umkm.pemilik || ''}, saya warga RW 018 tertarik dengan produk/usaha "${umkm.namaUsaha}". Saya melihat foto "${currentPhoto?.caption || 'produk'}" di aplikasi RW. Apakah saat ini tersedia?`
    );
    window.open(`https://wa.me/${intlNo}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{umkm.namaUsaha}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Foto {safeIndex + 1} dari {rawList.length} • RT {umkm.rt} RW 018
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(umkm.kontakHp || umkm.noWa) && (
              <button
                type="button"
                onClick={handleWhatsAppContact}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hubungi Pemilik Usaha</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Tutup Galeri"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Photo Display Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[440px] overflow-hidden group">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || umkm.namaUsaha}
            className="max-h-[65vh] w-auto max-w-full object-contain select-none"
          />

          {/* Cover Badge */}
          {currentPhoto.isUtama && (
            <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-xs text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Star className="w-3 h-3 fill-current" />
              <span>Foto Sampul Utama</span>
            </div>
          )}

          {/* Navigation Arrows */}
          {rawList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer active:scale-95"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition cursor-pointer active:scale-95"
                title="Foto Selanjutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Photo Caption & Info Strip */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-400">
              {currentPhoto.caption || 'Foto Dokumentasi Usaha'}
            </h4>
            <p className="text-[11px] text-slate-300">
              {umkm.deskripsiProduk || umkm.deskripsi || 'Unit Usaha Warga RW 018'}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Pemilik: <strong className="text-slate-200">{umkm.namaPemilik || umkm.pemilik}</strong></span>
            <span>•</span>
            <span>Jam: <strong className="text-slate-200">{umkm.jamBuka || 'Sesuai pesanan'}</strong></span>
          </div>
        </div>

        {/* Thumbnail Carousel Bar */}
        {rawList.length > 1 && (
          <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            {rawList.map((foto, index) => (
              <button
                key={foto.id || index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                  safeIndex === index
                    ? 'border-amber-400 scale-105 shadow-md'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={foto.url}
                  alt={`Thumb ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {foto.isUtama && (
                  <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-black" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
