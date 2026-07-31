import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Wallet, Sparkles, CheckCircle2, ScanLine, EyeOff, Eye, ShieldCheck, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function PrivacyLockOverlay({ onUnlock }) {
  const { user, walletLogin, faceLogin } = useAuth();
  
  const [unlockTab, setUnlockTab] = useState('wallet'); // 'wallet' | 'face'
  const [showWalletPassword, setShowWalletPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Face Biometric states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('Position your face in front of camera');
  const [isMatchedSuccess, setIsMatchedSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Forms
  const { 
    register: registerWallet, 
    handleSubmit: handleSubmitWallet, 
    formState: { errors: errorsWallet } 
  } = useForm();

  // Handle camera start/stop
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setScanStatus('Scanning biometrics...');
      }
    } catch (err) {
      toast.error('Unable to access camera.');
      setScanStatus('Camera Access Denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (unlockTab === 'face') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [unlockTab]);

  // Submit Handlers
  const onWalletSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await walletLogin(user.email, data.walletPassword);
      toast.success('Vault Unlocked Successfully');
      onUnlock();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid wallet password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera preview is offline. Please start camera.');
      return;
    }

    setIsSubmitting(true);
    setScanStatus('Analyzing facial biometrics...');
    try {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);

      await faceLogin(user.email, dataUrl);
      setIsMatchedSuccess(true);
      setScanStatus('🎯 Face Match Verified 100% ✓ Unlocking...');
      toast.success('Face ID Verified!');
      stopCamera();
      setTimeout(() => onUnlock(), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Face ID verification failed.');
      setScanStatus('Face Mismatch. Re-align in camera view.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Absolute Backdrop with strong blur */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"></div>

      {/* Lock Card */}
      <div className="w-full max-w-md relative z-10 bg-white/5 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-white/10 text-white">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Vault Locked</h2>
          <p className="text-slate-400 text-sm mt-2">
            Your session was locked due to inactivity or focus loss.
          </p>
          <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-slate-300">
            User: <span className="font-semibold text-white">{user?.email}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8 border border-white/5">
          <button
            onClick={() => setUnlockTab('wallet')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              unlockTab === 'wallet' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wallet size={16} /> Wallet Pass
          </button>
          <button
            onClick={() => setUnlockTab('face')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              unlockTab === 'face' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ScanLine size={16} /> Face ID
          </button>
        </div>

        {/* Tab Content: Wallet Password */}
        {unlockTab === 'wallet' && (
          <form onSubmit={handleSubmitWallet(onWalletSubmit)} className="space-y-5 animate-fadeIn">
            <Input
              label="Wallet Security Password"
              type={showWalletPassword ? 'text' : 'password'}
              placeholder="Enter wallet password"
              icon={Wallet}
              error={errorsWallet.walletPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowWalletPassword(!showWalletPassword)}
                  className="text-slate-400 hover:text-slate-200 focus:outline-none p-1"
                >
                  {showWalletPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...registerWallet('walletPassword', { required: 'Wallet password is required' })}
            />
            <Button type="submit" isLoading={isSubmitting} icon={Lock} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 border-none">
              Unlock Vault
            </Button>
          </form>
        )}

        {/* Tab Content: Face Biometric */}
        {unlockTab === 'face' && (
          <form onSubmit={handleManualScanSubmit} className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-3 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                  <Sparkles size={14} className="animate-spin text-emerald-400" /> Continuous Biometric HUD
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">LIVE STREAM</span>
              </div>

              {/* FUTURISTIC SCANNER VIEWPORT */}
              <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-emerald-500/50 shadow-inner group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                
                {!cameraActive && (
                  <div className="text-center p-3 text-slate-400 space-y-2">
                    <Camera size={36} className="mx-auto opacity-40 text-slate-400" />
                    <p className="text-xs">Camera Initializing...</p>
                    <Button type="button" size="sm" onClick={startCamera} variant="outline" className="text-xs border-slate-600 text-slate-300">
                      Turn On Camera
                    </Button>
                  </div>
                )}

                {/* FUTURISTIC SCANNING HUD OVERLAY & LASER SCAN BAR */}
                {cameraActive && !isMatchedSuccess && (
                  <>
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl"></div>
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr"></div>
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl"></div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br"></div>
                    <div className="absolute w-36 h-36 border border-emerald-400/40 rounded-full animate-ping pointer-events-none"></div>
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-bounce"></div>
                  </>
                )}

                {/* SUCCESS MATCH BADGE */}
                {isMatchedSuccess && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-2 animate-fadeIn">
                    <CheckCircle2 size={48} className="text-emerald-400 animate-bounce" />
                    <p className="font-bold text-lg text-emerald-300">Face ID Verified 100%</p>
                    <p className="text-xs text-emerald-200">Unlocking Enterprise Vault...</p>
                  </div>
                )}
              </div>
              
              <div className="text-xs font-mono text-emerald-500/80 mt-1 h-4 flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                {scanStatus}
              </div>
            </div>

            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={isMatchedSuccess || !cameraActive}
              icon={ScanLine} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg border border-slate-700"
            >
              Verify Face ID
            </Button>
          </form>
        )}
      </div>

      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} width="320" height="240" className="hidden"></canvas>
    </div>
  );
}
