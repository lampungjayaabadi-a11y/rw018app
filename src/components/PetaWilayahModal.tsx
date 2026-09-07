import React, { useState } from 'react';
import {
  X,
  MapPin,
  Globe,
  Compass,
  Printer,
  ExternalLink,
  Navigation,
  Layers,
  Shield,
  Camera,
  Share2,
  Check,
  Building,
  Phone
} from 'lucide-react';
import { RWProfile } from '../types';
import { PetaWilayahView } from './PetaWilayahView';
import { RW018_SPATIAL_PROFILE } from '../data/petaData';

interface PetaWilayahModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RWProfile;
}

export const PetaWilayahModal: React.FC<PetaWilayahModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-7xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 px-4 sm:px-6 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Peta Geografis & Denah Wilayah RW 018
              </h2>
              <p className="text-xs text-emerald-200">
                Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro Lampung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              title="Cetak Peta"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
              title="Tutup Peta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-4">
          <PetaWilayahView profile={profile} />
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Sekretariat: {profile.alamatKantor || 'Jl. Pala No.1 Iringmulyo'} • Ketua RW: {profile.namaKetuaRw} ({profile.noHpKetuaRw})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={RW018_SPATIAL_PROFILE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </a>

            <button
              onClick={onClose}
              className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
