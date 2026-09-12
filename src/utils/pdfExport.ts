import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  onProgress?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onError?: (error: Error, message: string) => void;
  addPageNumbers?: boolean;
}

export interface PdfExportResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  blobUrl?: string;
  error?: Error;
}

/**
 * Format nama file PDF otomatis sesuai standar Ketua RW 018
 * Contoh: Laporan-Kejadian-RW018-001-11-09-2026.pdf
 */
export function formatLaporanPdfFilename(nomorLaporan?: string, tanggal?: string): string {
  let cleanNum = '001';
  if (nomorLaporan) {
    const match = nomorLaporan.match(/^(\d+)/);
    if (match) {
      cleanNum = match[1];
    } else {
      const parts = nomorLaporan.split(/[\/\-_]/);
      cleanNum = parts[0]?.trim() || '001';
    }
  }

  let dateStr = '';
  if (tanggal) {
    try {
      // Tanggal bisa format YYYY-MM-DD
      const parts = tanggal.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        dateStr = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      } else {
        const d = new Date(tanggal);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateStr = `${day}-${month}-${year}`;
        }
      }
    } catch {
      // fallback
    }
  }

  if (!dateStr) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    dateStr = `${day}-${month}-${year}`;
  }

  return `Laporan-Kejadian-RW018-${cleanNum}-${dateStr}.pdf`;
}

/**
 * Download blob ke perangkat dengan dukungan penuh untuk:
 * - Desktop Browser (Chrome, Firefox, Safari, Edge)
 * - Google Chrome Android
 * - PWA Aplikasi RW 018
 * - Browser Android modern & iOS
 */
export async function downloadBlobToDevice(
  blob: Blob,
  filename: string,
  pdfInstance?: jsPDF
): Promise<string> {
  const blobUrl = URL.createObjectURL(blob);

  // 1. Eksekusi unduhan via elemen <a> HTML5 standar dengan download attribute
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    a.setAttribute('download', filename);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      } catch {}
    }, 2000);
  } catch (err) {
    console.warn('HTML5 anchor download fallback:', err);
  }

  // 2. Eksekusi pdfInstance.save jika tersedia
  if (pdfInstance) {
    try {
      pdfInstance.save(filename);
    } catch (saveErr) {
      console.warn('pdfInstance.save fallback:', saveErr);
    }
  }

  // 3. Khusus di Mobile (Android PWA / Chrome Android): gunakan Web Share API jika didukung
  const isMobile =
    typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
      window.innerWidth < 768);

  if (isMobile && typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({
          title: filename,
          text: `Dokumen Resmi Cetak RW 018: ${filename}`,
          files: [file],
        }).catch((e: any) => {
          if (e?.name !== 'AbortError') {
            console.warn('Native share error:', e);
          }
        });
      }
    } catch (shareErr) {
      console.warn('Web Share file error:', shareErr);
    }
  }

  // Revoke object URL after delay to allow mobile browsers to finish downloading
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 120000); // 2 minutes

  return blobUrl;
}

/**
 * Konversi elemen HTML yang sedang ditampilkan pada halaman cetak menjadi dokumen PDF A4
 * dan otomatis download ke perangkat pengguna.
 *
 * Alur:
 * Data -> Hasil Cetak -> DOWNLOAD PDF -> File PDF
 */
export async function downloadElementAsPdf(
  elementOrId: HTMLElement | string,
  options: PdfExportOptions
): Promise<PdfExportResult> {
  const {
    filename,
    orientation = 'portrait',
    title = 'Dokumen Resmi RW 018',
    author = 'Ketua RW 018 Kampung Banten',
    subject = 'Laporan Resmi Cetak RW 018',
    keywords = 'RW 018, Kampung Banten, Iringmulyo, Metro Timur, PDF Resmi',
    onProgress,
    onSuccess,
    onError,
    addPageNumbers = true,
  } = options;

  try {
    // 1. Berikan notifikasi awal "Membuat PDF..."
    if (onProgress) {
      onProgress('Membuat PDF...');
    }

    // 2. Cari elemen HTML
    let element: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      element = document.getElementById(elementOrId);
    } else {
      element = elementOrId;
    }

    if (!element) {
      throw new Error(`Elemen cetak "${typeof elementOrId === 'string' ? elementOrId : 'target'}" tidak ditemukan.`);
    }

    // Tunggu gambar di dalam dokumen selesai dimuat jika ada
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    // 3. Render elemen HTML ke Canvas dengan kualitas tinggi (scale 2 untuk ketajaman tulisan dan gambar)
    const isPortrait = orientation === 'portrait';
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: isPortrait ? 794 : 1123, // Lebar standar CSS untuk A4 96 DPI
      onclone: (clonedDoc) => {
        // Pastikan elemen yang diklon terlihat jelas tanpa style display:none
        const clonedEl = typeof elementOrId === 'string'
          ? clonedDoc.getElementById(elementOrId)
          : null;
        if (clonedEl) {
          clonedEl.style.display = 'block';
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
        }
      },
    });

    // 4. Inisialisasi jsPDF dengan format standar A4
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = isPortrait ? 210 : 297;
    const pageHeight = isPortrait ? 297 : 210;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));

    if (imgHeight <= pageHeight) {
      // 1 Halaman Pas
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multi-Halaman: Bagi secara proporsional
      let heightLeft = imgHeight;
      let position = 0;
      let currentPage = 1;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);

      if (addPageNumbers && totalPages > 1) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Halaman ${currentPage} dari ${totalPages}`,
          pageWidth - 25,
          pageHeight - 6,
          { align: 'right' }
        );
      }

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(currentPage * pageHeight);
        pdf.addPage();
        currentPage++;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);

        if (addPageNumbers && totalPages > 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Halaman ${currentPage} dari ${totalPages}`,
            pageWidth - 25,
            pageHeight - 6,
            { align: 'right' }
          );
        }

        heightLeft -= pageHeight;
      }
    }

    // Set PDF Metadata
    pdf.setProperties({
      title,
      author,
      subject,
      keywords,
      creator: 'Sistem Administrasi Ketua RW 018 Kampung Banten',
    });

    // 5. Buat Blob & trigger download otomatis ke perangkat
    const blob = pdf.output('blob');
    const blobUrl = await downloadBlobToDevice(blob, filename, pdf);

    // 6. Tampilkan pesan sukses sesuai instruksi: "✅ PDF berhasil dibuat dan di-download."
    if (onSuccess) {
      onSuccess('✅ PDF berhasil dibuat dan di-download.');
    }

    return {
      success: true,
      filename,
      blob,
      blobUrl,
    };
  } catch (error: any) {
    console.error('Error saat membuat PDF:', error);
    const err = error instanceof Error ? error : new Error(String(error));

    // Pesan error sesuai instruksi: "❌ PDF gagal dibuat. Silakan coba lagi."
    if (onError) {
      onError(err, '❌ PDF gagal dibuat. Silakan coba lagi.');
    }

    return {
      success: false,
      filename,
      error: err,
    };
  }
}
