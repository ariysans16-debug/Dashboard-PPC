import React, { useState, useRef } from 'react';
import { SampleRecord, FertilizerType } from '../types';
import { Search, Filter, Trash2, Eye, Server, CheckCircle2, QrCode, FileText, Beaker, MapPin, Printer, Download, RefreshCw, Edit, Share2 } from 'lucide-react';
import BeritaAcaraDocument from './BeritaAcaraDocument';

// @ts-ignore
import html2pdf from 'html2pdf.js';

interface SampleListProps {
  samples: SampleRecord[];
  onViewSample: (sample: SampleRecord) => void;
  onDeleteSample: (id: string) => void;
  onUpdateLabStatus?: (id: string, status: string) => void;
  isAdminUnlocked?: boolean;
  onEditSample?: (sample: SampleRecord) => void;
}

// Generate a deterministic visual pseudo-QR code pattern using an SVG grid
export function DeterministicQRCode({ data, size = 64 }: { data: string; size?: number }) {
  // Simple hashing function to create a 12x12 grid patterns
  const getGridPattern = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const grid: boolean[][] = [];
    const gridSize = 12;

    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        // Standard QR code finder patterns in corners
        const isFinderPattern =
          (r < 3 && c < 3) || // top-left
          (r < 3 && c >= gridSize - 3) || // top-right
          (r >= gridSize - 3 && c < 3); // bottom-left

        if (isFinderPattern) {
          // Fill solid borders with a hollow center
          const innerX = r < 3 ? r : r - (gridSize - 3);
          const innerY = c < 3 ? c : c - (gridSize - 3);
          grid[r][c] = !(innerX === 1 && innerY === 1);
        } else {
          // Deterministic noise based on hash
          const bitIndex = (r * gridSize + c) % 32;
          const isBitSet = ((hash >> bitIndex) & 1) === 1;
          grid[r][c] = isBitSet;
        }
      }
    }
    return grid;
  };

  const grid = getGridPattern(data);
  const cellSize = size / 12;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-1 border border-slate-200 rounded-md">
      {grid.map((row, r) =>
        row.map((isFilled, c) => (
          isFilled && (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1} // overlap to remove subpixel lines
              height={cellSize + 0.1}
              fill="#0f172a"
            />
          )
        ))
      )}
    </svg>
  );
}

export default function SampleList({
  samples,
  onViewSample,
  onDeleteSample,
  onUpdateLabStatus,
  isAdminUnlocked = false,
  onEditSample
}: SampleListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFertilizer, setFilterFertilizer] = useState<string>('all');
  const [filterSync, setFilterSync] = useState<string>('all');

  // Direct PDF Download States & Refs
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeDownloadSample, setActiveDownloadSample] = useState<SampleRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleShareDirect = async (sample: SampleRecord) => {
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
      try {
        await navigator.clipboard.writeText(`${shareText}\n\nLink Aplikasi: ${window.location.href}`);
        setCopiedId(sample.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleDownloadDirect = async (sample: SampleRecord) => {
    setActiveDownloadSample(sample);
    setDownloadingId(sample.id);

    // Let React render the hidden component first
    setTimeout(async () => {
      const element = downloadRef.current;
      if (!element) {
        setDownloadingId(null);
        setActiveDownloadSample(null);
        return;
      }

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
        console.error('Direct download failed:', error);
        alert('Gagal mengunduh PDF secara langsung. Silakan buka pratinjau Berita Acara dan unduh dari sana.');
      } finally {
        setDownloadingId(null);
        setActiveDownloadSample(null);
      }
    }, 200);
  };


  // Simulated laboratory status database
  // In a real application, this would come from the server-side, but let's persist it dynamically in state if possible or keep local defaults.
  const [labStatuses, setLabStatuses] = useState<Record<string, 'Dikirim' | 'Diuji' | 'Selesai'>>({});

  const handleUpdateLabStatus = (id: string, newStatus: 'Dikirim' | 'Diuji' | 'Selesai') => {
    setLabStatuses(prev => ({ ...prev, [id]: newStatus }));
    if (onUpdateLabStatus) {
      onUpdateLabStatus(id, newStatus);
    }
  };

  // Filter & Search logic
  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFertilizer = filterFertilizer === 'all' || sample.fertilizerType === filterFertilizer;
    const matchesSync = filterSync === 'all' || sample.syncStatus === filterSync;

    return matchesSearch && matchesFertilizer && matchesSync;
  });

  const getLabStatusInfo = (id: string) => {
    const status = labStatuses[id] || 'Dikirim';
    switch (status) {
      case 'Dikirim':
        return { label: 'Dikirim ke Lab', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Diuji':
        return { label: 'Sedang Diuji', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Selesai':
        return { label: 'Pengujian Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5" id="sample-list-module">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Manajemen Inventaris Sampel</h3>
          <p className="text-xs text-slate-500">Pelacakan, kode QR, dan status sertifikasi laboratorium pusat</p>
        </div>
        
        {/* Sync Summary Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
            Draft: {samples.filter(s => s.syncStatus === 'draft').length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Synced: {samples.filter(s => s.syncStatus === 'synced').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="filters-row">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs sm:text-sm text-slate-800 transition-all"
            placeholder="Cari ID, lokasi, batch, atau petugas..."
            id="search-input"
          />
        </div>

        {/* Filter Fertilizer */}
        <div className="sm:col-span-4 relative">
          <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            value={filterFertilizer}
            onChange={(e) => setFilterFertilizer(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs sm:text-sm text-slate-700 transition-all appearance-none cursor-pointer"
            id="fertilizer-filter-select"
          >
            <option value="all">Semua Jenis Pupuk</option>
            <option value="Urea">Pupuk Urea</option>
            <option value="NPK">Pupuk NPK</option>
            <option value="SP-36">Pupuk SP-36</option>
            <option value="ZA">Pupuk ZA</option>
            <option value="Phonska">Pupuk Phonska</option>
            <option value="Organik">Pupuk Organik</option>
            <option value="KCI">Pupuk KCI</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Filter Sync Status */}
        <div className="sm:col-span-3">
          <select
            value={filterSync}
            onChange={(e) => setFilterSync(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs sm:text-sm text-slate-700 transition-all cursor-pointer"
            id="sync-filter-select"
          >
            <option value="all">Semua Status Sync</option>
            <option value="draft">Draft Lokal</option>
            <option value="synced">Tersinkronisasi</option>
          </select>
        </div>
      </div>

      {/* Main Table/List */}
      {filteredSamples.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
            <Search className="h-6 w-6 stroke-1" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 text-sm">Tidak Ada Sampel Ditemukan</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {samples.length === 0
                ? 'Belum ada data pengambilan sampel yang terekam. Silakan gunakan kalkulator dan selesaikan SOP untuk membuat Berita Acara pertama Anda!'
                : 'Sesuaikan kriteria pencarian atau filter Anda untuk menemukan data sampel.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredSamples.map((sample) => {
            const labStatus = getLabStatusInfo(sample.id);
            return (
              <div
                key={sample.id}
                className="group border border-slate-100 hover:border-emerald-100 bg-white hover:bg-emerald-50/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all shadow-2xs"
                id={`sample-item-${sample.id}`}
              >
                {/* QR and Title Block */}
                <div className="flex items-start gap-4 flex-grow">
                  {/* QR Code Graphic Sticker */}
                  <div className="shrink-0 relative group-hover:scale-105 transition-all">
                    <DeterministicQRCode data={sample.id} size={64} />
                    <span className="absolute -bottom-1 -left-1 text-[7px] font-mono bg-slate-900 text-white px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                      QR TAG
                    </span>
                  </div>

                  {/* Main Info */}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-tight">
                        {sample.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/50">
                        {sample.fertilizerType === 'Lainnya' ? sample.customFertilizerName : sample.fertilizerType}
                      </span>
                      {sample.syncStatus === 'synced' ? (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                          <Server className="h-2.5 w-2.5" /> Synced
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Draft Lokal
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm sm:text-base flex flex-wrap items-center gap-1.5">
                      <span>Batch #{sample.batchNumber || 'N/A'} - Lot: {sample.totalBags} Karung</span>
                      {sample.samplingCode && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold" title="Kode Sampling Lot Utama">
                          {sample.samplingCode}
                        </span>
                      )}
                    </h4>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {sample.locationName}
                      </span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span>PPC: {sample.inspectorName}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span>{new Date(sample.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })}</span>
                    </div>
                  </div>
                </div>

                {/* Laboratory tracking controls & Document viewer */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end shrink-0">
                  
                  {/* Lab Status Badge with Sync Check */}
                  {sample.syncStatus === 'synced' ? (
                    <div className="flex flex-col gap-1.5 min-w-[130px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LABORATORIUM QA</span>
                      <div className="flex gap-1">
                        <select
                          value={labStatuses[sample.id] || 'Dikirim'}
                          onChange={(e) => handleUpdateLabStatus(sample.id, e.target.value as any)}
                          className={`text-[10px] font-bold py-1 px-2.5 border rounded-lg focus:outline-none transition-all cursor-pointer ${
                            getLabStatusInfo(sample.id).color
                          }`}
                        >
                          <option value="Dikirim">🚚 Dikirim</option>
                          <option value="Diuji">🔬 Diuji</option>
                          <option value="Selesai">✅ Selesai</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic max-w-[140px] leading-tight">
                      *Sinkronkan terlebih dahulu ke server untuk memulai pelacakan pengujian lab.
                    </div>
                  )}

                  {/* Operational buttons */}
                  <div className="flex items-center gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => onViewSample(sample)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer"
                      title="Buka Berita Acara"
                      id={`btn-view-${sample.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {/* Admin Edit Button */}
                    {isAdminUnlocked && onEditSample && (
                      <button
                        onClick={() => onEditSample(sample)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all cursor-pointer"
                        title="Edit Berita Acara (Admin)"
                        id={`btn-edit-${sample.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}

                    {/* Direct Download PDF Button */}
                    <button
                      onClick={() => handleDownloadDirect(sample)}
                      disabled={downloadingId !== null}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Unduh PDF Berita Acara"
                      id={`btn-download-${sample.id}`}
                    >
                      {downloadingId === sample.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>

                    {/* Direct Share Button */}
                    <button
                      onClick={() => handleShareDirect(sample)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        copiedId === sample.id
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-700'
                      }`}
                      title="Bagikan Berita Acara"
                      id={`btn-share-${sample.id}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteSample(sample.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                      title="Hapus Rekaman"
                      id={`btn-delete-${sample.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden container for direct PDF exports */}
      {activeDownloadSample && (
        <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none no-print">
          <div className="w-[210mm] min-h-[297mm] p-0 m-0 bg-white">
            <BeritaAcaraDocument ref={downloadRef} sample={activeDownloadSample} />
          </div>
        </div>
      )}
    </div>
  );
}
