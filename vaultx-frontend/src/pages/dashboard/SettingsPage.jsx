import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, Shield, ShieldCheck, Key, Wallet, Camera, Bell, Sparkles, RefreshCw, CheckCircle2, Clock, Trash2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import userService from '../../services/userService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('passwords'); // 'passwords' | 'faceid' | 'notifications' | 'privacy'
  
  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showWalletPassword, setShowWalletPassword] = useState(false);

  // Loading States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingWalletPassword, setIsChangingWalletPassword] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isSavingFace, setIsSavingFace] = useState(false);

  // WebRTC Camera States for Face ID Re-enrolment
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailUploads: true,
    emailShares: true,
    expirationWarnings: true,
    securityAlerts: true
  });

  // Security Privacy Settings State
  const [autoLock, setAutoLock] = useState(() => localStorage.getItem('VAULTX_AUTOLOCK_MINUTES') || '15');
  const [autoPurgeTrash, setAutoPurgeTrash] = useState(true);

  // Forms
  const { register: registerPw, handleSubmit: handleSubmitPw, reset: resetPw, formState: { errors: errorsPw } } = useForm();
  const { register: registerWallet, handleSubmit: handleSubmitWallet, reset: resetWallet, formState: { errors: errorsWallet } } = useForm();
  const { register: registerPin, handleSubmit: handleSubmitPin, reset: resetPin, formState: { errors: errorsPin } } = useForm();

  // 1. Submit Account Password Change
  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Account Password updated successfully');
      resetPw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2. Submit Wallet Password Update
  const onWalletPasswordSubmit = async (data) => {
    setIsChangingWalletPassword(true);
    try {
      await userService.updateWalletPassword(data.walletPassword);
      toast.success('Wallet Security Password updated successfully');
      resetWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wallet password');
    } finally {
      setIsChangingWalletPassword(false);
    }
  };

  // 3. Submit Vault PIN Change
  const onPinSubmit = async (data) => {
    setIsChangingPin(true);
    try {
      await userService.changeVaultPin(data.currentPin, data.newPin);
      toast.success('Vault PIN changed successfully');
      resetPin();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change Vault PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  // 4. WebRTC Camera Controls for Face ID Re-enrolment
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      toast.error('Unable to access camera for Face ID setup.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFaceSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      setCapturedFace(dataUrl);
      stopCamera();
      toast.success('New Face ID Biometric Snapshot Captured!');
    }
  };

  const saveFaceBiometrics = async () => {
    if (!capturedFace) {
      toast.error('Please capture a face photo first');
      return;
    }
    setIsSavingFace(true);
    try {
      await userService.updateFaceBiometrics(capturedFace);
      updateUser({ ...user, faceData: capturedFace });
      toast.success('Face ID Biometrics updated successfully!');
    } catch (err) {
      toast.error('Failed to update Face ID biometrics');
    } finally {
      setIsSavingFace(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Security & Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage passwords, Face ID biometrics, notifications, and security rules.</p>
      </div>

      {/* SETTINGS TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('passwords')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'passwords'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key size={16} /> Passwords & PINs
        </button>

        <button
          onClick={() => { setActiveTab('faceid'); startCamera(); }}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'faceid'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera size={16} /> Face ID Biometrics
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell size={16} /> Notifications
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield size={16} /> Vault Security
        </button>
      </div>

      {/* TAB 1: PASSWORDS & PINS */}
      {activeTab === 'passwords' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Account Password */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-blue-100 text-primary rounded-xl flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Account Password</h2>
                <p className="text-xs text-slate-500">Update primary login credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPw(onPasswordSubmit)} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                icon={Lock}
                error={errorsPw.currentPassword?.message}
                rightElement={
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...registerPw('currentPassword', { required: 'Current password is required' })}
              />
              
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                icon={Lock}
                error={errorsPw.newPassword?.message}
                rightElement={
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...registerPw('newPassword', { 
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' }
                })}
              />

              <Button type="submit" isLoading={isChangingPassword}>Update Account Password</Button>
            </form>
          </div>

          {/* Wallet Password */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Wallet Security Password</h2>
                <p className="text-xs text-slate-500">Password used for 1-click Wallet Pass authentication</p>
              </div>
            </div>

            <form onSubmit={handleSubmitWallet(onWalletPasswordSubmit)} className="space-y-4 max-w-md">
              <Input
                label="New Wallet Security Password"
                type={showWalletPassword ? 'text' : 'password'}
                icon={Wallet}
                error={errorsWallet.walletPassword?.message}
                rightElement={
                  <button type="button" onClick={() => setShowWalletPassword(!showWalletPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showWalletPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...registerWallet('walletPassword', { 
                  required: 'Wallet password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
              />

              <Button type="submit" isLoading={isChangingWalletPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Update Wallet Password
              </Button>
            </form>
          </div>

          {/* Vault Security PIN */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Vault Document PIN</h2>
                <p className="text-xs text-slate-500">6-digit PIN to lock sensitive document viewing</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPin(onPinSubmit)} className="space-y-4 max-w-md">
              <Input
                label="Current PIN"
                type="password"
                maxLength={6}
                icon={Lock}
                error={errorsPin.currentPin?.message}
                {...registerPin('currentPin', { required: 'Current PIN is required' })}
              />
              
              <Input
                label="New PIN"
                type="password"
                maxLength={6}
                icon={Lock}
                error={errorsPin.newPin?.message}
                {...registerPin('newPin', { 
                  required: 'New PIN is required',
                  pattern: { value: /^\d{6}$/, message: 'PIN must be 6 digits' }
                })}
              />

              <Button type="submit" isLoading={isChangingPin} className="bg-purple-600 hover:bg-purple-700 text-white">
                Update Vault PIN
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: FACE ID BIOMETRICS MANAGEMENT */}
      {activeTab === 'faceid' && (
        <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Face ID Biometric Profile Enrolment</h2>
              <p className="text-xs text-slate-500">Re-enroll or update your live face scan profile</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-xl">
              {capturedFace ? (
                <img src={capturedFace} alt="Captured Face Biometric" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="text-center p-3 text-slate-400 space-y-2">
                      <Camera size={36} className="mx-auto opacity-50" />
                      <p className="text-xs">Webcam Offline</p>
                      <Button type="button" size="sm" onClick={startCamera} variant="outline">Start Camera</Button>
                    </div>
                  )}
                </>
              )}
              <canvas ref={canvasRef} width="320" height="240" className="hidden" />
            </div>

            <div className="flex gap-2">
              {!capturedFace && cameraActive && (
                <Button type="button" onClick={captureFaceSnapshot} icon={Camera} className="w-full bg-indigo-600 text-white">
                  Capture New Face Photo
                </Button>
              )}

              {capturedFace && (
                <>
                  <Button type="button" variant="outline" onClick={() => { setCapturedFace(null); startCamera(); }} icon={RefreshCw} className="w-1/2">
                    Retake Photo
                  </Button>
                  <Button type="button" onClick={saveFaceBiometrics} isLoading={isSavingFace} icon={CheckCircle2} className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Biometrics
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS PREFERENCES */}
      {activeTab === 'notifications' && (
        <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Notification & Alert Preferences</h2>
              <p className="text-xs text-slate-500">Configure email and SMS notification delivery settings</p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <label className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Document Upload Confirmation</p>
                <p className="text-xs text-slate-500">Receive email notification when a new document is added to your vault</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.emailUploads} 
                onChange={(e) => {
                  setNotifications({ ...notifications, emailUploads: e.target.checked });
                  toast.success('Notification preference updated');
                }} 
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>

            <label className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Share Link Access Alerts</p>
                <p className="text-xs text-slate-500">Receive email notification when someone accesses your shared links</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.emailShares} 
                onChange={(e) => {
                  setNotifications({ ...notifications, emailShares: e.target.checked });
                  toast.success('Notification preference updated');
                }} 
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>

            <label className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">7-Day & 24-Hour Expiration Warnings</p>
                <p className="text-xs text-slate-500">Receive alerts before temporary documents expire</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.expirationWarnings} 
                onChange={(e) => {
                  setNotifications({ ...notifications, expirationWarnings: e.target.checked });
                  toast.success('Notification preference updated');
                }} 
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: VAULT PRIVACY & SECURITY RULES */}
      {activeTab === 'privacy' && (
        <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Vault Privacy & Auto-Lock Rules</h2>
              <p className="text-xs text-slate-500">Enterprise security parameters</p>
            </div>
          </div>

          <div className="space-y-5 max-w-xl">
            <div>
              <label className="text-sm font-semibold text-slate-800 block mb-1">Inactivity Auto-Lock Timeout</label>
              <select 
                value={autoLock} 
                onChange={(e) => {
                  const val = e.target.value;
                  setAutoLock(val);
                  localStorage.setItem('VAULTX_AUTOLOCK_MINUTES', val);
                  // Dispatch a custom event so the hook can immediately pick up the new value
                  window.dispatchEvent(new Event('autolock_changed'));
                  toast.success(`Auto-lock set to ${val} minutes`);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="1">1 Minute</option>
                <option value="5">5 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
              </select>
            </div>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-800">30-Day Trash Auto-Purge</p>
                <p className="text-xs text-slate-500">Automatically delete files moved to trash after 30 days</p>
              </div>
              <input 
                type="checkbox" 
                checked={autoPurgeTrash} 
                onChange={(e) => {
                  setAutoPurgeTrash(e.target.checked);
                  toast.success('Trash auto-purge updated');
                }} 
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
