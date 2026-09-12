import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

interface ExportButtonProps {
  label?: string;
  onExportExcel: () => void;
  onExportCsv: () => void;
  variant?: 'primary' | 'secondary' | 'emerald' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  label = 'Ekspor',
  onExportExcel,
  onExportCsv,
  variant = 'secondary',
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = (type: 'excel' | 'csv') => {
    if (type === 'excel') {
      onExportExcel();
      setRecentAction('Excel diunduh');
    } else {
      onExportCsv();
      setRecentAction('CSV diunduh');
    }
    setIsOpen(false);
    setTimeout(() => setRecentAction(null), 2500);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs border border-emerald-600';
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-500';
      case 'subtle':
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs';
      case 'secondary':
      default:
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${getVariantStyles()} ${sizeStyles}`}
        title="Pilih format ekspor Excel (.xlsx) atau CSV"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{recentAction || label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
            Pilih Format Berkas
          </div>
          
          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-emerald-50 text-slate-800 transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Format Excel (.xlsx)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold">
                  Rekomendasi
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Rapi &amp; siap diedit di Ms. Excel / WPS
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-blue-50 text-slate-800 transition-colors group cursor-pointer mt-1"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900">Format CSV (.csv)</div>
              <p className="text-[10px] text-slate-500 truncate">
                Kompatibel UTF-8 &amp; Google Sheets
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
