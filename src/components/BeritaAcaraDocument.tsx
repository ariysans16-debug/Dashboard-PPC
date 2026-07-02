import React from 'react';
import { SampleRecord } from '../types';
import { Shield, MapPin, CheckCircle } from 'lucide-react';

interface BeritaAcaraDocumentProps {
  sample: SampleRecord;
}

export const BeritaAcaraDocument = React.forwardRef<HTMLDivElement, BeritaAcaraDocumentProps>(
  ({ sample }, ref) => {
    const getDayName = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        weekday: 'long',
        timeZone: 'Asia/Jakarta'
      });
    };

    const formatDateIndo = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      });
    };

    // Simplified custom 1D barcode generator using lines
    const renderBarcodeLines = (id: string) => {
      const bars = [];
      for (let i = 0; i < id.length; i++) {
        const charCode = id.charCodeAt(i);
        const width1 = (charCode % 3) + 1;
        const width2 = ((charCode >> 1) % 2) + 1;
        bars.push(
          <div
            key={`b1-${i}`}
            className="bg-black h-10"
            style={{ width: `${width1 * 1.5}px` }}
          />
        );
        bars.push(
          <div
            key={`s-${i}`}
            className="bg-transparent h-10"
            style={{ width: `${width2 * 1.5}px` }}
          />
        );
      }
      return <div className="flex items-center bg-white p-1">{bars}</div>;
    };

    return (
      <div
        id="print-document-container"
        ref={ref}
        className="w-[210mm] min-h-[297mm] p-[20mm] shadow-md border font-serif relative text-sm leading-relaxed block"
        style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#cbd5e1' }}
      >
        {/* Kop Surat (Document Header) */}
        <div>
          <div className="pb-4 flex items-center justify-between">
            <div className="text-left flex-grow">
              {/* Header texts removed as requested */}
            </div>
            <div className="flex flex-col items-end shrink-0 pl-4">
              {/* Barcode removed as requested */}
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h2 className="font-serif font-extrabold text-base underline uppercase">
              BERITA ACARA PENGAMBILAN CONTOH PUPUK (BAPC)
            </h2>
            <p className="font-mono text-xs mt-1" style={{ color: '#334155' }}>
              Nomor Dokumen: BASN/BAPC/{new Date(sample.timestamp).toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' })}/{sample.id.split('-')[2]}
            </p>
          </div>

          {/* Opening Statement */}
          <p className="indent-8 text-justify leading-relaxed mb-4">
            Pada hari ini{' '}
            <strong className="font-sans font-semibold">{getDayName(sample.timestamp)}</strong>{' '}
            tanggal{' '}
            <strong className="font-sans font-semibold">{formatDateIndo(sample.timestamp)}</strong>,
            kami yang bertandatangan di bawah ini, Petugas Pengambil Contoh (PPC) yang berwenang,
            telah melaksanakan pengambilan contoh (sampling) pupuk komersial di lapangan, dengan
            rincian teknis pelaksanaan sebagai berikut:
          </p>

          {/* Inspector and Witness details */}
          <div className="grid grid-cols-1 gap-1 mb-5">
            <div className="flex border-b py-1" style={{ borderBottomColor: '#f1f5f9' }}>
              <span className="w-48 font-semibold">1. Nama Petugas Lapangan (PPC)</span>
              <span className="w-4 text-center">:</span>
              <span className="flex-grow font-sans flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                <span className="font-bold">{sample.inspectorName}</span>
                {sample.inspectorCertificateNo && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-sans font-bold flex items-center gap-1 self-start sm:self-auto uppercase tracking-wider border"
                    style={{ backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }}
                    title="Sertifikat PPC Terverifikasi"
                  >
                    <Shield className="h-2.5 w-2.5" style={{ color: '#059669' }} />
                    LISENSI PPC: {sample.inspectorCertificateNo}
                  </span>
                )}
              </span>
            </div>
            <div className="flex border-b py-1" style={{ borderBottomColor: '#f1f5f9' }}>
              <span className="w-48 font-semibold">2. Nama Saksi Gudang (PPC-Saksi)</span>
              <span className="w-4 text-center">:</span>
              <span className="flex-grow font-sans">{sample.witnessName}</span>
            </div>
            <div className="flex border-b py-1" style={{ borderBottomColor: '#f1f5f9' }}>
              <span className="w-48 font-semibold">3. Lokasi Gudang / Penyimpanan</span>
              <span className="w-4 text-center">:</span>
              <span className="flex-grow font-sans flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 inline no-print" style={{ color: '#64748b' }} />
                {sample.locationName}
              </span>
            </div>
            {sample.latitude && sample.longitude && (
              <div className="flex border-b py-1" style={{ borderBottomColor: '#f1f5f9' }}>
                <span className="w-48 font-semibold">4. Koordinat Geo-Tagging GPS</span>
                <span className="w-4 text-center">:</span>
                <span className="flex-grow font-mono text-xs text-slate-700" style={{ color: '#334155' }}>
                  Lat {sample.latitude.toFixed(6)}, Lng {sample.longitude.toFixed(6)}{' '}
                  <span className="text-[10px] ml-1.5 font-sans font-bold no-print" style={{ color: '#059669' }}>
                    (Lokasi Terverifikasi Satelit)
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Fertilizer Technical Info Table */}
          <div className="mb-5" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#1e293b' }}>
              I. DATA FISIK SPESIFIKASI LOT PUPUK
            </h4>
            <table className="w-full border-collapse border text-left text-xs" style={{ borderColor: '#94a3b8' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th className="border p-2 font-sans font-bold" style={{ borderColor: '#94a3b8' }}>Kategori / Spesifikasi</th>
                  <th className="border p-2 font-sans font-bold" style={{ borderColor: '#94a3b8' }}>Detail Keterangan Lapangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Jenis / Merek Pupuk</td>
                  <td className="border p-2 font-sans font-medium text-sm" style={{ borderColor: '#94a3b8', color: '#1e293b' }}>
                    {sample.fertilizerType === 'Lainnya' ? sample.customFertilizerName : sample.fertilizerType}
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Nomor Kode Batch / Produksi</td>
                  <td className="border p-2 font-mono" style={{ borderColor: '#94a3b8' }}>{sample.batchNumber || 'BA-N/A'}</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Kode Sampling Utama Lot</td>
                  <td className="border p-2 font-mono font-bold" style={{ borderColor: '#94a3b8', color: '#022c22' }}>
                    {sample.samplingCode || 'SMP-N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-sans" style={{ borderColor: '#94a3b8' }}>Ukuran Lot Teruji (Populasi)</td>
                  <td className="border p-2 font-sans" style={{ borderColor: '#94a3b8' }}>{sample.totalBags} Karung</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Volume Sampel Diambil (SNI)</td>
                  <td className="border p-2 font-sans font-bold" style={{ borderColor: '#94a3b8', color: '#065f46' }}>
                    {sample.calculatedSampleSize} Karung{' '}
                    <span className="text-[10px] font-normal" style={{ color: '#64748b' }}>
                      (Acuan: SNI 19-0428-1998)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Nomor Urut Karung yang Diambil</td>
                  <td className="border p-2 font-mono flex flex-wrap gap-1" style={{ borderColor: '#94a3b8' }}>
                    {sample.randomIndices.map((idx) => `#${idx}`).join(', ')}
                  </td>
                </tr>
                {sample.notes && (
                  <tr>
                    <td className="border p-2 font-semibold" style={{ borderColor: '#94a3b8' }}>Catatan Kondisi Khusus</td>
                    <td className="border p-2 italic" style={{ borderColor: '#94a3b8', color: '#475569' }}>{sample.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Appendix / Attached list of bag seals */}
          {sample.sampleBagCodes && sample.sampleBagCodes.length > 0 && (
            <div className="mb-5" id="seals-appendix-ba" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <h5 className="font-sans font-bold text-[10px] uppercase tracking-wide mb-1.5 font-semibold" style={{ color: '#334155' }}>
                • DAFTAR SEGEL KEAMANAN SETIAP KARUNG SAMPEL (VERIFIKASI LABORATORIUM)
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 border rounded-md p-2 text-[10px] font-mono leading-tight" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                {sample.sampleBagCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border p-1 px-1.5 rounded"
                    style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                  >
                    <span className="px-1 py-0.5 rounded text-[8px] font-sans font-bold" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      Karung #{sample.randomIndices[idx] || idx + 1}
                    </span>
                    <span className="font-bold text-[9px]" style={{ color: '#1e293b' }}>{code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance checklist verification */}
          <div className="mb-5" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#1e293b' }}>
              II. PERNYATAAN KEPATUHAN SOP PENGAMBILAN CONTOH
            </h4>
            <div className="border rounded-lg p-3.5 text-xs flex flex-col gap-1.5 leading-relaxed font-sans" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#334155' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" style={{ color: '#059669' }} />
                <span className="font-semibold" style={{ color: '#0f172a' }}>Teknis Pengambilan Homogen Sesuai Standar:</span>
              </div>
              <p className="pl-6 italic">
                "Bahwa seluruh proses penarikan sampel dilakukan secara acak menggunakan alat pengambil
                contoh probe steril sesuai sebaran acak sistematis, diproses dengan cara perempat
                (Quartering), disegel kuat menggunakan Security Seal dengan kode pengaman, dan
                identifikasi secara unik demi keabsahan integritas pengujian laboratorium."
              </p>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-16 pt-8" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <p className="text-right text-xs mb-8">Jakarta, {formatDateIndo(sample.timestamp)}</p>
          <div className="grid grid-cols-2 text-center text-xs">
            {/* Witness Signature */}
            <div className="flex flex-col items-center justify-between h-[160px]">
              <span className="font-semibold underline">Saksi Lapangan / Gudang</span>
              {sample.signatureWitness ? (
                <img
                  src={sample.signatureWitness}
                  alt="Tanda Tangan Saksi"
                  className="h-16 object-contain border-b p-1"
                  style={{ borderBottomColor: '#e2e8f0' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-32 border border-dashed rounded flex items-center justify-center text-[10px] italic" style={{ borderColor: '#cbd5e1', color: '#94a3b8' }}>
                  Tanpa Tanda Tangan
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold font-sans uppercase">{sample.witnessName}</span>
                <span className="text-[10px]" style={{ color: '#64748b' }}>Staff Pengawas / PPC-Saksi</span>
              </div>
            </div>

            {/* Inspector Signature */}
            <div className="flex flex-col items-center justify-between h-[160px]">
              <span className="font-semibold underline">Petugas Pengambil Contoh (PPC)</span>
              {sample.signatureInspector ? (
                <img
                  src={sample.signatureInspector}
                  alt="Tanda Tangan PPC"
                  className="h-16 object-contain border-b p-1"
                  style={{ borderBottomColor: '#e2e8f0' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-32 border border-dashed rounded flex items-center justify-center text-[10px] italic" style={{ borderColor: '#cbd5e1', color: '#94a3b8' }}>
                  Tanpa Tanda Tangan
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold font-sans uppercase">{sample.inspectorName}</span>
                <span className="text-[10px]" style={{ color: '#64748b' }}>PPC Utama BASN</span>
                {sample.inspectorCertificateNo && (
                  <span
                    className="text-[8px] font-sans font-black tracking-wider uppercase mt-1 flex items-center justify-center gap-0.5"
                    style={{ color: '#047857' }}
                    id="cert-stamp-ba"
                  >
                    🛡️ TERLEGALISASI ({sample.inspectorCertificateNo})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer legal disclaimer removed as requested */}
        </div>
      </div>
    );
  }
);

BeritaAcaraDocument.displayName = 'BeritaAcaraDocument';
export default BeritaAcaraDocument;
