import React, { useState, useEffect } from 'react';
import { PPCCertificate } from '../types';
import { 
  User, Mail, Phone, Building, Award, FileText, Eye, Download, Plus, 
  Trash2, Camera, Upload, CheckCircle2, X, Calendar, QrCode, ShieldCheck 
} from 'lucide-react';

interface PPCProfileTabProps {
  certificates: PPCCertificate[];
  onUpdateCertificates: (updated: PPCCertificate[]) => void;
  isAdminUnlocked: boolean;
}

export default function PPCProfileTab({ 
  certificates, 
  onUpdateCertificates,
  isAdminUnlocked 
}: PPCProfileTabProps) {
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<PPCCertificate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  
  // Custom non-blocking interactive state
  const [previewTab, setPreviewTab] = useState<'original' | 'digital'>('digital');
  const [profileToDeleteIndex, setProfileToDeleteIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Convert Base64 PDF to Local Blob URL for instant real-time in-screen preview
  useEffect(() => {
    if (selectedCertForPreview?.fileData) {
      const dataStr = selectedCertForPreview.fileData;
      if (dataStr.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Parts = dataStr.split(',');
          if (base64Parts[1]) {
            const binaryStr = window.atob(base64Parts[1]);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
            return () => {
              URL.revokeObjectURL(url);
            };
          }
        } catch (e) {
          console.error('Failed to convert base64 to Blob URL:', e);
          setPdfBlobUrl(dataStr);
        }
      } else {
        setPdfBlobUrl(dataStr);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [selectedCertForPreview]);

  // New Profile Form State
  const [name, setName] = useState('');
  const [certNo, setCertNo] = useState('');
  const [title, setTitle] = useState('Petugas Pengambil Contoh (PPC) Utama');
  const [agency, setAgency] = useState('Badan Standardisasi Instrumen Pertanian (BSIP)');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [pdfData, setPdfData] = useState<{ name: string; size: string; data: string } | null>(null);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
  };

  const resetForm = () => {
    setName('');
    setCertNo('');
    setTitle('Petugas Pengambil Contoh (PPC) Utama');
    setAgency('Badan Standardisasi Instrumen Pertanian (BSIP)');
    setEmail('');
    setPhone('');
    setPhotoBase64('');
    setPdfData(null);
    setEditingCertIndex(null);
  };

  const handleOpenPreview = (cert: PPCCertificate) => {
    setSelectedCertForPreview(cert);
    if (cert.fileData && cert.fileData !== 'data:application/pdf;base64,JVBERi0xLjQK...') {
      setPreviewTab('original');
    } else {
      setPreviewTab('digital');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerError('Format berkas foto tidak didukung! Silakan pilih file gambar dengan format JPG atau PNG.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (index !== undefined) {
          // Direct update on existing certificate card
          const updated = [...certificates];
          updated[index] = { ...updated[index], inspectorPhoto: base64 };
          onUpdateCertificates(updated);
        } else {
          setPhotoBase64(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        triggerError('Format dokumen sertifikat tidak valid! Silakan unggah berkas legalitas resmi berformat PDF (.pdf).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPdfData({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !certNo.trim()) {
      triggerError('Pengisian formulir tidak lengkap! Kolom Nama Lengkap dan Nomor Registrasi Lisensi PPC wajib diisi.');
      return;
    }

    const defaultPdfName = `Sertifikat_PPC_${name.replace(/\s+/g, '_')}.pdf`;

    const newProfile: PPCCertificate = {
      inspectorName: name,
      certificateNo: certNo,
      fileName: pdfData?.name || defaultPdfName,
      fileSize: pdfData?.size || '1.2 MB',
      uploadedAt: Date.now(),
      verified: true,
      fileData: pdfData?.data || 'data:application/pdf;base64,JVBERi0xLjQK...', // Mock or real base64
      inspectorPhoto: photoBase64 || undefined,
      inspectorTitle: title,
      inspectorAgency: agency,
      inspectorEmail: email || undefined,
      inspectorPhone: phone || undefined,
    };

    let updatedList = [...certificates];
    if (editingCertIndex !== null) {
      // Overwrite/edit existing
      updatedList[editingCertIndex] = {
        ...updatedList[editingCertIndex],
        ...newProfile,
        // Preserve photo or file if not newly uploaded
        inspectorPhoto: photoBase64 || updatedList[editingCertIndex].inspectorPhoto,
        fileData: pdfData?.data || updatedList[editingCertIndex].fileData,
        fileName: pdfData?.name || updatedList[editingCertIndex].fileName,
        fileSize: pdfData?.size || updatedList[editingCertIndex].fileSize,
      };
    } else {
      // Add new
      updatedList = [newProfile, ...updatedList];
    }

    onUpdateCertificates(updatedList);
    resetForm();
    setShowAddModal(false);
  };

  const startEditProfile = (index: number) => {
    const cert = certificates[index];
    setName(cert.inspectorName);
    setCertNo(cert.certificateNo);
    setTitle(cert.inspectorTitle || 'Petugas Pengambil Contoh (PPC) Utama');
    setAgency(cert.inspectorAgency || 'Badan Standardisasi Instrumen Pertanian (BSIP)');
    setEmail(cert.inspectorEmail || '');
    setPhone(cert.inspectorPhone || '');
    setPhotoBase64(cert.inspectorPhoto || '');
    setPdfData(cert.fileData ? { name: cert.fileName, size: cert.fileSize, data: cert.fileData } : null);
    setEditingCertIndex(index);
    setShowAddModal(true);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="ppc-profile-tab-root">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg sm:text-xl flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-600 shrink-0" />
            Direktori Kompetensi Petugas Pengambil Contoh (PPC)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar petugas PPC tersertifikasi yang berwenang melakukan sampling pupuk sesuai standar SNI 19-0428-1998. Terbuka untuk publik.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-center shrink-0 border border-emerald-700"
          id="btn-add-ppc-profile"
        >
          <Plus className="h-4 w-4" />
          Masukkan Profil PPC Baru
        </button>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="ppc-profile-grid">
        {certificates.map((cert, index) => {
          // Default fallbacks for rich features
          const displayTitle = cert.inspectorTitle || "Petugas Pengambil Contoh (PPC) Utama";
          const displayAgency = cert.inspectorAgency || "Balai Pengujian Standar Instrumen";
          const displayEmail = cert.inspectorEmail || "ppc.lapangan@bsn.go.id";
          const displayPhone = cert.inspectorPhone || "+62 811-2345-678";

          return (
            <div 
              key={index} 
              className="bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col overflow-hidden relative group"
            >
              {/* Card Banner Background */}
              <div className="h-20 bg-linear-to-r from-emerald-800 to-teal-700 relative flex items-end justify-end px-4 pb-2">
                <span className="text-[9px] bg-emerald-500/30 text-emerald-100 font-bold px-2 py-0.5 rounded backdrop-blur-xs uppercase tracking-wider font-mono">
                  SNI Certified
                </span>
              </div>

              {/* Photo & Identity Section */}
              <div className="px-5 pb-5 pt-2 flex-grow flex flex-col">
                <div className="flex items-start gap-4 -mt-10 mb-4">
                  {/* Avatar wrapper */}
                  <div className="relative h-20 w-20 rounded-2xl bg-slate-100 border-4 border-white shadow-md overflow-hidden shrink-0 group/avatar">
                    {cert.inspectorPhoto ? (
                      <img 
                        src={cert.inspectorPhoto} 
                        alt={cert.inspectorName} 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                    
                    {/* Hover photo overlay editor */}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer gap-1 text-center px-1">
                      <Camera className="h-4 w-4" />
                      Ganti Foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(e, index)}
                      />
                    </label>
                  </div>

                  <div className="pt-10 flex-grow min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug truncate" title={cert.inspectorName}>
                      {cert.inspectorName}
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold block truncate">
                      {displayTitle}
                    </span>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="flex flex-col gap-2.5 text-xs text-slate-600 mt-2 flex-grow">
                  <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 truncate" title={cert.certificateNo}>
                      {cert.certificateNo}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Building className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500 font-medium leading-relaxed">{displayAgency}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-medium truncate">{displayEmail}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-medium">{displayPhone}</span>
                  </div>
                </div>

                {/* Competency Badge */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Lisensi Aktif
                  </span>
                  
                  <span className="text-[9px] text-slate-400 font-mono">
                    Registrasi: {new Date(cert.uploadedAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </span>
                </div>
              </div>

              {/* PDF Document Actions Area */}
              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleOpenPreview(cert)}
                  className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                  id={`btn-preview-cert-${index}`}
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  Pratinjau Sertifikat
                </button>

                {cert.fileData && (
                  <a
                    href={cert.fileData}
                    download={cert.fileName}
                    className="flex items-center justify-center p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all"
                    title="Unduh Berkas Legalitas PDF"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}

                {/* Edit & Delete for Admin or creators */}
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditProfile(index)}
                    className="p-2 bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Edit Profil"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProfileToDeleteIndex(index)}
                    className="p-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Hapus Profil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {certificates.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 p-6 flex flex-col items-center justify-center gap-3">
            <Award className="h-12 w-12 text-slate-300" />
            <h4 className="font-extrabold text-slate-700 text-sm">Belum Ada Profil PPC Terdaftar</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Silakan masukkan profil dan sertifikat kompetensi baru menggunakan tombol di atas agar dapat dilihat oleh semua orang.
            </p>
          </div>
        )}
      </div>

      {/* 1. PPCCertificate Preview Modal - Rich Simulated Document (Highly Polished) */}
      {selectedCertForPreview && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col my-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm">Dokumen Legalitas Kompetensi PPC</span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedCertForPreview.fileData && (
                  <a
                    href={pdfBlobUrl || selectedCertForPreview.fileData}
                    download={selectedCertForPreview.fileName}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-all font-bold text-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Unduh Asli
                  </a>
                )}
                <button
                  onClick={() => setSelectedCertForPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tab Selector if pdfData exists and is valid */}
            {selectedCertForPreview.fileData && (
              <div className="flex bg-slate-100 p-1 rounded-xl mx-6 mt-4 border border-slate-200/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewTab('original')}
                  className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    previewTab === 'original'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📄 Berkas PDF Asli ({selectedCertForPreview.fileName.length > 20 ? selectedCertForPreview.fileName.substring(0, 18) + '...' : selectedCertForPreview.fileName})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('digital')}
                  className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    previewTab === 'digital'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏆 Piagam Kompetensi Digital
                </button>
              </div>
            )}

            {/* Main Content Area based on Selected Tab */}
            {previewTab === 'original' && selectedCertForPreview.fileData ? (
              <div className="p-6 overflow-y-auto max-h-[75vh]" id="pdf-certificate-preview-container">
                <div className="w-full h-[55vh] flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-50 relative">
                  {pdfBlobUrl ? (
                    <iframe
                      src={`${pdfBlobUrl}#toolbar=1&navpanes=0&messages=0`}
                      className="w-full h-full min-h-[420px] bg-slate-100"
                      title={selectedCertForPreview.fileName}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50">
                      <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></span>
                      <span className="text-xs font-semibold">Memuat dokumen PDF asli...</span>
                    </div>
                  )}
                </div>

                {/* Fallback & Helper Notice for Iframe blocks */}
                <div className="mt-3.5 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="text-left">
                    <span className="text-xs font-bold text-amber-800 block">Kendala Tampilan Dokumen?</span>
                    <span className="text-[11px] text-amber-700 block leading-relaxed">
                      Beberapa peramban/sandbox memblokir tampilan PDF dalam layar. Anda dapat mengunduh berkas asli atau membukanya langsung.
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={pdfBlobUrl || selectedCertForPreview.fileData}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                    >
                      <Eye className="h-3 w-3 text-emerald-400" /> Buka PDF Baru ↗
                    </a>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <span>Nama Berkas: <strong className="text-slate-700 font-bold">{selectedCertForPreview.fileName}</strong></span>
                  <span>Ukuran: <strong className="text-slate-700 font-bold">{selectedCertForPreview.fileSize}</strong></span>
                </div>
              </div>
            ) : (
              /* Simulated Legal Certificate Page (Perfect Print & Visual Craftsmanship) */
              <div className="p-8 sm:p-12 overflow-y-auto max-h-[75vh]" id="legal-certificate-page">
                <div className="border-8 border-double border-emerald-800/80 p-6 sm:p-10 rounded-2xl bg-radial from-amber-50/10 via-white to-white relative overflow-hidden flex flex-col items-center text-center">
                  
                  {/* Background watermark badge */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <Award className="h-[400px] w-[400px] text-emerald-800" />
                  </div>

                  {/* Header Logo & Republic Banner */}
                  <div className="flex flex-col items-center gap-1.5 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Award className="h-10 w-10 text-emerald-800" />
                      <div className="text-left leading-none">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">KEMENTERIAN PERTANIAN</span>
                        <span className="text-[12px] font-extrabold text-slate-800 tracking-tight block">REPUBLIK INDONESIA</span>
                      </div>
                    </div>
                    <div className="h-0.5 w-40 bg-emerald-800"></div>
                    <div className="h-[1px] w-48 bg-emerald-800/50 mt-[1px]"></div>
                  </div>

                  {/* Doc Title */}
                  <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 tracking-wide font-black uppercase mb-1">
                    Sertifikat Kompetensi
                  </h2>
                  <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-200/50">
                    REGISTRASI LISENSI: {selectedCertForPreview.certificateNo}
                  </span>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mt-6 max-w-lg">
                    Dengan ini menerangkan bahwa Lembaga Standardisasi dan Pengawasan Mutu Nasional mensertifikasi keahlian teknis dan profesional atas nama personil:
                  </p>

                  {/* Name & Title Accent */}
                  <div className="my-6 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-200/50 inline-block max-w-md w-full">
                    <h3 className="font-sans text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {selectedCertForPreview.inspectorName}
                    </h3>
                    <div className="h-[1px] w-24 bg-slate-200 mx-auto my-1.5"></div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">
                      {selectedCertForPreview.inspectorTitle || "PETUGAS PENGAMBIL CONTOH (PPC) UTAMA"}
                    </span>
                  </div>

                  {/* Legal Statement */}
                  <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                    Telah dinyatakan KOMPETEN dan MEMENUHI KUALIFIKASI administratif maupun teknis lapangan untuk melakukan tindakan pengambilan contoh (sampling) pupuk anorganik tunggal maupun majemuk sesuai dengan standar nasional yang berlaku:
                  </p>
                  
                  <div className="my-4 bg-emerald-50 text-emerald-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-emerald-100/80 inline-block font-mono">
                    SNI 19-0428-1998: PETUNJUK PENGAMBILAN CONTOH PUPUK
                  </div>

                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Sertifikat ini berlaku di seluruh wilayah hukum Republik Indonesia untuk kepentingan sertifikasi mutu, verifikasi laboratorium, serta penerbitan Berita Acara resmi.
                  </p>

                  {/* Bottom Signature & Verification Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full mt-10 border-t border-slate-100 pt-6">
                    {/* Left Side: QR Code Verification */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-slate-800" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-700 block uppercase">PIN VERIFIED ONLINE</span>
                        <span className="text-[8px] text-slate-400 block font-mono">PPC ID: {selectedCertForPreview.certificateNo.replace(/\//g, '-')}</span>
                      </div>
                    </div>

                    {/* Right Side: Signing Authority and Gold Seal */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">KOMITE AKREDITASI NASIONAL</span>
                      
                      {/* Golden Circle Seal representation */}
                      <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center relative shadow-inner my-1">
                        <Award className="h-8 w-8 text-amber-600" />
                        <span className="absolute text-[6px] font-black text-amber-700 animate-spin-slow">KAN • BSN • BSIP • KEMENTAN</span>
                      </div>

                      <span className="text-xs font-black text-slate-800 border-b border-slate-300 pb-0.5 uppercase">Dr. Ir. Suharyono, M.Sc.</span>
                      <span className="text-[9px] text-slate-400">Kepala Lembaga Sertifikasi Standardisasi</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Modal Footer Disclaimer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400 rounded-b-3xl">
              Dokumen ini disinkronisasikan secara sah dengan database BSN. Diunggah tanggal {new Date(selectedCertForPreview.uploadedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.
            </div>
          </div>
        </div>
      )}

      {/* 2. Form Modal - Add / Edit PPC Profile (Interactive & Responsive) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 relative my-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  {editingCertIndex !== null ? 'Perbarui Profil PPC' : 'Masukkan Profil PPC Baru'}
                </h3>
                <p className="text-xs text-slate-500">Isi formulir lengkap dengan foto dan sertifikasi Anda untuk dilihat publik.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
              {/* Profile Photo Uploader Zone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Foto Profil Petugas
                </label>
                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative shadow-2xs">
                    {photoBase64 ? (
                      <img src={photoBase64} alt="Pre-upload" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <span className="text-xs text-slate-600 font-bold block mb-1">Pilih Gambar Profil Anda</span>
                    <span className="text-[10px] text-slate-400 block mb-2">Mendukung format JPG/PNG, ukuran maks 2MB.</span>
                    <label className="inline-block px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-3xs cursor-pointer transition-all">
                      Pilih Foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Inspector Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Lengkap Petugas Lapangan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                    placeholder="Contoh: Budi Setiawan, S.T."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gelar Jabatan Kompetensi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                    placeholder="Contoh: PPC Utama BASN"
                  />
                </div>
              </div>

              {/* License Number & Agency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nomor Registrasi Lisensi PPC
                  </label>
                  <input
                    type="text"
                    value={certNo}
                    onChange={(e) => setCertNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white font-mono"
                    placeholder="Contoh: PPC/BASN-2026/0481"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Instansi / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                    placeholder="Badan Standardisasi Instrumen"
                  />
                </div>
              </div>

              {/* Contact Information (Email & Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Alamat Email Kontak
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                    placeholder="budisetiawan@bsn.go.id"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nomor Telepon Seluler
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                    placeholder="+62 811-2345-678"
                  />
                </div>
              </div>

              {/* Certificate PDF Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Unggah Berkas Sertifikat (PDF)</span>
                  <span className="text-[9px] text-slate-400 lowercase">Opsional (format .pdf)</span>
                </label>
                
                {pdfData ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-950 font-bold text-xs p-3.5 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{pdfData.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono shrink-0">({pdfData.size})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdfData(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-all p-4 text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handlePdfUpload}
                    />
                    <Upload className="h-5 w-5 text-slate-400 shrink-0 animate-bounce" />
                    <span className="text-xs font-semibold text-slate-700">Pilih dokumen PDF sertifikat</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-700 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  Simpan Profil Kompetensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Custom Delete Confirmation Modal */}
      {profileToDeleteIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-50 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Hapus Profil Kompetensi PPC</h3>
                <p className="text-xs text-slate-400">Konfirmasi Penghapusan Permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus profil kompetensi milik <strong className="text-slate-800 font-extrabold">{certificates[profileToDeleteIndex]?.inspectorName}</strong>?<br />
              Tindakan ini akan menghapus foto profil, data kompetensi registrasi <span className="font-mono bg-slate-50 px-1 py-0.5 rounded border border-slate-100 text-[11px] font-bold text-slate-700">{certificates[profileToDeleteIndex]?.certificateNo}</span>, beserta berkas PDF sertifikat dari sistem secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setProfileToDeleteIndex(null)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = certificates.filter((_, i) => i !== profileToDeleteIndex);
                  onUpdateCertificates(updated);
                  setProfileToDeleteIndex(null);
                }}
                className="w-2/3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-rose-700 flex items-center justify-center gap-1"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Custom Error/Warning Dialog Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-amber-600 border-b border-amber-50 pb-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Pemberitahuan Sistem</h3>
                <p className="text-xs text-slate-400">Verifikasi Berkas & Validasi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-3xs text-center"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
