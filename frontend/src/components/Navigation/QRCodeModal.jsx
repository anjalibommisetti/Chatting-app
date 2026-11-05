// ==============================================================================
// VibeChat — Universal QR Code Hub (Mobile App Installer, Scanner & Profile QR)
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
  ExternalLink,
  Upload,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { store } from '../../services/store';

export default function QRCodeModal({ isOpen, onClose, onUserScanned, initialTab = 'install' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'install' | 'scan' | 'my_qr'
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [downloadMode, setDownloadMode] = useState('apk'); // default to 'apk' for direct APK install

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = store.currentUser;
  
  // Production Web App URL
  const webAppUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'https://chatting-app-tan.vercel.app' 
    : (typeof window !== 'undefined' ? window.location.origin : 'https://chatting-app-tan.vercel.app');

  const apkDownloadUrl = '/VibeChat.apk';

  const currentQrTarget = downloadMode === 'apk' ? `${webAppUrl}/download.html` : webAppUrl;

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
      animFrameRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleBarcodeResult = (text) => {
    if (!text) return;
    stopCamera();
    setScannedData(text);

    // Try parsing as contact JSON
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
      // URL or plain text
      if (text.startsWith('http://') || text.startsWith('https://')) {
        window.open(text, '_blank');
        return;
      }
    }
  };

  // Upload image fallback for QR scanning
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if ('BarcodeDetector' in window) {
        const bitmap = await createImageBitmap(file);
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(bitmap);
        if (barcodes.length > 0) {
          handleBarcodeResult(barcodes[0].rawValue);
        } else {
          setCameraError('No valid QR code was detected in that image.');
        }
      } else {
        setCameraError('Your browser does not support image barcode decoding. Please use a live camera.');
      }
    } catch (err) {
      setCameraError('Failed to decode QR image: ' + err.message);
    }
    e.target.value = '';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentQrTarget);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col text-[var(--text-primary)] max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg leading-tight">Mobile App & QR Hub</h3>
              <p className="text-xs text-[var(--text-secondary)]">Install on Mobile • QR Scanner • Profile</p>
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
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Install App</span>
          </button>

          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>QR Scanner</span>
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
            <span>My QR</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col items-center">
          
          {/* TAB 1: INSTALL MOBILE APP (AUTO-UPDATING) */}
          {activeTab === 'install' && (
            <div className="w-full flex flex-col items-center text-center space-y-4">
              
              {/* Toggle PWA vs APK */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-[var(--border-color)] text-xs">
                <button
                  onClick={() => setDownloadMode('pwa')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    downloadMode === 'pwa'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  ⚡ Mobile App (Auto-Updating)
                </button>
                <button
                  onClick={() => setDownloadMode('apk')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    downloadMode === 'apk'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  📦 Standalone APK
                </button>
              </div>

              {/* QR Code Graphic */}
              <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=3&data=${encodeURIComponent(currentQrTarget)}`}
                  alt="VibeChat Mobile Install QR"
                  className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg"
                />
              </div>

              {/* Title & Instructions */}
              <div>
                <h4 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Scan with Phone Camera to Install
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Point your Android or iPhone camera at this code to open and install VibeChat directly onto your phone screen.
                </p>
              </div>

              {/* Auto-Update Guarantee Banner */}
              <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-left">
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-emerald-300 block mb-0.5">
                      🔄 Instant Automatic Web Updates:
                    </span>
                    <span className="text-slate-300">
                      Whenever changes or new features are pushed to the web, your installed mobile app updates automatically the next time you open it! No manual reinstallation required.
                    </span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="w-full text-left space-y-2 text-xs bg-white/[0.03] p-3.5 rounded-2xl border border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Open your phone's camera & scan the QR code above.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>In Chrome / Safari, tap <strong>"Install App"</strong> (or menu <strong>"Add to Home screen"</strong>).</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>VibeChat appears as a mobile app with full-screen view & instant push notifications!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-2">
                <a
                  href={currentQrTarget}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  {downloadMode === 'pwa' ? 'Open Mobile Web App' : 'Download APK'}
                </a>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE CAMERA SCANNER & IMAGE UPLOAD */}
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
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1.5 cursor-pointer mb-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] text-center max-w-xs mb-3">
                Align any VibeChat profile QR code or install QR code within the frame to scan automatically.
              </p>

              {/* Image Upload Fallback */}
              <div className="w-full max-w-xs flex flex-col items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border-color)] bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Upload QR Image / Screenshot</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {scannedData && (
                <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 w-full text-center truncate">
                  Scanned: <span className="font-mono">{scannedData}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY PROFILE QR */}
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

        </div>

      </div>
    </div>
  );
}
