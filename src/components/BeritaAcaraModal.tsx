import React, { useRef, useState } from 'react';
import { SampleRecord } from '../types';
import { X, Printer, Download, Shield, RefreshCw, Share2 } from 'lucide-react';
import BeritaAcaraDocument from './BeritaAcaraDocument';

// @ts-ignore
import html2pdf from 'html2pdf.js';

interface BeritaAcaraModalProps {
  sample: SampleRecord;
  onClose: () => void;
}

export default function BeritaAcaraModal({ sample, onClose }: BeritaAcaraModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Berita-Acara-${sample.id}`;
    window.print();
    document.title = originalTitle;
  };

  const handleShare = async () => {
    const shareText = `Berita Acara Pengambilan Contoh Pupuk (BAPC)
ID Dokumen: ${sample.id}
Jenis Pupuk: ${sample.fertilizerType === 'Lainnya' ? sample.customFertilizerName : sample.fertilizerType}
PPC: ${sample.inspectorName}
Kode Sampling: ${sample.samplingCode || '-'}
Saksi: ${sample.witnessName}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Berita Acara ${sample.id}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\nLink Aplikasi: ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleDownloadPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    setIsDownloading(true);

    const opt = {
      margin: 0,
      filename: `BAPC-${sample.id.toUpperCase()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      alert('Gagal membuat dokumen PDF. Silakan coba kembali atau gunakan fitur Cetak (A4) -> Simpan sebagai PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="ba-modal-overlay">
      <style>{`
        @media print {
          /* Hide everything except the print-document-container */
          body * {
            visibility: hidden;
          }
          #print-document-container, #print-document-container * {
            visibility: visible;
          }
          #print-document-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            background: white;
          }
          /* Hide close buttons / print action headers during print */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-100 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" id="ba-modal-content">
        {/* Modal Toolbar Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-sm">RESMI</span>
            <h3 className="font-semibold text-sm sm:text-base">Pratinjau Berita Acara Pengambilan Contoh</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`${
                isDownloading 
                  ? 'bg-amber-600 text-white cursor-wait' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              } font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-80`}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Mengunduh PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Unduh PDF (A4)
                </>
              )}
            </button>

            {/* Print A4 Button */}
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Cetak (A4)
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`${
                copied ? 'bg-amber-600' : 'bg-sky-600 hover:bg-sky-500'
              } text-white font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer`}
              title="Bagikan Dokumen ini"
            >
              <Share2 className="h-4 w-4" />
              {copied ? 'Tersalin!' : 'Bagikan'}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Info Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-800 no-print shrink-0">
          <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Dokumen ini diterbitkan secara digital & terverifikasi audit SNI berdasarkan GPS dan e-Signature. Anda dapat mengunduh salinan PDF resmi secara instan.</span>
        </div>

        {/* Paper Container View */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/40 flex justify-center flex-grow">
          <BeritaAcaraDocument
            ref={printAreaRef}
            sample={sample}
          />
        </div>
      </div>
    </div>
  );
}
