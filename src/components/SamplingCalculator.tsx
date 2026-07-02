import React, { useState, useEffect } from 'react';
import { FertilizerType, SamplingMethod } from '../types';
import { Calculator, HelpCircle, RefreshCw, LayoutGrid, CheckCircle } from 'lucide-react';

// Standard SNI rules and formulas
export const SAMPLING_METHODS: SamplingMethod[] = [
  {
    id: 'sni_packaged',
    name: 'SNI 19-0428-1998 (Produk Dikemas)',
    description: 'Petunjuk Pengambilan Contoh Padatan untuk barang dalam kemasan (karung). Jumlah contoh dihitung bertahap berdasarkan total lot.',
    formulaLabel: 'N ≤ 10: Semua; 11-100: 10 karung; >100: √N (dibulatkan ke atas)',
    calculate: (total: number) => {
      if (total <= 0) return 0;
      if (total <= 10) return total;
      if (total <= 100) return 10;
      return Math.ceil(Math.sqrt(total));
    }
  },
  {
    id: 'sqrt_n_plus_one',
    name: 'Formula SNI √N + 1',
    description: 'Formula konservatif umum yang sering digunakan untuk menjamin representativitas lebih tinggi pada lot sedang.',
    formulaLabel: '√N + 1 (dibulatkan ke atas)',
    calculate: (total: number) => {
      if (total <= 0) return 0;
      return Math.ceil(Math.sqrt(total) + 1);
    }
  },
  {
    id: 'ten_percent',
    name: 'Metode Proporsional (10%)',
    description: 'Pengambilan sampel sebanyak 10% dari total populasi. Cocok untuk lot kecil atau pengujian internal cepat.',
    formulaLabel: '10% dari Total (Min. 1, Maks. 50)',
    calculate: (total: number) => {
      if (total <= 0) return 0;
      const calc = Math.round(total * 0.1);
      return Math.min(Math.max(calc, 1), 50);
    }
  }
];

interface SamplingCalculatorProps {
  onApplyCalculation?: (total: number, sampleSize: number, randomIndices: number[], methodId: string) => void;
  initialTotalBags?: number;
  initialMethodId?: string;
}

export default function SamplingCalculator({
  onApplyCalculation,
  initialTotalBags = 150,
  initialMethodId = 'sni_packaged'
}: SamplingCalculatorProps) {
  const [totalBags, setTotalBags] = useState<number>(initialTotalBags);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(initialMethodId);
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const currentMethod = SAMPLING_METHODS.find(m => m.id === selectedMethodId) || SAMPLING_METHODS[0];
  const sampleSize = currentMethod.calculate(totalBags);

  // Generate random indices to pick from
  const generateRandomIndices = () => {
    if (totalBags <= 0 || sampleSize <= 0) {
      setRandomIndices([]);
      return;
    }

    const indices: number[] = [];
    const actualSampleSize = Math.min(sampleSize, totalBags);
    
    // Simple random sampling without replacement
    while (indices.length < actualSampleSize) {
      const randIndex = Math.floor(Math.random() * totalBags) + 1; // 1-indexed for bags
      if (!indices.includes(randIndex)) {
        indices.push(randIndex);
      }
    }
    
    // Sort for readable list
    indices.sort((a, b) => a - b);
    setRandomIndices(indices);
  };

  // Regenerate indices when totalBags, method, or initialization changes
  useEffect(() => {
    generateRandomIndices();
  }, [totalBags, selectedMethodId]);

  const handleApply = () => {
    if (onApplyCalculation) {
      onApplyCalculation(totalBags, sampleSize, randomIndices, selectedMethodId);
    }
  };

  // Simulated warehouse pile visual grid (show up to 100 cells)
  const maxVisualBags = Math.min(totalBags, 120);
  const rows = Math.ceil(maxVisualBags / 12);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6" id="calc-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Kalkulator Sampling SNI</h3>
            <p className="text-xs text-slate-500">Hitung jumlah sampel representatif & tentukan nomor karung acak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Total Ukuran Lot (Jumlah Karung / N)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <input
                type="number"
                min="1"
                max="50000"
                value={totalBags || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTotalBags(isNaN(val) ? 0 : val);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium text-base transition-all"
                placeholder="Masukkan total karung pupuk"
                id="input-total-bags"
              />
              <span className="absolute right-4 top-3 text-slate-400 text-sm">Karung</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Rentang: 1 s/d 50.000 karung</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Acuan Metode Sampling
            </label>
            <div className="flex flex-col gap-2">
              {SAMPLING_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${
                    selectedMethodId === method.id
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="samplingMethod"
                        value={method.id}
                        checked={selectedMethodId === method.id}
                        onChange={() => setSelectedMethodId(method.id)}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-semibold text-sm">{method.name}</span>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {method.formulaLabel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 pl-6">
                    {method.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Perhitungan</span>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
                {showTooltip && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-lg z-20">
                    Berdasarkan SNI, ukuran sampel dihitung secara matematis untuk memastikan tingkat kepercayaan pengujian mencapai 95%.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-2xs mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Jumlah Contoh Pengambilan</span>
                <span className="text-3xl font-extrabold text-emerald-600 font-sans tracking-tight">
                  {sampleSize} <span className="text-sm font-medium text-slate-400">karung</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Intensitas Pengambilan</span>
                <span className="text-sm font-semibold text-slate-700">
                  {totalBags > 0 ? ((sampleSize / totalBags) * 100).toFixed(1) : 0}% <span className="text-xs font-normal text-slate-400">dari lot</span>
                </span>
              </div>
            </div>

            {sampleSize > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3 text-emerald-500" />
                    Target Karung Acak (Random Index):
                  </span>
                  <button
                    type="button"
                    onClick={generateRandomIndices}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium transition-all"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Kocok Acak
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-100">
                  {randomIndices.map((idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center justify-center bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100 shadow-2xs"
                    >
                      #{idx}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60">
            {onApplyCalculation ? (
              <button
                type="button"
                onClick={handleApply}
                disabled={totalBags <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                Terapkan pada Draft Berita Acara
              </button>
            ) : (
              <p className="text-xs text-slate-500 text-center italic">
                Formulasi otomatis menjamin kepatuhan terhadap standar audit SNI
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Visual representation */}
      {totalBags > 0 && (
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulasi Gudang & Susunan Karung</h4>
              <p className="text-[10px] text-slate-400">Menampilkan {maxVisualBags} dari {totalBags} karung. Karung berwarna hijau harus diambil sampelnya.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="h-2.5 w-2.5 rounded bg-white border border-slate-200 inline-block"></span>
                Tumpukan Lot
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block"></span>
                Sampel Terpilih
              </span>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-3 bg-white rounded-xl border border-slate-100/80 shadow-2xs max-h-48 overflow-y-auto">
            {Array.from({ length: maxVisualBags }).map((_, i) => {
              const bagNum = i + 1;
              const isSelected = randomIndices.includes(bagNum);
              return (
                <div
                  key={bagNum}
                  title={`Karung #${bagNum} ${isSelected ? '(AMBIL SAMPEL)' : ''}`}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-[9px] font-bold transition-all relative ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm animate-pulse-subtle scale-105 z-10'
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="opacity-70 text-[7px] leading-none">Bag</span>
                  <span className="leading-tight">{bagNum}</span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-white"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
