// ==============================================================================
// VibeChat — Universal QR Code Hub (Scanner, Contact Card & APK Downloader)
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  X, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  UserCheck, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { store } from '../../services/store';
import { getServerUrl } from '../../services/api';

export default function QRCodeModal({ isOpen, onClose, onUserScanned, initialTab = 'scan' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'scan' | 'my_qr' | 'download_apk'
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const currentUser = store.currentUser;
  const serverUrl = getServerUrl() || window.location.origin;
  const apkDownloadUrl = `${serverUrl}/download`;

  // Profile QR payload
  const profileQrData = currentUser 
    ? JSON.stringify({
        type: 'vibe_contact',
        id: currentUser.id,
        phone: currentUser.phone || '',
        name: currentUser.name || currentUser.nickname || 'VibeUser'
      })
    : '';

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCameraError('');
      setScannedData(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab]);

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

      // Begin barcode scanning loop
      scanLoop();
    } catch (err) {
      console.warn('[QR Scanner] Camera error:', err);
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
            handleBarcodeResult(barcodes[0].rawValue);
          } else {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        })
        .catch(() => {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        });
    } else {
      // BarcodeDetector not natively available in this browser
      animFrameRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleBarcodeResult = (text) => {
    if (!text) return;
    stopCamera();
    setScannedData(text);

    // Try parsing as VibeConnect Contact
    try {
      const parsed = JSON.parse(text);
      if (parsed.type === 'vibe_contact' || parsed.phone || parsed.id) {
        if (onUserScanned) {
          onUserScanned(parsed);
          onClose();
          return;
        }
      }
    } catch (e) {
      // Not JSON, check if it's a URL or direct phone number
      if (text.startsWith('http://') || text.startsWith('https://')) {
        if (text.includes('/download') || text.includes('.apk')) {
          window.location.href = text;
          onClose();
          return;
        }
      }
    }
  };

  const handleCopyApkLink = () => {
    navigator.clipboard.writeText(apkDownloadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-[var(--text-primary)]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg leading-tight">QR Code Hub</h3>
              <p className="text-xs text-[var(--text-secondary)]">Scan & Connect Instantly</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border-color)] bg-white/2 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan QR
          </button>

          <button
            onClick={() => setActiveTab('my_qr')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my_qr'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            My QR
          </button>

          <button
            onClick={() => setActiveTab('download_apk')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'download_apk'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Get APK
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex flex-col items-center">
          
          {/* TAB 1: SCANNER */}
          {activeTab === 'scan' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-inner flex items-center justify-center mb-4">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser scan line overlay */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-lg shadow-purple-500 animate-pulse top-1/2 -translate-y-1/2"></div>
                )}

                {/* Viewfinder frame corners */}
                <div className="absolute inset-4 pointer-events-none border-2 border-purple-400/50 rounded-xl"></div>

                {/* Camera error fallback */}
                {cameraError && (
                  <div className="absolute inset-0 p-4 bg-slate-950/90 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] text-center max-w-xs">
                Align any VibeChat profile QR code or APK download QR code within the frame to scan automatically.
              </p>

              {scannedData && (
                <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 w-full text-center truncate">
                  Scanned: <span className="font-mono">{scannedData}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY PROFILE QR */}
          {activeTab === 'my_qr' && (
            <div className="w-full flex flex-col items-center text-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(profileQrData)}`}
                  alt="My Profile QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{currentUser?.avatar || '🦊'}</span>
                <span className="font-heading font-bold text-base text-[var(--text-primary)]">
                  {currentUser?.name || currentUser?.nickname || 'Your Account'}
                </span>
              </div>
              <p className="text-xs text-purple-400 font-mono mb-4">
                📱 {currentUser?.phone || 'No phone registered'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                Friends can scan this QR code with their mobile phone camera to start chatting with you immediately!
              </p>
            </div>
          )}

          {/* TAB 3: DOWNLOAD MOBILE APK QR */}
          {activeTab === 'download_apk' && (
            <div className="w-full flex flex-col items-center text-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(apkDownloadUrl)}`}
                  alt="Download VibeChat APK"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                Scan to Install on Mobile Phone
              </div>

              <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-4">
                Point your Android camera at this QR code to download <span className="text-[var(--text-primary)] font-semibold">VibeChat.apk</span> directly over Wi-Fi.
              </p>

              <div className="w-full flex gap-2">
                <a
                  href={apkDownloadUrl}
                  download="VibeChat.apk"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <Download className="w-4 h-4" />
                  Direct Download
                </a>

                <button
                  onClick={handleCopyApkLink}
                  className="py-2.5 px-3 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy direct download link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copied' : 'Link'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
