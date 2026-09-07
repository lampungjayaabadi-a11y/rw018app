import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  Save,
  Trash2,
  Radio,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Compass
} from 'lucide-react';
import { PetaPointOfInterest } from '../../data/petaData';

interface CctvFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poi: PetaPointOfInterest) => void;
  onDelete?: (id: string) => void;
  editingCctv: PetaPointOfInterest | null;
}

export const CctvFormModal: React.FC<CctvFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingCctv
}) => {
  const [formData, setFormData] = useState({
    id: '',
    nama: '',
    cctvIpOrId: '',
    rt: '039',
    alamat: '',
    lat: -5.128111,
    lng: 105.316778,
    penanggungJawab: '',
    kontakPj: '',
    status: 'Aktif' as 'Aktif' | 'Siaga' | 'Perbaikan' | 'Offline',
    isCctvOnline: true,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
    resolution: '1080p Full HD ColorVu',
    fps: 25,
    bitrate: '2048 Kbps',
    deskripsi: '',
    svgX: 50,
    svgY: 50
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCctv) {
      setFormData({
        id: editingCctv.id,
        nama: editingCctv.nama || '',
        cctvIpOrId: editingCctv.cctvIpOrId || '',
        rt: editingCctv.rt || '039',
        alamat: editingCctv.alamat || '',
        lat: editingCctv.koordinat?.lat || -5.128111,
        lng: editingCctv.koordinat?.lng || 105.316778,
        penanggungJawab: editingCctv.penanggungJawab || '',
        kontakPj: editingCctv.kontakPj || '',
        status: (editingCctv.status as any) || 'Aktif',
        isCctvOnline: editingCctv.isCctvOnline !== false,
        videoUrl: editingCctv.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
        resolution: editingCctv.resolution || '1080p Full HD ColorVu',
        fps: editingCctv.fps || 25,
        bitrate: editingCctv.bitrate || '2048 Kbps',
        deskripsi: editingCctv.deskripsi || '',
        svgX: editingCctv.svgPos?.x || 50,
        svgY: editingCctv.svgPos?.y || 50
      });
    } else {
      const randomCamNum = Math.floor(Math.random() * 90 + 10);
      setFormData({
        id: `poi-cctv-${Date.now()}`,
        nama: `CCTV Titik Baru - Wilayah RT 039`,
        cctvIpOrId: `CAM-${randomCamNum}-IRINGMULYO`,
        rt: '039',
        alamat: 'Jl. Pala / Gang Lingkungan RW 018',
        lat: -5.128111,
        lng: 105.316778,
        penanggungJawab: 'Ketua RT / Tim Siskamling',
        kontakPj: '085383166999',
        status: 'Aktif',
        isCctvOnline: true,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
        resolution: '1080p Full HD ColorVu',
        fps: 25,
        bitrate: '2048 Kbps',
        deskripsi: 'Kamera CCTV pemantau keamanan lingkungan 24 jam terintegrasi pos siskamling.',
        svgX: 50,
        svgY: 50
      });
    }
    setErrorMsg(null);
  }, [editingCctv, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setErrorMsg('Nama CCTV wajib diisi!');
      return;
    }
    if (!formData.cctvIpOrId.trim()) {
      setErrorMsg('Kode ID / IP Kamera wajib diisi!');
      return;
    }

    const payload: PetaPointOfInterest = {
      id: formData.id || `poi-cctv-${Date.now()}`,
      nama: formData.nama.trim(),
      kategori: 'cctv',
      kategoriLabel: `Kamera CCTV ${formData.rt === 'UMUM' ? 'RW 018' : `RT ${formData.rt}`}`,
      rt: formData.rt,
      alamat: formData.alamat.trim(),
      deskripsi: formData.deskripsi.trim() || 'Titik pantau CCTV keamanan lingkungan RW 018',
      penanggungJawab: formData.penanggungJawab.trim() || 'Tim Keamanan RW 018',
      kontakPj: formData.kontakPj.trim() || '085383166999',
      status: formData.status as any,
      koordinat: {
        lat: Number(formData.lat) || -5.1281020,
        lng: Number(formData.lng) || 105.3167668
      },
      svgPos: {
        x: Number(formData.svgX) || 50,
        y: Number(formData.svgY) || 50
      },
      iconName: 'Camera',
      badgeColor: 'bg-cyan-600 text-white',
      cctvIpOrId: formData.cctvIpOrId.trim(),
      isCctvOnline: formData.isCctvOnline,
      videoUrl: formData.videoUrl.trim() || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4',
      resolution: formData.resolution,
      fps: Number(formData.fps) || 25,
      bitrate: formData.bitrate,
      nightVision: true
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                {editingCctv ? 'Edit Titik Lokasi & Koordinat CCTV' : 'Input Titik Lokasi CCTV Baru'}
              </h3>
              <p className="text-xs text-cyan-200">
                Siskamling Digital RW 018 Kelurahan Iringmulyo
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
            {/* Nama CCTV */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nama Titik Kamera CCTV <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: CCTV 01 - Gerbang Masuk Barat Jl. Pala"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
              />
            </div>

            {/* Kode ID / IP CCTV */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Kode ID / IP Kamera <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Radio className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.cctvIpOrId}
                  onChange={(e) => setFormData({ ...formData, cctvIpOrId: e.target.value })}
                  placeholder="CAM-01-PALABRT"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono font-bold uppercase"
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-bold text-slate-800"
              >
                <option value="039">RT 039 (Sektor Tenggara & Jl. Pala Barat)</option>
                <option value="040">RT 040 (Sektor Timur & Jl. Pala Timur)</option>
                <option value="041">RT 041 (Sektor Barat Daya & Jl. Sukun)</option>
                <option value="042">RT 042 (Sektor Barat Laut & Jl. Duku)</option>
                <option value="UMUM">UMUM (Pusat / Perbatasan RW 018)</option>
              </select>
            </div>

            {/* Alamat & Posisi Fisik */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Alamat / Posisi Tiang Pemasangan
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Contoh: Jl. Pala Barat No. 01 depan Pos Ronda RT 039"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
              />
            </div>

            {/* TITIK KOORDINAT GPS (LATITUDE & LONGITUDE) */}
            <div className="sm:col-span-2 p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-700" />
                  Titik Koordinat GPS Live (Latitude & Longitude)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      lat: -5.1281020,
                      lng: 105.3167668
                    });
                  }}
                  className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                >
                  Gunakan Titik Pusat RW 018
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                    Latitude (Garis Lintang)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    placeholder="-5.1281020"
                    className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-cyan-300 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                    Longitude (Garis Bujur)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    placeholder="105.3167668"
                    className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-cyan-300 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Penanggung Jawab & Kontak */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Penanggung Jawab / Operator
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.penanggungJawab}
                  onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                  placeholder="Zaenal Fanani (Ketua RT 039)"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                No. HP / WhatsApp PJ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.kontakPj}
                  onChange={(e) => setFormData({ ...formData, kontakPj: e.target.value })}
                  placeholder="0812-7890-0391"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
            </div>

            {/* Status & Online State */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Status Operasional
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-bold"
              >
                <option value="Aktif">Aktif (Operasional Normal)</option>
                <option value="Siaga">Siaga (Jadwal Khusus / Malam)</option>
                <option value="Perbaikan">Dalam Perbaikan / Maintenance</option>
                <option value="Offline">Offline / Non-Aktif</option>
              </select>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kondisi Live Stream
              </label>
              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCctvOnline}
                  onChange={(e) => setFormData({ ...formData, isCctvOnline: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded-sm focus:ring-cyan-500"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${formData.isCctvOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {formData.isCctvOnline ? 'Kamera Online & Terhubung Siskamling' : 'Kamera Offline (Standby)'}
                </span>
              </label>
            </div>

            {/* Video Stream URL & Resolusi */}
            <div className="space-y-1 sm:col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>URL Video Live Pantauan CCTV (MP4 / WebStream / RTSP)</span>
                <span className="text-[10px] text-cyan-700 font-normal">Video klip feed simulasi real-time</span>
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://assets.mixkit.co/videos/preview/..."
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-mono text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
              {/* Presets Feed Lingkungan Sesuai Lokasi */}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">Preset Feed Video Lingkungan:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4' })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-cyan-300 cursor-pointer transition-colors"
                  >
                    🏡 Jalan Kampung
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cars-moving-on-a-street-in-a-city-43183-large.mp4' })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-cyan-300 cursor-pointer transition-colors"
                  >
                    🚦 Perempatan Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-suburban-houses-in-a-neighborhood-43184-large.mp4' })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-cyan-300 cursor-pointer transition-colors"
                  >
                    🚶 Gang Pemukiman
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-corner-43180-large.mp4' })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-cyan-300 cursor-pointer transition-colors"
                  >
                    👮 Gardu Pos Kamling
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-pedestrian-area-43336-large.mp4' })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-cyan-300 cursor-pointer transition-colors"
                  >
                    🏫 Depan SD & Fasum
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Resolusi & Lensa</label>
                  <input
                    type="text"
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    placeholder="1080p ColorVu"
                    className="w-full px-2.5 py-1 text-xs bg-white rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Frame Rate (FPS)</label>
                  <input
                    type="number"
                    value={formData.fps}
                    onChange={(e) => setFormData({ ...formData, fps: parseInt(e.target.value) || 25 })}
                    placeholder="25"
                    className="w-full px-2.5 py-1 text-xs bg-white rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Bitrate Streaming</label>
                  <input
                    type="text"
                    value={formData.bitrate}
                    onChange={(e) => setFormData({ ...formData, bitrate: e.target.value })}
                    placeholder="2048 Kbps"
                    className="w-full px-2.5 py-1 text-xs bg-white rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi & Wilayah Pantauan */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Deskripsi & Jangkauan Pantauan
              </label>
              <textarea
                rows={2}
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Pantauan akses keluar masuk kendaraan warga, persimpangan jalan, dan pengawasan gerbang utama."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            {editingCctv && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus titik CCTV "${editingCctv.nama}"?`)) {
                    onDelete(editingCctv.id);
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
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingCctv ? 'Simpan Perubahan' : 'Tambah Titik CCTV'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
