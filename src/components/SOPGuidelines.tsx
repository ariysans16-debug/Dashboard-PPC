import React from 'react';
import { SOPChecklistItem } from '../types';
import { CheckSquare, Square, Info, Shield, ClipboardCheck } from 'lucide-react';

export const SOP_ITEMS: SOPChecklistItem[] = [
  {
    id: 'prep_1',
    category: 'persiapan',
    task: 'Gunakan Alat Pelindung Diri (APD) Lengkap',
    description: 'Masker debu (khususnya untuk pupuk berdebu tinggi seperti SP-36/ZA), sarung tangan karet steril, kacamata pelindung, dan sepatu keselamatan.',
    required: true
  },
  {
    id: 'prep_2',
    category: 'persiapan',
    task: 'Sterilisasi & Kalibrasi Alat Pengambil Contoh (APC)',
    description: 'Pastikan tombak pengambil sampel (spear probe) bersih, bebas karat, kering, dan disemprot alkohol 70% atau diusap hingga steril.',
    required: true
  },
  {
    id: 'prep_3',
    category: 'persiapan',
    task: 'Siapkan Kantong Sampel & Segel Keamanan',
    description: 'Siapkan minimal 3 pasang kantong plastik PE tebal kedap udara, label tahan air, spidol permanen, dan security seal berkode seri unik.',
    required: true
  },
  {
    id: 'lot_1',
    category: 'pengambilan',
    task: 'Pemeriksaan Visual Keutuhan Kemasan Lot',
    description: 'Verifikasi tumpukan pupuk kering, tidak sobek, tidak terkena air hujan, dan tidak terkontaminasi bahan asing lainnya di gudang.',
    required: true
  },
  {
    id: 'lot_2',
    category: 'pengambilan',
    task: 'Lakukan Geo-Tagging & Sinkronisasi Lokasi GPS',
    description: 'Verifikasi koordinat lintang dan bujur di aplikasi untuk membuktikan bahwa proses pengambilan contoh dilakukan di lokasi yang sah.',
    required: true
  },
  {
    id: 'samp_1',
    category: 'pengambilan',
    task: 'Teknik Penusukan Diagonal (Metode Tombak)',
    description: 'Tusuk karung yang terpilih secara acak dengan probe mengarah diagonal dari atas ke bawah (kemiringan sekitar 45 derajat) dengan rongga menghadap ke bawah, lalu putar 180 derajat untuk mengambil sampel secara merata di semua kedalaman.',
    required: true
  },
  {
    id: 'samp_2',
    category: 'pengambilan',
    task: 'Pengumpulan Contoh Primer (Campuran)',
    description: 'Satukan semua porsi kecil sampel dari setiap karung terpilih ke dalam satu wadah pencampur plastik besar yang bersih dan kering.',
    required: true
  },
  {
    id: 'quart_1',
    category: 'quartering',
    task: 'Metode Quartering (Pembagian Perempat)',
    description: 'Aduk sampel primer secara homogen, ratakan berbentuk lingkaran, bagi menjadi 4 kuadran silang. Buang 2 kuadran yang berseberangan, satukan kembali sisanya. Ulangi proses ini hingga volume berkurang menjadi ± 1.5 - 2 kg.',
    required: true
  },
  {
    id: 'quart_2',
    category: 'quartering',
    task: 'Pembagian Menjadi 3 Porsi Sampel Akhir',
    description: 'Bagi contoh yang telah diperkecil menjadi 3 kantong steril sama banyak: (1) Sampel Laboratorium untuk diuji, (2) Sampel Produsen/Arsip pemilik, (3) Sampel Pengawas/Sengketa.',
    required: true
  },
  {
    id: 'seal_1',
    category: 'kemasan',
    task: 'Double-Sealing & Security Tagging',
    description: 'Segel kantong plastik dengan mesin sealer atau ikat rapat, masukkan ke plastik sekunder, kencangkan menggunakan zip-tie berpengunci khusus (Security Seal) ber-nomor seri.',
    required: true
  },
  {
    id: 'seal_2',
    category: 'kemasan',
    task: 'Pemasangan QR-Code Pelacakan Sampel',
    description: 'Tempelkan label QR-code/barcode hasil cetakan aplikasi pada kemasan primer agar terhubung secara real-time ke sistem inventaris lab.',
    required: true
  }
];

interface SOPGuidelinesProps {
  checkedItems: Record<string, boolean>;
  onChangeItem: (id: string, checked: boolean) => void;
}

export default function SOPGuidelines({ checkedItems, onChangeItem }: SOPGuidelinesProps) {
  const totalItems = SOP_ITEMS.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const categories = [
    { id: 'persiapan', name: '1. Persiapan Alat & APD', color: 'border-blue-500 text-blue-700 bg-blue-50' },
    { id: 'pengambilan', name: '2. Verifikasi Gudang & Pengambilan', color: 'border-amber-500 text-amber-700 bg-amber-50' },
    { id: 'quartering', name: '3. Homogenisasi & Quartering', color: 'border-indigo-500 text-indigo-700 bg-indigo-50' },
    { id: 'kemasan', name: '4. Pengemasan & Pelabelan QR', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5" id="sop-checklist">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Daftar Periksa SOP (SNI)</h3>
            <p className="text-xs text-slate-500">Langkah wajib petugas untuk menjamin keabsahan sampel hukum</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500">Kepatuhan SOP</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-sm font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {progressPercent}%
            </span>
            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Warning */}
      {progressPercent < 100 && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 flex gap-2.5 text-xs text-amber-800">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Perhatian Audit:</span> Untuk mencetak Berita Acara resmi, seluruh poin pemeriksaan SOP wajib dilakukan dan ditandai oleh petugas lapangan.
          </div>
        </div>
      )}

      {/* Checklist Sections */}
      <div className="flex flex-col gap-6">
        {categories.map((cat) => {
          const itemsInCat = SOP_ITEMS.filter(item => item.category === cat.id);
          const checkedInCat = itemsInCat.filter(item => checkedItems[item.id]).length;
          const isCatDone = checkedInCat === itemsInCat.length;

          return (
            <div key={cat.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isCatDone 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  {checkedInCat}/{itemsInCat.length} Selesai
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {itemsInCat.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => onChangeItem(item.id, !isChecked)}
                      className={`flex gap-3.5 p-3.5 border rounded-xl cursor-pointer select-none transition-all duration-200 ${
                        isChecked
                          ? 'bg-emerald-50/30 border-emerald-200/60 shadow-2xs'
                          : 'bg-white hover:bg-slate-50/60 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        className="shrink-0 mt-0.5 text-emerald-600 focus:outline-none transition-all"
                        aria-label="Toggle task"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 fill-emerald-100" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-semibold transition-colors ${
                          isChecked ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'
                        }`}>
                          {item.task}
                          {item.required && (
                            <span className="text-red-500 text-xs ml-1 font-bold" title="Wajib">*</span>
                          )}
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[10px] text-slate-400 flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span>Kepatuhan terhadap SOP menjamin sampel lolos sensor dan diakui secara hukum jika terjadi sengketa komparasi lab.</span>
      </div>
    </div>
  );
}
