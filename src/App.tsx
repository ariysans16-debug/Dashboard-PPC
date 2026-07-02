import React, { useState, useEffect } from 'react';
import { SampleRecord, FertilizerType, PPCCertificate } from './types';
import SamplingCalculator, { SAMPLING_METHODS } from './components/SamplingCalculator';
import SOPGuidelines, { SOP_ITEMS } from './components/SOPGuidelines';
import SignaturePad from './components/SignaturePad';
import CloudSyncStatus from './components/CloudSyncStatus';
import BeritaAcaraModal from './components/BeritaAcaraModal';
import SampleList from './components/SampleList';
import PPCProfileTab from './components/PPCProfileTab';
import EditSampleModal from './components/EditSampleModal';
import {
  Sprout,
  ShieldAlert,
  Shield,
  X,
  MapPin,
  ClipboardList,
  FileText,
  User,
  Users,
  Layers,
  FileSpreadsheet,
  Plus,
  Compass,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Calculator,
  ClipboardCheck,
  Archive,
  Tag,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Trash2
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'sni_fertilizer_samples';

export default function App() {
  // --- Persistent Storage State ---
  const [samples, setSamples] = useState<SampleRecord[]>([]);

  // --- Form Draft State ---
  const [inspectorName, setInspectorName] = useState('Budi Setiawan, S.T.');
  const [witnessName, setWitnessName] = useState('Hendra Wijaya');
  const [locationName, setLocationName] = useState('Gudang Sektor 4, PT Pupuk Sriwidjaja');
  const [latitude, setLatitude] = useState<number | null>(-2.981329); // Default Palembang factory coordinates
  const [longitude, setLongitude] = useState<number | null>(104.793739);
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('Urea');
  const [customFertilizerName, setCustomFertilizerName] = useState('');
  const [batchNumber, setBatchNumber] = useState('BATCH-202606A');
  const [totalBags, setTotalBags] = useState<number>(350);
  const [calculatedSampleSize, setCalculatedSampleSize] = useState<number>(19); // default matching SNI for 350 bags (sqrt(350)=18.7)
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const [sopChecklist, setSopChecklist] = useState<Record<string, boolean>>({});
  const [signatureInspector, setSignatureInspector] = useState<string | null>(null);
  const [signatureWitness, setSignatureWitness] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // --- Sampling Code Automation State ---
  const [samplingCodePattern, setSamplingCodePattern] = useState<'standard' | 'sni' | 'custom'>('standard');
  const [customSamplingCode, setCustomSamplingCode] = useState('');
  const [generatedSamplingCode, setGeneratedSamplingCode] = useState('');
  const [generatedBagCodes, setGeneratedBagCodes] = useState<string[]>([]);
  const [copiedState, setCopiedState] = useState<boolean>(false);

  // --- UI Control State ---
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [selectedSampleForBA, setSelectedSampleForBA] = useState<SampleRecord | null>(null);
  const [showAggregatedReport, setShowAggregatedReport] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'form' | 'calculator' | 'sop' | 'history' | 'admin' | 'profile'>('all');
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(null);

  // --- Deletion Confirmation States ---
  const [certToDeleteIndex, setCertToDeleteIndex] = useState<number | null>(null);
  const [sampleToDeleteId, setSampleToDeleteId] = useState<string | null>(null);

  // --- Admin Edit State ---
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);

  // --- Live Clock & Date State (Asia/Jakarta / WIB) ---
  const [liveTime, setLiveTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    }) + ' WIB';
  });

  const [liveDate, setLiveDate] = useState<string>(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta'
        }) + ' WIB'
      );
      setLiveDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Jakarta'
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Admin Panel & PPC Competency Certificates State ---
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('sni_admin_unlocked') === 'true';
  });
  const [showPasscodeDialog, setShowPasscodeDialog] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  
  const [ppcCertificates, setPpcCertificates] = useState<PPCCertificate[]>(() => {
    const saved = localStorage.getItem('sni_ppc_certificates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure even saved old data has fileData so it doesn't break
        return parsed.map((c: PPCCertificate) => ({
          ...c,
          fileData: c.fileData || 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDYKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDYKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDYKL0xlbmd0aCA3Mwo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcwIDcwMCBUZAooc2VydGlmaWthdCBrb21wZXRlbnNpIHBwYyB0ZXJ2ZXJpZmlrYXNpKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDYKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTExID0wMDAwIG4gCjAwMDAwMDAyNDQgMDAwMDAgbiAKMDAwMDAwMDM2NiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRg==',
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        inspectorName: 'Budi Setiawan, S.T.',
        certificateNo: 'PPC/BASN-2026/0481',
        fileName: 'Sertifikat_Kompetensi_PPC_Budi_Setiawan.pdf',
        fileSize: '1.4 MB',
        uploadedAt: Date.now() - 3600000 * 24 * 10,
        verified: true,
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDYKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDYKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDYKL0xlbmd0aCA3Mwo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcwIDcwMCBUZAooc2VydGlmaWthdCBrb21wZXRlbnNpIHBwYyB0ZXJ2ZXJpZmlrYXNpKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDYKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTExID0wMDAwIG4gCjAwMDAwMDAyNDQgMDAwMDAgbiAKMDAwMDAwMDM2NiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRg=='
      }
    ];
  });

  const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

  useEffect(() => {
    localStorage.setItem('sni_admin_unlocked', isAdminUnlocked ? 'true' : 'false');
  }, [isAdminUnlocked]);

  useEffect(() => {
    localStorage.setItem('sni_ppc_certificates', JSON.stringify(ppcCertificates));
  }, [ppcCertificates]);

  // Helper to get short code of fertilizer
  const getFertilizerCode = (type: FertilizerType) => {
    switch (type) {
      case 'Urea': return 'URE';
      case 'NPK': return 'NPK';
      case 'SP-36': return 'SP3';
      case 'ZA': return 'ZA';
      case 'Phonska': return 'PHO';
      case 'Organik': return 'ORG';
      case 'KCI': return 'KCL';
      default: return 'LNY';
    }
  };

  // --- Auto-generate Sampling Code ---
  useEffect(() => {
    const fertCode = getFertilizerCode(fertilizerType);
    const cleanBatch = (batchNumber || 'BATCH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    let mainCode = '';
    if (samplingCodePattern === 'standard') {
      mainCode = `BASN/${fertCode}/${cleanBatch}/${todayStr}`;
    } else if (samplingCodePattern === 'sni') {
      mainCode = `SNI-19-0428/${fertCode}-${cleanBatch}`;
    } else {
      mainCode = customSamplingCode || `SMP-${fertCode}-${todayStr}`;
    }
    
    setGeneratedSamplingCode(mainCode);

    // Generate individual bag codes (e.g. seals) based on calculatedSampleSize
    const seals: string[] = [];
    const count = calculatedSampleSize || 1;
    for (let i = 1; i <= count; i++) {
      const padNum = i.toString().padStart(2, '0');
      seals.push(`SEAL-${fertCode}-${cleanBatch}-${padNum}`);
    }
    setGeneratedBagCodes(seals);
  }, [fertilizerType, batchNumber, calculatedSampleSize, samplingCodePattern, customSamplingCode]);

  // --- Load Local Storage ---
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSamples(parsed);
      } catch (e) {
        console.error('Gagal memuat data lokal:', e);
      }
    } else {
      // Seed some initial demo samples to populate the list on first load
      const demoSamples: SampleRecord[] = [
        {
          id: 'SP-20260630-001',
          date: new Date(Date.now() - 3600000 * 24).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          timestamp: Date.now() - 3600000 * 24,
          inspectorName: 'Budi Setiawan, S.T.',
          witnessName: 'M. Yusuf',
          locationName: 'Gudang Pusat Distribusi Gresik',
          latitude: -7.159389,
          longitude: 112.651582,
          fertilizerType: 'NPK',
          batchNumber: 'BATCH-NPK99B',
          totalBags: 800,
          calculatedSampleSize: 29,
          randomIndices: [14, 52, 91, 120, 163, 199, 230, 267, 310, 354, 399, 412, 450, 481, 510, 554, 599, 612, 644, 680, 711, 742, 770, 781, 792, 795, 797, 798, 799],
          sopChecklist: SOP_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {}),
          signatureInspector: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M10,25 Q30,10 50,25 T90,25" fill="none" stroke="black" stroke-width="2"/></svg>',
          signatureWitness: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M10,20 Q40,35 60,10 T90,30" fill="none" stroke="black" stroke-width="2"/></svg>',
          notes: 'Lot pupuk tersusun rapi di palet kayu, segel kemasan terjamin rapat.',
          syncStatus: 'synced',
          syncTime: Date.now() - 3600000 * 23,
          samplingCode: 'BASN/NPK/BATCHNPK99B/20260629',
          sampleBagCodes: Array.from({ length: 29 }).map((_, i) => `SEAL-NPK-BATCHNPK99B-${(i + 1).toString().padStart(2, '0')}`),
          inspectorCertificateNo: 'PPC/BASN-2026/0481',
          inspectorCertificateName: 'Sertifikat_Kompetensi_PPC_Budi_Setiawan.pdf'
        },
        {
          id: 'SP-20260630-002',
          date: new Date(Date.now() - 3600000 * 2).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          timestamp: Date.now() - 3600000 * 2,
          inspectorName: 'Budi Setiawan, S.T.',
          witnessName: 'Hendra Wijaya',
          locationName: 'Gudang Sektor 4, PT Pupuk Sriwidjaja',
          latitude: -2.981329,
          longitude: 104.793739,
          fertilizerType: 'Urea',
          batchNumber: 'BATCH-UREA44X',
          totalBags: 120,
          calculatedSampleSize: 11,
          randomIndices: [12, 23, 34, 45, 56, 67, 78, 89, 101, 112, 119],
          sopChecklist: SOP_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {}),
          signatureInspector: null,
          signatureWitness: null,
          notes: 'Suhu gudang normal (28°C), kelembaban relative 65%.',
          syncStatus: 'draft',
          samplingCode: 'BASN/URE/BATCHUREA44X/20260630',
          sampleBagCodes: Array.from({ length: 11 }).map((_, i) => `SEAL-URE-BATCHUREA44X-${(i + 1).toString().padStart(2, '0')}`),
          inspectorCertificateNo: 'PPC/BASN-2026/0481',
          inspectorCertificateName: 'Sertifikat_Kompetensi_PPC_Budi_Setiawan.pdf'
        }
      ];
      setSamples(demoSamples);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoSamples));
    }

    // Load last sync timestamp from storage
    const syncTime = localStorage.getItem('sni_fertilizer_last_sync');
    if (syncTime) {
      setLastSyncedTime(parseInt(syncTime));
    }
  }, []);

  // --- Auto-generate random indices for the initial default state ---
  useEffect(() => {
    if (randomIndices.length === 0 && totalBags > 0) {
      generateDefaultRandomIndices();
    }
  }, [totalBags, calculatedSampleSize]);

  const generateDefaultRandomIndices = () => {
    const indices: number[] = [];
    const size = Math.min(calculatedSampleSize, totalBags);
    while (indices.length < size) {
      const idx = Math.floor(Math.random() * totalBags) + 1;
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.sort((a, b) => a - b);
    setRandomIndices(indices);
  };

  // --- Apply custom calculations from SamplingCalculator ---
  const handleApplyCalculation = (total: number, size: number, indices: number[], methodId: string) => {
    setTotalBags(total);
    setCalculatedSampleSize(size);
    setRandomIndices(indices);
    setActiveTab('form');
    
    // Add custom feedback
    setFormFeedback({
      type: 'success',
      message: `Kalkulasi SNI berhasil diterapkan! Total lot: ${total} karung, jumlah sampel: ${size} karung.`
    });
    setTimeout(() => setFormFeedback(null), 4000);
  };

  // --- Handle Checklist Item Toggle ---
  const handleCheckItem = (id: string, checked: boolean) => {
    setSopChecklist((prev) => ({ ...prev, [id]: checked }));
  };

  // --- Browser GPS Geolocation API ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setFormFeedback({
        type: 'error',
        message: 'Layanan Tidak Didukung: Peramban Anda tidak mendukung layanan penentuan lokasi satelit (GPS).'
      });
      setTimeout(() => setFormFeedback(null), 5000);
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
        setFormFeedback({
          type: 'success',
          message: 'Sinkronisasi lokasi satelit (GPS) berhasil diterapkan!'
        });
        setTimeout(() => setFormFeedback(null), 3000);
      },
      (error) => {
        console.error(error);
        setGpsLoading(false);
        // Fallback or user warning
        setFormFeedback({
          type: 'error',
          message: 'Peringatan Geokod: Gagal mendeteksi koordinat GPS otomatis. Sistem menggunakan koordinat pabrik default (Palembang).'
        });
        setTimeout(() => setFormFeedback(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // --- Submit Draft to Database ---
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification Checks
    const totalSOPItems = SOP_ITEMS.length;
    const checkedCount = Object.values(sopChecklist).filter(Boolean).length;
    const missingSOP = checkedCount < totalSOPItems;

    if (missingSOP) {
      setFormFeedback({
        type: 'error',
        message: 'Gagal Menyimpan: Anda harus menyelesaikan seluruh daftar pemeriksaan SOP lapangan sebelum membuat Berita Acara resmi.'
      });
      return;
    }

    if (!signatureInspector) {
      setFormFeedback({
        type: 'error',
        message: 'Gagal Menyimpan: Diperlukan Tanda Tangan digital dari Petugas Pengambil Contoh (PPC).'
      });
      return;
    }

    if (!signatureWitness) {
      setFormFeedback({
        type: 'error',
        message: 'Gagal Menyimpan: Diperlukan Tanda Tangan digital dari Saksi Lapangan.'
      });
      return;
    }

    // Generate unique ID using Asia/Jakarta date
    const today = new Date();
    const yearStr = today.toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' });
    const monthStr = today.toLocaleDateString('id-ID', { month: '2-digit', timeZone: 'Asia/Jakarta' });
    const dayStr = today.toLocaleDateString('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' });
    const dateStr = `${yearStr}${monthStr}${dayStr}`;
    const randNum = Math.floor(100 + Math.random() * 900); // 3 digit code
    const sampleId = `SP-${dateStr}-${randNum}`;

    const activeCert = ppcCertificates.find(
      c => c.inspectorName.trim().toLowerCase() === inspectorName.trim().toLowerCase()
    );

    const newRecord: SampleRecord = {
      id: sampleId,
      date: today.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      timestamp: Date.now(),
      inspectorName,
      witnessName,
      locationName,
      latitude,
      longitude,
      fertilizerType,
      customFertilizerName: fertilizerType === 'Lainnya' ? customFertilizerName : undefined,
      batchNumber,
      totalBags,
      calculatedSampleSize,
      randomIndices,
      sopChecklist: { ...sopChecklist },
      signatureInspector,
      signatureWitness,
      notes,
      syncStatus: 'draft',
      samplingCode: generatedSamplingCode,
      sampleBagCodes: generatedBagCodes,
      inspectorCertificateNo: activeCert?.certificateNo,
      inspectorCertificateName: activeCert?.fileName
    };

    const updated = [newRecord, ...samples];
    setSamples(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Clear and Reset Form for next audit
    setBatchNumber(`BATCH-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}B`);
    setNotes('');
    // Keep signatures, inspector details for efficiency, but let user clear them manually if needed
    setSopChecklist({});
    
    // Regenerate random indexes for next
    generateDefaultRandomIndices();

    setFormFeedback({
      type: 'success',
      message: `Berita Acara ${sampleId} berhasil direkam ke penyimpanan lokal! Data siap disinkronkan ke pusat.`
    });

    // Auto view the newly created BA
    setSelectedSampleForBA(newRecord);

    setTimeout(() => setFormFeedback(null), 5000);
  };

  // --- Delete Sample from storage ---
  const handleDeleteSample = (id: string) => {
    setSampleToDeleteId(id);
  };

  const executeDeleteSample = (id: string) => {
    const updated = samples.filter(s => s.id !== id);
    setSamples(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSampleToDeleteId(null);
    setFormFeedback({
      type: 'success',
      message: `Data rekaman sampling dengan ID ${id} berhasil dihapus dari sistem.`
    });
    setTimeout(() => setFormFeedback(null), 3000);
  };

  // --- Save Edited Sample (Admin Only) ---
  const handleSaveEditSample = (updatedSample: SampleRecord) => {
    const updated = samples.map(s => s.id === updatedSample.id ? updatedSample : s);
    setSamples(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setEditingSample(null);
    setFormFeedback({
      type: 'success',
      message: `Berita Acara ${updatedSample.id} berhasil diperbarui oleh Administrator!`
    });
    setTimeout(() => setFormFeedback(null), 4000);
  };

  // --- Toggle Simulated Cloud Sync ---
  const handleSyncData = async () => {
    // Only updates 'draft' to 'synced'
    const updated = samples.map((sample) => {
      if (sample.syncStatus === 'draft') {
        return {
          ...sample,
          syncStatus: 'synced' as const,
          syncTime: Date.now()
        };
      }
      return sample;
    });

    setSamples(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    const now = Date.now();
    setLastSyncedTime(now);
    localStorage.setItem('sni_fertilizer_last_sync', now.toString());
  };

  // Calculate generic dashboard statistics
  const pendingSyncCount = samples.filter((s) => s.syncStatus === 'draft').length;
  const uniqueLocations = Array.from(new Set(samples.map((s) => s.locationName))).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col" id="app-root">
      {/* 1. Global Navigation Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white shadow-md sticky top-0 z-40 no-print" id="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand/Logo Area */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-xs">
              <Sprout className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Standard SNI
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">v2.1</span>
              </div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none mt-0.5">
           Dashboard PPC
              </h1>
            </div>
          </div>

          {/* Subtitle / Status tags */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 px-3.5 py-1.5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-200">
                Tanggal: <strong className="font-semibold text-white">{liveDate}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 px-3.5 py-1.5 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-200">
                Waktu Lapangan: <strong className="font-semibold text-white">{liveTime}</strong>
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {isOnline ? 'Sinyal Aktif' : 'Modus Gudang (Offline)'}
            </div>
          </div>

        </div>
      </header>

      {/* 2. Dashboard Statistics Row */}
      <section className="bg-emerald-950/20 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-5 no-print" id="stats-dashboard">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Total Sampel</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                {samples.length} <span className="text-xs font-normal text-slate-400">biji</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Selesai Sync</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                {samples.filter(s => s.syncStatus === 'synced').length} <span className="text-xs font-normal text-slate-400">dokumen</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Draft Lokal</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                {pendingSyncCount} <span className="text-xs font-normal text-slate-400">belum kirim</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">Lokasi Gudang</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                {uniqueLocations} <span className="text-xs font-normal text-slate-400">gudang</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Main Workspace Layout */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6 no-print" id="main-workspace">
        
        {/* Form Feedback Banner */}
        {formFeedback && (
          <div className={`p-4 rounded-2xl flex gap-3 text-sm animate-fade-in ${
            formFeedback.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <AlertCircle className={`h-5 w-5 ${formFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <span className="font-bold">{formFeedback.type === 'success' ? 'Sukses!' : 'Kesalahan Validasi:'}</span>
              <p className="mt-0.5">{formFeedback.message}</p>
            </div>
          </div>
        )}

        {/* Universal Navigation Menu */}
        <nav className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print" id="universal-navigation">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Semua Alat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Formulir BA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Kalkulator SNI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sop')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'sop'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Daftar SOP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <Archive className="h-4 w-4" />
              <span>Arsip Sampel</span>
              {pendingSyncCount > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
              id="tab-ppc-profile"
            >
              <Users className="h-4 w-4" />
              <span>Profil PPC</span>
            </button>

            {(!isProduction || isAdminUnlocked) && (
              <button
                type="button"
                onClick={() => {
                  if (isAdminUnlocked) {
                    setActiveTab('admin');
                  } else {
                    setShowPasscodeDialog(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                } ${!isAdminUnlocked ? 'border border-dashed border-slate-200' : ''}`}
                id="tab-admin"
              >
                <Shield className="h-4 w-4" />
                <span>Panel Admin {!isAdminUnlocked && '🔒'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Navigasi:</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {activeTab === 'all' && 'Ikhtisar Semua Alat'}
              {activeTab === 'form' && 'Formulir Berita Acara'}
              {activeTab === 'calculator' && 'Kalkulator Sampling'}
              {activeTab === 'sop' && 'Daftar Periksa Lapangan'}
              {activeTab === 'history' && 'Inventaris & QR Sampel'}
              {activeTab === 'profile' && 'Profil Kompetensi & Dokumen PPC'}
              {activeTab === 'admin' && 'Administrasi Kompetensi PPC'}
            </span>
          </div>
        </nav>

        {/* Responsive Two-Column Workstation */}
        <div className={activeTab === 'all' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'flex flex-col gap-6'}>
          
          {/* Column Left - Inspector Form */}
          <section className={`
            ${activeTab === 'all' ? 'lg:col-span-7 flex flex-col gap-5' : ''}
            ${activeTab === 'form' ? 'max-w-4xl mx-auto w-full flex flex-col gap-5' : 'hidden'}
          `}>
            
            {/* Form Wrapper */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5" id="primary-form-container">
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base sm:text-lg">Form Berita Acara Lapangan</h3>
                    <p className="text-xs text-slate-400">Isi lengkap keterangan fisik sampel & tanda tangan digital</p>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm">
                  DRAFT BARU
                </div>
              </div>

              <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
                
                {/* 1. Petugas & Saksi Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="h-3 w-3 text-emerald-500" /> Nama Petugas PPC (Anda)
                    </label>
                    <input
                      type="text"
                      required
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      placeholder="Nama & gelar petugas"
                      id="form-inspector"
                    />
                    {(() => {
                      const activeCert = ppcCertificates.find(
                        c => c.inspectorName.trim().toLowerCase() === inspectorName.trim().toLowerCase()
                      );
                      return activeCert ? (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100" id="live-cert-status-valid">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Sertifikat PPC Terverifikasi: <strong>{activeCert.certificateNo}</strong> ({activeCert.fileName})</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100" id="live-cert-status-invalid">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>Sertifikat belum diunggah di Panel Admin.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAdminUnlocked) {
                                setActiveTab('admin');
                              } else {
                                setShowPasscodeDialog(true);
                              }
                            }}
                            className="text-[9px] text-amber-800 underline font-extrabold hover:text-amber-950 ml-1 cursor-pointer"
                          >
                            Unggah PDF
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-500" /> Nama Saksi Lapangan
                    </label>
                    <input
                      type="text"
                      required
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      placeholder="Nama saksi gudang/produsen"
                      id="form-witness"
                    />
                  </div>
                </div>

                {/* 2. Lokasi & GPS Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-500" /> Lokasi Gudang / Gudang Pabrik
                    </label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      placeholder="Detail nama gudang atau produsen"
                      id="form-location"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      Koordinat GPS Satelit
                    </label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gpsLoading}
                      className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 disabled:bg-slate-100 text-emerald-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-100 cursor-pointer"
                      id="btn-get-gps"
                    >
                      <Compass className={`h-4 w-4 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                      {gpsLoading ? 'Mencari...' : 'Dapatkan GPS'}
                    </button>
                  </div>
                </div>

                {/* Display current coordinates */}
                {latitude && longitude && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    <span>
                      Verifikasi Satelit: <strong>Lat {latitude.toFixed(6)}, Lng {longitude.toFixed(6)}</strong>
                    </span>
                    <span className="text-emerald-600 font-sans font-bold flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3" /> Akurat 3m
                    </span>
                  </div>
                )}

                {/* 3. Spesifikasi Pupuk Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Jenis Pupuk Komersial
                    </label>
                    <select
                      value={fertilizerType}
                      onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                      id="form-fertilizer-type"
                    >
                      <option value="Urea">Urea (Subdisi/Nonsubsidi)</option>
                      <option value="NPK">NPK Phonska / Pelangi</option>
                      <option value="SP-36">SP-36 (Super Fosfat)</option>
                      <option value="ZA">ZA (Amonium Sulfat)</option>
                      <option value="Phonska">Phonska Khusus</option>
                      <option value="Organik">Organik Petroganik</option>
                      <option value="KCI">KCl Kalium Klorida</option>
                      <option value="Lainnya">Lainnya (Tulis Manual)</option>
                    </select>
                  </div>

                  <div>
                    {fertilizerType === 'Lainnya' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Tulis Nama Pupuk Khusus
                        </label>
                        <input
                          type="text"
                          required
                          value={customFertilizerName}
                          onChange={(e) => setCustomFertilizerName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                          placeholder="Merek/Spesifikasi pupuk"
                          id="form-custom-fertilizer"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nomor Batch / Lot Produksi
                        </label>
                        <input
                          type="text"
                          required
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                          placeholder="Contoh: BATCH-202606A"
                          id="form-batch-number"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Lot Details Visual Panel (populated by calculator apply) */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-500" /> Data Perhitungan Sampling SNI
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium italic">
                      Terhubung dengan Kalkulator
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Ukuran Lot</span>
                      <strong className="text-sm sm:text-base text-slate-700 font-sans">{totalBags} Karung</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Batas Sampel (SNI)</span>
                      <strong className="text-sm sm:text-base text-emerald-600 font-sans">{calculatedSampleSize} Karung</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Acakan Berhasil</span>
                      <strong className="text-sm sm:text-base text-slate-700 font-sans">{randomIndices.length > 0 ? 'YA' : 'KOSONG'}</strong>
                    </div>
                  </div>

                  {randomIndices.length > 0 && (
                    <div className="text-[10px] text-slate-500">
                      <span className="font-semibold block text-slate-600 mb-1">Karung Yang Wajib Diambil Lapangan:</span>
                      <div className="flex flex-wrap gap-1">
                        {randomIndices.slice(0, 15).map(idx => (
                          <span key={idx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100/50 font-bold">
                            #{idx}
                          </span>
                        ))}
                        {randomIndices.length > 15 && (
                          <span className="text-slate-400 font-semibold px-1 py-0.5">
                            + {randomIndices.length - 15} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Automated Sampling Code & Security Seal Section */}
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/80 flex flex-col gap-4" id="automated-sampling-code-widget">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Kode Sampling & Segel Pengaman Otomatis
                      </h4>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto">
                      <Sparkles className="h-3 w-3" /> Terkomputerisasi SNI
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem mendeteksi jenis pupuk, nomor batch, dan jumlah sampel secara real-time untuk menghasilkan format kode sampling terstandardisasi dan nomor seri segel unik.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Format Pola Kode
                      </label>
                      <select
                        value={samplingCodePattern}
                        onChange={(e) => setSamplingCodePattern(e.target.value as 'standard' | 'sni' | 'custom')}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        id="form-sampling-pattern"
                      >
                        <option value="standard">Standard BASN (Modern)</option>
                        <option value="sni">Standard SNI-19-0428</option>
                        <option value="custom">Kustom Teks Manual</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      {samplingCodePattern === 'custom' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Masukkan Kode Kustom Anda
                          </label>
                          <input
                            type="text"
                            value={customSamplingCode}
                            onChange={(e) => setCustomSamplingCode(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none"
                            placeholder="SMP/URE-CUSTOM-99"
                            id="form-custom-sampling-code"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Kode Sampling Utama Terbuat
                          </label>
                          <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-black text-emerald-800 select-all shadow-3xs">
                            <span className="break-all">{generatedSamplingCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedSamplingCode);
                                setCopiedState(true);
                                setTimeout(() => setCopiedState(false), 2000);
                              }}
                              className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                              title="Salin Kode"
                              id="btn-copy-main-code"
                            >
                              {copiedState ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Segel List Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <QrCode className="h-3 w-3 text-emerald-600" />
                        Daftar Segel Pengaman ({generatedBagCodes.length} Karung Sampel)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedBagCodes.join('\n'));
                          alert('Semua nomor segel pengaman telah disalin ke clipboard!');
                        }}
                        className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        id="btn-copy-all-seals"
                      >
                        <Copy className="h-3 w-3" /> Salin Semua Segel
                      </button>
                    </div>

                    <div className="max-h-24 overflow-y-auto border border-slate-100 bg-slate-50 rounded-lg p-2.5 flex flex-wrap gap-1.5 scrollbar-thin">
                      {generatedBagCodes.map((seal, idx) => (
                        <div key={idx} className="bg-white border border-slate-200/60 px-2 py-1 rounded-md text-[9px] font-mono font-bold text-slate-700 flex items-center gap-1 shadow-3xs hover:border-emerald-300 transition-all">
                          <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs scale-90">
                            #{randomIndices[idx] || idx + 1}
                          </span>
                          <span className="text-slate-500 select-all">{seal}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1.5 italic">
                      *Label kode segel pengaman di atas terhubung langsung dengan indeks karung teracak dan akan dilampirkan otomatis pada Berita Acara (BA) untuk verifikasi laboratorium.
                    </p>
                  </div>
                </div>

                {/* 5. Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Catatan Kondisi Khusus Fisik Lapangan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                    placeholder="Contoh: Suhu gudang rata-rata 27 derajat celsius. Karung tersusun rapi di atas palet kayu setebal 15cm."
                    id="form-notes"
                  />
                </div>

                {/* 6. Signature Pads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <SignaturePad
                    label="Tanda Tangan Petugas PPC Utama (BASN)"
                    placeholderName={inspectorName}
                    savedDataUrl={signatureInspector}
                    onSave={setSignatureInspector}
                  />
                  <SignaturePad
                    label="Tanda Tangan Saksi Gudang (Staff QA)"
                    placeholderName={witnessName}
                    savedDataUrl={signatureWitness}
                    onSave={setSignatureWitness}
                  />
                </div>

                {/* 7. Action Button */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                    id="btn-submit-form"
                  >
                    <Plus className="h-5 w-5" />
                    Selesaikan & Rekam Berita Acara (BA)
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    *Tindakan ini akan mengarsip Berita Acara secara digital di penyimpanan perangkat lokal lapangan.
                  </p>
                </div>

              </form>

            </div>

          </section>

          {/* Column Right - Interactive Sidebars */}
          <section className={`
            ${activeTab === 'all' ? 'lg:col-span-5 flex flex-col gap-5' : ''}
            ${(activeTab === 'calculator' || activeTab === 'sop') ? 'max-w-4xl mx-auto w-full flex flex-col gap-5' : 'hidden'}
          `}>
            
            {/* Sampling Calculator Widget */}
            <div className={activeTab === 'all' || activeTab === 'calculator' ? 'block' : 'hidden'}>
              <SamplingCalculator
                onApplyCalculation={handleApplyCalculation}
                initialTotalBags={totalBags}
              />
            </div>

            {/* Offline Sync Status Panel */}
            <div className={`no-print ${activeTab === 'all' ? 'block' : 'hidden'}`}>
              <CloudSyncStatus
                isOnline={isOnline}
                toggleOnline={() => setIsOnline(!isOnline)}
                pendingSyncCount={pendingSyncCount}
                onSyncNow={handleSyncData}
                lastSyncedTime={lastSyncedTime}
              />
            </div>

            {/* Step-by-Step SOP Guidelines */}
            <div className={activeTab === 'all' || activeTab === 'sop' ? 'block' : 'hidden'}>
              <SOPGuidelines
                checkedItems={sopChecklist}
                onChangeItem={handleCheckItem}
              />
            </div>

          </section>

        </div>

        {/* 4. Full-Width Bottom Section: Inventory Tracker */}
        <section className={`mt-2 ${activeTab === 'all' || activeTab === 'history' ? 'block' : 'hidden'}`} id="bottom-tracking-section">
          {activeTab === 'history' && (
            <div className="mb-4 max-w-4xl mx-auto w-full no-print">
              <CloudSyncStatus
                isOnline={isOnline}
                toggleOnline={() => setIsOnline(!isOnline)}
                pendingSyncCount={pendingSyncCount}
                onSyncNow={handleSyncData}
                lastSyncedTime={lastSyncedTime}
              />
            </div>
          )}
          <div className={activeTab === 'history' ? 'max-w-6xl mx-auto w-full' : ''}>
            <SampleList
              samples={samples}
              onViewSample={setSelectedSampleForBA}
              onDeleteSample={handleDeleteSample}
              isAdminUnlocked={isAdminUnlocked}
              onEditSample={setEditingSample}
              onUpdateLabStatus={(id, status) => {
                // Simulating changing state locally too for higher fidelity!
                const updated = samples.map(s => {
                  if (s.id === id) {
                    return { ...s, notes: `${s.notes} [Lab Status: ${status}]` };
                  }
                  return s;
                });
                setSamples(updated);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
              }}
            />
          </div>
        </section>

        {/* PPC Profile Directory View */}
        {activeTab === 'profile' && (
          <section className="max-w-6xl mx-auto w-full flex flex-col gap-6 mt-2" id="ppc-profile-section">
            <PPCProfileTab
              certificates={ppcCertificates}
              onUpdateCertificates={(updated) => {
                setPpcCertificates(updated);
                // Also update local storage just in case (the effect handles this, but it's good practice)
                localStorage.setItem('sni_ppc_certificates', JSON.stringify(updated));
              }}
              isAdminUnlocked={isAdminUnlocked}
            />
          </section>
        )}

        {/* Admin Dashboard view */}
        {activeTab === 'admin' && (
          <section className="max-w-5xl mx-auto w-full flex flex-col gap-6 mt-2" id="admin-panel-section">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg sm:text-xl">Panel Kontrol Administrasi PPC</h3>
                    <p className="text-xs text-slate-500">Legalitas & Manajemen Sertifikat Kompetensi Petugas Pengambil Contoh (PPC)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">
                    Status: <span className="text-emerald-600 font-bold">Admin Terverifikasi</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsAdminUnlocked(false);
                      setActiveTab('all');
                      setFormFeedback({ type: 'success', message: 'Anda telah keluar dari Portal Admin.' });
                      setTimeout(() => setFormFeedback(null), 3000);
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-all cursor-pointer"
                  >
                    Logout Admin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column - Register/Upload Certificate */}
                <div className="md:col-span-6 flex flex-col gap-4">
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <User className="h-4 w-4 text-amber-500" /> Registrasi Sertifikat PPC Baru
                  </h4>
                                 <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const inspector = (form.elements.namedItem('admin-inspector-name') as HTMLInputElement).value;
                      const certNo = (form.elements.namedItem('admin-cert-no') as HTMLInputElement).value;
                      const fileInput = form.elements.namedItem('admin-pdf-file') as HTMLInputElement;
                      const file = fileInput.files?.[0];
                      const today = new Date();

                      if (!file) {
                        setFormFeedback({
                          type: 'error',
                          message: 'Berkas Kosong: Silakan pilih berkas PDF Sertifikat terlebih dahulu sebelum mendaftar.'
                        });
                        setTimeout(() => setFormFeedback(null), 5000);
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = () => {
                        const newCert: PPCCertificate = {
                          inspectorName: inspector,
                          certificateNo: certNo,
                          fileName: file.name,
                          fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                          uploadedAt: Date.now(),
                          verified: true,
                          fileData: reader.result as string
                        };
                        
                        // Check if already exists for this name
                        const filtered = ppcCertificates.filter(c => c.inspectorName.trim().toLowerCase() !== inspector.trim().toLowerCase());
                        setPpcCertificates([newCert, ...filtered]);
                        form.reset();
                        setFormFeedback({ type: 'success', message: `Berhasil mengunggah & mendaftarkan sertifikat kompetensi untuk ${inspector}.` });
                        setTimeout(() => setFormFeedback(null), 4000);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col gap-3.5"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nama Lengkap Petugas Lapangan (PPC)
                      </label>
                      <input
                        type="text"
                        name="admin-inspector-name"
                        required
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        placeholder="Contoh: Budi Setiawan, S.T."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nomor Lisensi / Registrasi Kompetensi
                      </label>
                      <input
                        type="text"
                        name="admin-cert-no"
                        required
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        placeholder="Contoh: PPC/BASN-2026/0481"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Unggah Sertifikat Kompetensi (PDF)</span>
                        <span className="text-[9px] text-amber-700 lowercase font-bold">Wajib format .pdf</span>
                      </label>
                      
                      {/* PDF File Uploader Zone */}
                      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white hover:border-amber-400 transition-all p-5 text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="file"
                          name="admin-pdf-file"
                          accept=".pdf"
                          required
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type !== 'application/pdf') {
                              setFormFeedback({
                                type: 'error',
                                message: 'Format Salah: Hanya diperbolehkan berkas berformat dokumen resmi PDF (.pdf).'
                              });
                              setTimeout(() => setFormFeedback(null), 5000);
                              e.target.value = '';
                            }
                          }}
                        />
                        <FileText className="h-8 w-8 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">Pilih berkas PDF atau seret ke sini</span>
                        <span className="text-[10px] text-slate-400">Ukuran maks: 10MB</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-700"
                    >
                      <Plus className="h-4 w-4" />
                      Daftarkan & Legalkan Petugas PPC
                    </button>
                  </form>
                </div>

                {/* Right Column - Registered PPC List */}
                <div className="md:col-span-6 flex flex-col gap-4">
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4 text-amber-500" /> Berkas Kompetensi PPC Terdaftar
                  </h4>

                  <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {ppcCertificates.map((cert, index) => (
                      <div 
                        key={index}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-3xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{cert.inspectorName}</h5>
                              <span className="font-mono text-[10px] text-slate-500 block">No. Lisensi: {cert.certificateNo}</span>
                            </div>
                          </div>
                          
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                            LEGAL VALID
                          </span>
                        </div>

                        <div className="border-t border-slate-200/80 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={cert.fileName}>
                            <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{cert.fileName}</span>
                            <span className="text-[9px] text-slate-400">({cert.fileSize})</span>
                          </span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cert.fileData && (
                              <a
                                href={cert.fileData}
                                download={cert.fileName}
                                className="text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition-all text-[10px]"
                                title="Unduh Berkas PDF Sertifikat"
                              >
                                Unduh PDF
                              </a>
                            )}
                            <button
                              onClick={() => setCertToDeleteIndex(index)}
                              className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-100 transition-all text-[10px] cursor-pointer"
                              title="Hapus"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {ppcCertificates.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold">Belum ada sertifikat kompetensi PPC yang didaftarkan.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Gunakan formulir di sebelah kiri untuk mengunggah sertifikat PDF.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* 5. Document Modal / Paper PDF Previewer (Pop-up Overlay) */}
      {selectedSampleForBA && (
        <BeritaAcaraModal
          sample={selectedSampleForBA}
          onClose={() => setSelectedSampleForBA(null)}
        />
      )}

      {/* Admin Edit Document Modal */}
      {editingSample && (
        <EditSampleModal
          sample={editingSample}
          onClose={() => setEditingSample(null)}
          onSave={handleSaveEditSample}
        />
      )}

      {/* 6. Admin Passcode Verification Dialog */}
      {showPasscodeDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="passcode-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 relative">
            <button
              onClick={() => {
                setShowPasscodeDialog(false);
                setPasscodeInput('');
                setPasscodeError('');
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center flex flex-col items-center gap-1.5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100 mb-2">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Portal Verifikasi Admin</h3>
              <p className="text-xs text-slate-400">Masukkan kode akses administratif untuk membuka Panel Kompetensi PPC</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passcodeInput === 'admin123') {
                  setIsAdminUnlocked(true);
                  setShowPasscodeDialog(false);
                  setPasscodeInput('');
                  setPasscodeError('');
                  setActiveTab('admin');
                  setFormFeedback({ type: 'success', message: 'Verifikasi Admin Berhasil! Selamat datang di Panel Kontrol.' });
                  setTimeout(() => setFormFeedback(null), 3000);
                } else {
                  setPasscodeError('Kode akses salah. Harap masukkan kode admin yang valid.');
                }
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full text-center tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                  autoFocus
                  required
                />
                {passcodeError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1.5 text-center">{passcodeError}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/50 text-center text-[10px] text-slate-500">
                Hubungi administrator pusat untuk mendapatkan lisensi akses, atau gunakan kode default <strong className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border">admin123</strong> untuk pengujian evaluasi.
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4 text-emerald-400" />
                Verifikasi Akses
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Certificate Deletion Modal (Admin Panel) */}
      {certToDeleteIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-50 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Hapus Sertifikat PPC</h3>
                <p className="text-xs text-slate-400 font-bold">Konfirmasi Penghapusan Permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus sertifikat kompetensi untuk <strong className="text-slate-800 font-extrabold">{ppcCertificates[certToDeleteIndex]?.inspectorName}</strong>?<br />
              Data sertifikat nomor <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[11px] font-bold text-slate-700">{ppcCertificates[certToDeleteIndex]?.certificateNo}</span> akan dihapus dari sistem secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setCertToDeleteIndex(null)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetName = ppcCertificates[certToDeleteIndex]?.inspectorName;
                  const filtered = ppcCertificates.filter((_, i) => i !== certToDeleteIndex);
                  setPpcCertificates(filtered);
                  setCertToDeleteIndex(null);
                  setFormFeedback({ type: 'success', message: `Sertifikat kompetensi untuk ${targetName} berhasil dihapus.` });
                  setTimeout(() => setFormFeedback(null), 3000);
                }}
                className="w-2/3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-rose-700 flex items-center justify-center gap-1"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Sample Record Deletion Modal */}
      {sampleToDeleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-50 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Hapus Rekaman Sampling</h3>
                <p className="text-xs text-slate-400 font-bold">Tindakan Tidak Dapat Dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data sampel dengan ID <strong className="text-slate-800 font-mono font-bold">{sampleToDeleteId}</strong>?<br />
              Seluruh riwayat, koordinat GPS, segel pengaman, beserta dokumen Berita Acara yang berkaitan akan terhapus secara permanen dari penyimpanan perangkat Anda.
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setSampleToDeleteId(null)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sampleToDeleteId) {
                    executeDeleteSample(sampleToDeleteId);
                  }
                }}
                className="w-2/3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-rose-700 flex items-center justify-center gap-1"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Legal Footer Disclaimer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 mt-12 border-t border-slate-800 no-print" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-slate-200 font-sans">Sampling Pupuk SNI Digital Portal</span>
            
            {/* Subtle portal admin trigger lock */}
            <button
              onClick={() => setShowPasscodeDialog(true)}
              className="ml-2 p-1 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-slate-400 transition-all cursor-pointer"
              title="Akses Portal Administrasi PPC"
              id="footer-admin-trigger"
            >
              <Shield className="h-3 w-3" />
            </button>
          </div>
          <p className="text-center sm:text-right text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center gap-2 font-sans">
            <span>Sistem Elektronik Pengawasan Pupuk Terpadu Nasional. Membantu menjaga mutu pupuk sesuai SNI 19-0428-1998.</span>
            {isAdminUnlocked && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30 font-sans">
                Mode Admin Aktif
              </span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
