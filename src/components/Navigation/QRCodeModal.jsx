// ==============================================================================
// VibeChat — Install Mobile APK & QR Scanner
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Camera, 
  Smartphone, 
  QrCode, 
  Check, 
  Copy, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, onUserScanned }) {
  const [mode, setMode] = useState('download'); // 'download' | 'camera_scan'
  const [copied, setCopied] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const downloadUrl = 'https://chatting-app-tan.vercel.app/download.html';
  const rawApkUrl = 'https://chatting-app-tan.vercel.app/VibeChat.apk';

  useEffect(() => {
    if (isOpen) {
      setMode('download');
      setCameraError('');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mode === 'camera_scan') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, mode]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      scanLoop();
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
      setIsScanning(false);
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      barcodeDetector.detect(videoRef.current)
        .then((barcodes) => {
          if (barcodes.length > 0) {
            const val = barcodes[0].rawValue;
            stopCamera();
            if (val.startsWith('http://') || val.startsWith('https://')) {
              window.open(val, '_blank');
            } else {
              try {
                const parsed = JSON.parse(val);
                if (onUserScanned) onUserScanned(parsed);
              } catch (e) {}
            }
            onClose();
          } else {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        })
        .catch(() => {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        });
    } else {
      animFrameRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rawApkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-[#121624] border border-purple-500/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Install Mobile App</h3>
              <p className="text-[11px] text-slate-400">Scan QR to download APK on phone</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-white/10 bg-white/[0.02] p-1.5 gap-1.5">
          <button
            onClick={() => setMode('download')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'download'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>

          <button
            onClick={() => setMode('camera_scan')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'camera_scan'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center">
          
          {mode === 'download' && (
            <div className="w-full flex flex-col items-center">
              {/* QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-3 border-2 border-purple-500/40">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=3&data=${encodeURIComponent(downloadUrl)}`}
                  alt="Scan to Download VibeChat APK"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <p className="text-xs text-purple-300 font-semibold mb-1">
                Scan with your phone camera
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                Point your phone camera at this QR code. It will instantly download and install <strong className="text-white">VibeChat.apk</strong> on your phone.
              </p>

              {/* Action Buttons */}
              <div className="w-full flex gap-2 mb-3">
                <a
                  href={rawApkUrl}
                  download="VibeChat.apk"
                  className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK (4.3MB)</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Copy direct APK link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Link'}</span>
                </button>
              </div>

              {/* Simple 3 steps */}
              <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-left text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-white text-[10px] uppercase tracking-wider text-purple-400 mb-1">Quick Installation Steps:</div>
                <div>1. Scan QR code with phone camera ➔ tap link.</div>
                <div>2. Tap <strong>Download anyway</strong> if prompted by Chrome.</div>
                <div>3. Tap <strong>Open</strong> ➔ <strong>Install</strong> to install the app.</div>
              </div>
            </div>
          )}

          {mode === 'camera_scan' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-56 h-56 rounded-2xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-inner flex items-center justify-center mb-3">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {isScanning && !cameraError && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-lg shadow-purple-500 animate-pulse top-1/2 -translate-y-1/2"></div>
                )}

                <div className="absolute inset-3 pointer-events-none border-2 border-purple-400/50 rounded-xl"></div>

                {cameraError && (
                  <div className="absolute inset-0 p-3 bg-slate-950/90 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-6 h-6 text-amber-400 mb-1.5" />
                    <p className="text-[11px] text-slate-300 leading-tight mb-2">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs">
                Align any QR code within the frame to scan automatically.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
