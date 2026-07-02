/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FertilizerType = 'Urea' | 'NPK' | 'SP-36' | 'ZA' | 'Phonska' | 'Organik' | 'KCI' | 'Lainnya';

export interface SamplingMethod {
  id: string;
  name: string;
  description: string;
  formulaLabel: string;
  calculate: (total: number) => number;
}

export interface SOPChecklistItem {
  id: string;
  category: 'persiapan' | 'pengambilan' | 'quartering' | 'kemasan';
  task: string;
  description: string;
  required: boolean;
}

export interface SampleRecord {
  id: string;
  date: string;
  timestamp: number;
  inspectorName: string;
  witnessName: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  fertilizerType: FertilizerType;
  customFertilizerName?: string;
  batchNumber: string;
  totalBags: number;
  calculatedSampleSize: number;
  randomIndices: number[];
  sopChecklist: Record<string, boolean>; // id of checklist item -> checked
  signatureInspector: string | null; // Base64 signature image
  signatureWitness: string | null; // Base64 signature image
  notes: string;
  syncStatus: 'draft' | 'synced';
  syncTime?: number;
  samplingCode?: string;       // Dynamic automated sampling code
  sampleBagCodes?: string[];    // Automated individual security seals for sampled bags
  inspectorCertificateNo?: string;  // Inspector competency certificate number
  inspectorCertificateName?: string; // Inspector uploaded certificate PDF file name
}

export interface PPCCertificate {
  inspectorName: string;
  certificateNo: string;
  fileName: string;
  fileSize: string;
  uploadedAt: number;
  verified: boolean;
  fileData?: string; // Optional base64 representation of PDF
  inspectorPhoto?: string; // Optional base64 representation of Photo
  inspectorTitle?: string; // e.g., "PPC Utama BASN" or "Pengawas Mutu Pupuk Ahli"
  inspectorEmail?: string;
  inspectorPhone?: string;
  inspectorAgency?: string;
}

