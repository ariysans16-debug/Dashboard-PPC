import React, { useState } from 'react';
import { SampleRecord, FertilizerType } from '../types';
import { X, Shield, Save, MapPin, Compass, Tag, Calendar, Beaker, FileText, Clipboard } from 'lucide-react';

interface EditSampleModalProps {
  sample: SampleRecord;
  onClose: () => void;
  onSave: (updated: SampleRecord) => void;
}

export default function EditSampleModal({ sample, onClose, onSave }: EditSampleModalProps) {
  // Field States
  const [inspectorName, setInspectorName] = useState(sample.inspectorName || '');
  const [inspectorCertificateNo, setInspectorCertificateNo] = useState(sample.inspectorCertificateNo || '');
  const [witnessName, setWitnessName] = useState(sample.witnessName || '');
  const [locationName, setLocationName] = useState(sample.locationName || '');
  const [latitude, setLatitude] = useState<string>(sample.latitude !== null ? sample.latitude.toString() : '');
  const [longitude, setLongitude] = useState<string>(sample.longitude !== null ? sample.longitude.toString() : '');
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>(sample.fertilizerType);
  const [customFertilizerName, setCustomFertilizerName] = useState(sample.customFertilizerName || '');
  const [batchNumber, setBatchNumber] = useState(sample.batchNumber || '');
  const [samplingCode, setSamplingCode] = useState(sample.samplingCode || '');
  const [totalBags, setTotalBags] = useState<number>(sample.totalBags || 0);
  const [calculatedSampleSize, setCalculatedSampleSize] = useState<number>(sample.calculatedSampleSize || 0);
  
  // Convert arrays to editable comma-separated strings
  const [randomIndicesStr, setRandomIndicesStr] = useState<string>(
    (sample.randomIndices || []).join(', ')
  );
  const [sampleBagCodesStr, setSampleBagCodesStr] = useState<string>(
    (sample.sampleBagCodes || []).join(', ')
  );
  
  const [notes, setNotes] = useState(sample.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse coordinates safely
    const parsedLat = latitude.trim() !== '' ? parseFloat(latitude) : null;
    const parsedLng = longitude.trim() !== '' ? parseFloat(longitude) : null;

    // Parse comma-separated randomIndices
    const parsedRandomIndices = randomIndicesStr
      .split(',')
      .map(item => parseInt(item.trim(), 10))
      .filter(item => !isNaN(item));

    // Parse comma-separated bag codes
    const parsedSampleBagCodes = sampleBagCodesStr
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');

    const updatedRecord: SampleRecord = {
      ...sample,
      inspectorName,
      inspectorCertificateNo: inspectorCertificateNo || undefined,
      witnessName,
      locationName,
      latitude: parsedLat,
      longitude: parsedLng,
      fertilizerType,
      customFertilizerName: fertilizerType === 'Lainnya' ? customFertilizerName : undefined,
      batchNumber,
      samplingCode: samplingCode || undefined,
      totalBags,
      calculatedSampleSize,
      randomIndices: parsedRandomIndices,
      sampleBagCodes: parsedSampleBagCodes.length > 0 ? parsedSampleBagCodes : undefined,
      notes,
    };

    onSave(updatedRecord);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="edit-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" id="edit-modal-content">
        
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-amber-100" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-none">Edit Dokumen Berita Acara</h3>
              <p className="text-[11px] text-amber-100 mt-0.5">ID Dokumen: {sample.id} • Mode Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-amber-700 text-amber-100 hover:text-white rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: PPC & Saksi Lapangan */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
              <Clipboard className="h-4 w-4" /> I. Data Identitas Lapangan
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Petugas PPC Utama
                </label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nomor Sertifikat Lisensi PPC
                </label>
                <input
                  type="text"
                  value={inspectorCertificateNo}
                  onChange={(e) => setInspectorCertificateNo(e.target.value)}
                  placeholder="Contoh: PPC/BASN-2026/0481"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Saksi Lapangan (PPC-Saksi / Staff Gudang)
                </label>
                <input
                  type="text"
                  required
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Lokasi & Geotagging */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
              <MapPin className="h-4 w-4" /> II. Lokasi & Geotagging GPS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nama Gudang / Pabrik
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-2.9813"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="104.7937"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Spesifikasi Lot & Kode Sampling */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
              <Beaker className="h-4 w-4" /> III. Spesifikasi Lot Pupuk & Kode Sampling
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Jenis Pupuk
                </label>
                <select
                  value={fertilizerType}
                  onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
                >
                  <option value="Urea">Urea (Subdisi/Nonsubsidi)</option>
                  <option value="NPK">NPK Phonska / Pelangi</option>
                  <option value="SP-36">SP-36 (Super Fosfat)</option>
                  <option value="ZA">ZA (Amonium Sulfat)</option>
                  <option value="Phonska">Phonska</option>
                  <option value="Organik">Organik</option>
                  <option value="KCI">KCl (Kalium Klorida)</option>
                  <option value="Lainnya">Pupuk Jenis Lain...</option>
                </select>
              </div>

              {fertilizerType === 'Lainnya' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Pupuk Kustom
                  </label>
                  <input
                    type="text"
                    required
                    value={customFertilizerName}
                    onChange={(e) => setCustomFertilizerName(e.target.value)}
                    placeholder="Masukkan nama pupuk khusus"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nomor Kode Batch / Produksi
                </label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Kode Sampling Utama Lot (BAPC)
                </label>
                <input
                  type="text"
                  required
                  value={samplingCode}
                  onChange={(e) => setSamplingCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ukuran Lot Teruji (Jumlah Karung)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalBags}
                  onChange={(e) => setTotalBags(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Volume Sampel Diambil (SNI)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={calculatedSampleSize}
                  onChange={(e) => setCalculatedSampleSize(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nomor Urut Karung yang Diambil (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  required
                  value={randomIndicesStr}
                  onChange={(e) => setRandomIndicesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                  placeholder="Contoh: 14, 52, 91"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Daftar Segel Keamanan Karung (Pisahkan dengan koma)
                </label>
                <textarea
                  value={sampleBagCodesStr}
                  onChange={(e) => setSampleBagCodesStr(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                  placeholder="Contoh: SEAL-URE-01, SEAL-URE-02"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Catatan Khusus */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
              <FileText className="h-4 w-4" /> IV. Informasi Pendukung & Catatan Lapangan
            </h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Catatan Kondisi Khusus / Keterangan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                placeholder="Catatan tambahan kondisi tumpukan, kemasan karung, dll."
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </button>
        </div>

      </div>
    </div>
  );
}
