import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, Camera, ShieldCheck, UserCheck, Sparkles, RefreshCw, CheckCircle2, ScanLine, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [loginTab, setLoginTab] = useState('standard'); // 'standard' | 'wallet' | 'face'
  const [showPassword, setShowPassword] = useState(false);
  const [showWalletPassword, setShowWalletPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Live Face ID Stream States
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('Position your face in front of camera');
  const [isMatchedSuccess, setIsMatchedSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isScanningRef = useRef(false);
  const scanIntervalRef = useRef(null);

  const { login, walletLogin, faceLogin } = useAuth();
  const navigate = useNavigate();

  // Form for Standard Login
  const {
    register: registerStandard,
    handleSubmit: handleSubmitStandard,
    formState: { errors: errorsStandard },
  } = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // Form for Wallet Login
  const {
    register: registerWallet,
    handleSubmit: handleSubmitWallet,
    formState: { errors: errorsWallet },
  } = useForm({
    defaultValues: { identifier: '', walletPassword: '' },
  });

  // Form for Face ID Login
  const {
    register: registerFace,
    handleSubmit: handleSubmitFace,
    watch: watchFace,
    formState: { errors: errorsFace },
  } = useForm({
    defaultValues: { identifier: '' },
  });

  const faceIdentifier = watchFace('identifier');

  // 1. Standard Login Submit
  const onStandardSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back to VaultX!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Wallet Login Submit
  const onWalletSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await walletLogin(data.identifier, data.walletPassword);
      toast.success('Wallet unlocked successfully! Welcome.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid identifier or wallet password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Face ID Live Stream Camera Controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setScanStatus('Camera active. Enter identity to start live scan.');
      }
    } catch (err) {
      toast.error('Unable to access camera for live Face ID scan.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // 4. Continuous Real-time Live Background Frame Comparison Loop
  useEffect(() => {
    if (loginTab === 'face' && cameraActive && faceIdentifier && faceIdentifier.trim().length >= 3 && !isMatchedSuccess) {
      setScanStatus('Live Face ID Scanning Active... Hold steady.');

      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

      scanIntervalRef.current = setInterval(async () => {
        if (isScanningRef.current || !videoRef.current || !canvasRef.current) return;

        try {
          isScanningRef.current = true;
          
          const context = canvasRef.current.getContext('2d');
          context.drawImage(videoRef.current, 0, 0, 320, 240);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.75);

          const response = await faceLogin(faceIdentifier.trim(), dataUrl);
          if (response) {
            clearInterval(scanIntervalRef.current);
            setIsMatchedSuccess(true);
            setScanStatus('🎯 Face Match Verified 100% ✓ Redirecting...');
            toast.success('Face ID Biometric Verification Successful!', { duration: 4000 });
            stopCamera();
            setTimeout(() => navigate('/dashboard'), 800);
          }
        } catch (err) {
          // Keep background live stream scanning silently without noisy toasts
          setScanStatus('Scanning facial structure... Keep face centered');
        } finally {
          isScanningRef.current = false;
        }
      }, 850); // Scans frame every 850ms
    } else if (loginTab !== 'face') {
      stopCamera();
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [loginTab, cameraActive, faceIdentifier, isMatchedSuccess]);

  // One-click manual scan trigger as optional backup
  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!faceIdentifier || faceIdentifier.trim().length < 3) {
      toast.error('Please enter your email, username, or phone number first.');
      return;
    }

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

      await faceLogin(faceIdentifier.trim(), dataUrl);
      setIsMatchedSuccess(true);
      setScanStatus('🎯 Face Match Verified 100% ✓ Redirecting...');
      toast.success('Face ID Verified!');
      stopCamera();
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Face ID verification failed. Please align your face.');
      setScanStatus('Face Mismatch. Re-align in camera view.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side — Illustration */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="z-10 mt-12">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Secure Digital Document <br /> Management Platform
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Enterprise-grade security with real-time biometric Face ID streams, Wallet Passwords, and instant authentication.
          </p>
        </div>

        {/* Abstract Illustration Placeholder */}
        <div className="z-10 relative h-96 w-full max-w-lg mx-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
             <div className="grid grid-cols-2 gap-4 p-8 w-full">
                <div className="h-24 bg-white/20 rounded-xl animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="h-24 bg-white/20 rounded-xl animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="h-32 bg-white/20 rounded-xl animate-pulse col-span-2" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        </div>

        <div className="z-10 flex items-center gap-4 text-blue-200 text-sm font-medium">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">JD</div>
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">AS</div>
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">MK</div>
          </div>
          <p>Trusted by 10,000+ enterprises</p>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10 glass rounded-3xl p-8 shadow-xl border border-white/50">
          <div className="mb-6 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl mb-4 shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform"
            >
              V
            </Link>
            <h2 className="text-3xl font-bold text-slate-800 mb-1">Sign in to VaultX</h2>
            <p className="text-slate-500 text-sm">Choose your preferred login method</p>
          </div>

          {/* LOGIN METHOD TAB SWITCHER */}
          <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-200/70 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => { setLoginTab('standard'); stopCamera(); }}
              className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                loginTab === 'standard' 
                  ? 'bg-white text-primary shadow-md font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock size={14} /> Account
            </button>

            <button
              type="button"
              onClick={() => { setLoginTab('wallet'); stopCamera(); }}
              className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                loginTab === 'wallet' 
                  ? 'bg-white text-primary shadow-md font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet size={14} /> Wallet Pass
            </button>

            <button
              type="button"
              onClick={() => { setLoginTab('face'); startCamera(); }}
              className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                loginTab === 'face' 
                  ? 'bg-white text-primary shadow-md font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera size={14} /> Face ID Live
            </button>
          </div>

          {/* TAB 1: STANDARD ACCOUNT LOGIN */}
          {loginTab === 'standard' && (
            <form onSubmit={handleSubmitStandard(onStandardSubmit)} className="space-y-5 animate-fadeIn">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                error={errorsStandard.email?.message}
                {...registerStandard('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errorsStandard.password?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  {...registerStandard('password', { required: 'Password is required' })}
                />
                
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="sr-only"
                      {...registerStandard('rememberMe')}
                    />
                    <span className="text-xs text-slate-600 group-hover:text-slate-800">
                      Remember me
                    </span>
                  </label>
                  
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-blue-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" isLoading={isSubmitting} icon={ArrowRight} className="w-full shadow-lg shadow-primary/25">
                Sign in with Password
              </Button>
            </form>
          )}

          {/* TAB 2: WALLET PASSWORD LOGIN */}
          {loginTab === 'wallet' && (
            <form onSubmit={handleSubmitWallet(onWalletSubmit)} className="space-y-5 animate-fadeIn">
              <Input
                label="Email, Username, or Phone Number"
                placeholder="Enter email, username or +91..."
                icon={Mail}
                error={errorsWallet.identifier?.message}
                {...registerWallet('identifier', { required: 'Identifier is required' })}
              />

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
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showWalletPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...registerWallet('walletPassword', { required: 'Wallet password is required' })}
              />

              <Button type="submit" isLoading={isSubmitting} icon={Wallet} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                Unlock Vault with Wallet Password
              </Button>
            </form>
          )}

          {/* TAB 3: ADVANCED REAL-TIME LIVE STREAM FACE ID SCANNER */}
          {loginTab === 'face' && (
            <form onSubmit={handleManualScanSubmit} className="space-y-5 animate-fadeIn">
              <Input
                label="Email, Username, or Phone Number"
                placeholder="Enter your email, username or phone"
                icon={UserCheck}
                error={errorsFace.identifier?.message}
                {...registerFace('identifier', { required: 'Identifier is required' })}
              />

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
                      {/* Corner Brackets */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl"></div>
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr"></div>
                      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl"></div>
                      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br"></div>

                      {/* Face Positioning Target Ring */}
                      <div className="absolute w-36 h-36 border border-emerald-400/40 rounded-full animate-ping pointer-events-none"></div>

                      {/* Animated Laser Scanning Bar */}
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

                  <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                </div>

                {/* STATUS BAR */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono flex items-center justify-center gap-2 text-emerald-300">
                  {cameraActive && !isMatchedSuccess && <Loader2 size={14} className="animate-spin text-emerald-400" />}
                  <span>{scanStatus}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                isLoading={isSubmitting} 
                icon={ScanLine} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30"
              >
                Manual Trigger Scan & Login
              </Button>
            </form>
          )}
          
          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-blue-700 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
