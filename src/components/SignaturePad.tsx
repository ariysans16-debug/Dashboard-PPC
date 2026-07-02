import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pencil, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  placeholderName?: string;
  onSave: (base64Data: string | null) => void;
  savedDataUrl?: string | null;
}

export default function SignaturePad({
  label,
  placeholderName = 'Nama Lengkap',
  onSave,
  savedDataUrl = null
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!savedDataUrl);
  const [hasSignature, setHasSignature] = useState(!!savedDataUrl);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // high DPI support
    canvas.height = 120 * 2;
    ctx.scale(2, 2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;

    // If there is loaded/saved data, render it
    if (savedDataUrl) {
      const img = new Image();
      img.src = savedDataUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, 120);
      };
      setIsEmpty(false);
      setHasSignature(true);
    }
  }, [savedDataUrl]);

  // Coordinates helper
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save signature
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if drawing has lines
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setHasSignature(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave(null);
    setIsEmpty(true);
    setHasSignature(false);
  };

  return (
    <div className="flex flex-col gap-1.5" id={`sig-pad-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex gap-2">
          {hasSignature && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
              <Check className="h-2.5 w-2.5" /> Tersimpan
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-slate-500 hover:text-red-600 font-semibold transition-all flex items-center gap-1 bg-slate-100 hover:bg-red-50 px-2 py-1 rounded"
          >
            <Eraser className="h-3 w-3" />
            Hapus
          </button>
        </div>
      </div>

      <div className="relative border border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden h-[120px] transition-all hover:border-slate-400">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 gap-1.5">
            <Pencil className="h-5 w-5 stroke-1" />
            <span className="text-xs">Tanda tangan di area ini</span>
            <span className="text-[10px] text-slate-400 opacity-80">{placeholderName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
