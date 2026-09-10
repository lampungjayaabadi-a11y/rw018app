import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Share2,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  FileCode2,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { RWProfile } from '../types';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RWProfile;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'capacitor'>('install');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Untuk menginstal di HP Android:\n1. Buka browser Google Chrome\n2. Klik ikon titik 3 (⋮) di pojok kanan atas\n3. Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"\n\nAplikasi RW 018 akan langsung muncul seperti aplikasi Android resmi!'
      );
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(currentAppUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center shadow-md ring-2 ring-amber-400/30">
              <img
                src={profile.logoUrl || LOGO_RW_018}
                alt="Logo RW 018"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={handleLogoError}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/80 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">
                <Smartphone className="w-3 h-3 text-amber-300" />
                <span>Android App Package</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Jadikan Aplikasi Android (APK)
              </h3>
              <p className="text-xs text-emerald-100">
                Aplikasi RW 018 siap dipasang langsung di smartphone Android
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-3 px-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'install'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>1. Install Langsung (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 px-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'apk'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>2. Generate File .APK</span>
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-3 px-3 text-center flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'capacitor'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>3. Android Studio</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] text-xs space-y-4">
          {/* TAB 1: INSTALL LANGSUNG (PWA / WebAPK) */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">
                      Metode Cepat & Resmi: Install WebAPK ke HP
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      Aplikasi ini sudah dilengkapi <strong>Manifest PWA</strong> & <strong>Service Worker</strong>. Tanpa perlu download file APK manual, aplikasi dapat langsung diinstal ke HP Android dengan ikon Logo RW 018 dan berjalan fullscreen tanpa browser bar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Install Action Button */}
              <div className="text-center p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-amber-400 mx-auto overflow-hidden shadow-lg flex items-center justify-center">
                  <img
                    src={profile.logoUrl || LOGO_RW_018}
                    alt="Logo RW 018"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={handleLogoError}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{profile.namaRw}</h4>
                  <p className="text-slate-500 text-[11px]">{profile.kelurahan}, {profile.kecamatan}</p>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span>{isInstalled ? 'Aplikasi Sudah Terpasang' : 'Pasang Aplikasi ke Layar Utama HP'}</span>
                </button>
              </div>

              {/* Panduan Manual */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <span>Cara Pasang Manual di Google Chrome Android:</span>
                </h5>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>Buka link aplikasi ini di browser <strong>Google Chrome</strong> pada HP Android Anda.</li>
                  <li>Tekan ikon <strong>Titik Tiga (⋮)</strong> di sudut kanan atas Chrome.</li>
                  <li>Pilih menu <strong>&quot;Instal Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home Screen).</li>
                  <li>Tekan <strong>Instal</strong>. Aplikasi RW 018 akan otomatis muncul di laci aplikasi Android Anda.</li>
                </ol>
              </div>

              {/* URL Share */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between gap-2 border border-slate-200">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">Link Aplikasi untuk Warga / Pengurus:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate block font-bold">
                    {currentAppUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] shrink-0 border border-slate-300 flex items-center gap-1 shadow-2xs"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GENERATE FILE .APK DENGAN PWABUILDER */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-sm">
                      Buat File APK Standalone (PWABuilder by Microsoft)
                    </h4>
                    <p className="text-amber-900/80 text-[11px] mt-1 leading-relaxed">
                      Anda dapat mengubah link web aplikasi ini menjadi file paket <strong>.APK (Android Package)</strong> atau <strong>.AAB (Google Play Store)</strong> secara otomatis dan gratis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step by step */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-slate-800">Langkah 1-Klik Membuat File APK:</h5>
                <div className="space-y-2.5 text-slate-600 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>
                      Klik tombol <strong>&quot;Buka PWABuilder Generator&quot;</strong> di bawah.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>
                      Sistem akan memvalidasi manifest &amp; logo RW 018 secara otomatis.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <span>
                      Pilih <strong>&quot;Android&quot;</strong> lalu klik <strong>&quot;Generate Package&quot;</strong> untuk mengunduh file <code>.apk</code> atau zip paket Android.
                    </span>
                  </div>
                </div>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Buka Generator APK (PWABuilder)</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                </a>
              </div>

              {/* Fitur yang didapat dalam APK */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ikon Logo RW 018</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dukungan Offline Cache</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tampilan Fullscreen Android</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Siap Dibagikan via WhatsApp</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPACITOR & ANDROID STUDIO */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">
                      Build Native APK dengan Capacitor &amp; Android Studio
                    </h4>
                    <p className="text-blue-900/80 text-[11px] mt-1 leading-relaxed">
                      Jika Anda ingin mengkompilasi file <code>.apk</code> native langsung di komputer menggunakan Android Studio dan Gradle SDK.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">Perintah Terminal / Command Line:</h5>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-2 overflow-x-auto select-all">
                  <p className="text-emerald-400"># 1. Export zip project dari menu Settings</p>
                  <p>npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                  <p className="text-emerald-400"># 2. Inisialisasi Capacitor Android</p>
                  <p>npx cap init &quot;RW 018 Iringmulyo&quot; &quot;com.rw018.iringmulyo&quot;</p>
                  <p className="text-emerald-400"># 3. Build &amp; Sinkronkan</p>
                  <p>npm run build</p>
                  <p>npx cap add android</p>
                  <p>npx cap sync</p>
                  <p className="text-emerald-400"># 4. Buka di Android Studio &amp; Build APK</p>
                  <p>npx cap open android</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Paket Aplikasi Android RW 018 • Periode {profile.periodeJabatan}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
