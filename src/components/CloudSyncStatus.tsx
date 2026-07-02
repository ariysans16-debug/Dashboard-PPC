import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, CheckCircle, Database, AlertCircle } from 'lucide-react';

interface CloudSyncStatusProps {
  isOnline: boolean;
  toggleOnline: () => void;
  pendingSyncCount: number;
  onSyncNow: () => Promise<void>;
  lastSyncedTime: number | null;
}

export default function CloudSyncStatus({
  isOnline,
  toggleOnline,
  pendingSyncCount,
  onSyncNow,
  lastSyncedTime
}: CloudSyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSync = async () => {
    if (!isOnline || pendingSyncCount === 0 || isSyncing) return;
    
    setIsSyncing(true);
    setSyncSuccess(false);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    try {
      await onSyncNow();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getFormattedTime = (timestamp: number) => {
    const timeStr = new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
    return `${timeStr} WIB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-4" id="sync-control-panel">
      {/* Network Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl transition-all ${
            isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isOnline ? <Wifi className="h-5 w-5 animate-pulse" /> : <WifiOff className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Modul Offline-First</h4>
            <p className="text-[11px] text-slate-500">
              Sinyal Gudang: {isOnline ? 'Aktif (Online)' : 'Terputus (Offline)'}
            </p>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <button
          onClick={toggleOnline}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={isOnline}
          id="network-toggle-switch"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isOnline ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Connection Info Box */}
      <div className={`rounded-xl p-3 border text-xs flex gap-2.5 ${
        isOnline 
          ? 'bg-slate-50 border-slate-100 text-slate-600' 
          : 'bg-amber-50/50 border-amber-200/50 text-amber-800'
      }`}>
        {isOnline ? (
          <Database className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          {isOnline ? (
            <span>
              Koneksi internet tersedia. Seluruh data pengambilan sampel yang diambil di lapangan siap disinkronkan ke <strong>Database Cloud Kantor Pusat QA</strong>.
            </span>
          ) : (
            <span>
              <strong>Mode Offline Aktif:</strong> Anda sedang berada di dalam gudang tanpa sinyal. Anda <strong>tetap bisa mengisi formulir dan membuat tanda tangan</strong>. Data disimpan aman di memori lokal HP (localStorage).
            </span>
          )}
        </div>
      </div>

      {/* Sync Status Info */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Pekerjaan Lapangan Tertunda:</span>
          <span className={`font-bold px-2 py-0.5 rounded-full ${
            pendingSyncCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {pendingSyncCount} Berita Acara
          </span>
        </div>

        {lastSyncedTime && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Sinkronisasi Terakhir:</span>
            <span className="text-slate-700 font-medium flex items-center gap-1">
              <Server className="h-3.5 w-3.5 text-slate-400" />
              Pukul {getFormattedTime(lastSyncedTime)}
            </span>
          </div>
        )}

        {/* Sync Button */}
        {pendingSyncCount > 0 && (
          <button
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className={`w-full font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 mt-1 ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sinkronisasi Data...' : 'Kirim Berita Acara ke Pusat QA'}
          </button>
        )}

        {/* Success Feedback Alert */}
        {syncSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex gap-2 text-xs items-center justify-center mt-1 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Data Berhasil Disinkronkan!</span>
          </div>
        )}
      </div>
    </div>
  );
}
