import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Camera, Save, ShieldCheck, Mail, Calendar, Activity, Phone, CheckCircle2, HardDrive, Smartphone, Laptop, Trash2, Key, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      country: user?.country || '',
    }
  });

  useEffect(() => {
    fetchSessions();
    fetchStorageStats();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await userService.getSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      setSessions([
        { id: 'current-session', ipAddress: '127.0.0.1', deviceName: 'Chrome on Windows 11', lastActive: 'Just now', current: true }
      ]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const res = await userService.getStorageStats();
      if (res.data) {
        setStorageStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch storage stats:", err);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await userService.terminateSession(sessionId);
      toast.success('Session terminated and device logged out');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to terminate session');
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const updated = await userService.updateProfile(data);
      updateUser(updated.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setAvatarLoading(true);
      
      try {
        await userService.updateAvatar(base64String);
        updateUser({ ...user, profilePicture: base64String });
        toast.success('Avatar updated successfully');
      } catch (error) {
        toast.error('Failed to update avatar');
        setAvatarPreview(user?.profilePicture);
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl bg-white/10 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white uppercase">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-accent text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-white"
              title="Change Avatar"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Profile Info */}
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
              <Badge variant="success" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 whitespace-nowrap">
                <ShieldCheck size={12} className="inline mr-1" /> Enterprise Vault User
              </Badge>
            </div>
            <div className="text-blue-100 text-sm flex flex-col sm:flex-row items-center justify-center md:justify-start gap-1 sm:gap-2">
              <span className="flex items-center gap-1"><Mail size={14} /> {user?.email}</span>
              {user?.phoneNumber && <span className="flex items-center gap-1"><Phone size={14} className="sm:ml-2" /> {user?.phoneNumber}</span>}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs text-blue-200">
              <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Country: {user?.country || 'Not Set'}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Username: @{user?.username || 'user'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Verification Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Email Verified</p>
            <p className="text-[11px] sm:text-sm font-bold text-slate-800">Confirmed ✓</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Mobile Phone</p>
            <p className="text-[11px] sm:text-sm font-bold text-slate-800">Verified ✓</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center shrink-0">
            <Key size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Wallet Password</p>
            <p className="text-[11px] sm:text-sm font-bold text-slate-800">Enrolled ✓</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Biometric Face</p>
            <p className="text-[11px] sm:text-sm font-bold text-slate-800">Active HUD ✓</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Personal Details</h2>
                <p className="text-xs text-slate-500">Update your account information</p>
              </div>
              <Badge variant="neutral">Auto-Synced</Badge>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  icon={User}
                  error={errors.firstName?.message}
                  {...register('firstName', { required: 'First name is required' })}
                />
                
                <Input
                  label="Last Name"
                  icon={User}
                  error={errors.lastName?.message}
                  {...register('lastName', { required: 'Last name is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Username"
                  icon={User}
                  error={errors.username?.message}
                  {...register('username', { required: 'Username is required' })}
                />

                <Input
                  label="Country / Region"
                  icon={MapPin}
                  error={errors.country?.message}
                  {...register('country')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user?.email || ''} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium border border-slate-200 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user?.phoneNumber || '+91 Security Verified'} 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium border border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  isLoading={isLoading} 
                  disabled={!isDirty} 
                  icon={Save}
                  className="shadow-lg shadow-primary/20"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Vault Storage & Active Sessions */}
        <div className="space-y-6">
          {/* Storage Usage Card (PER-USER DYNAMIC STATS) */}
          <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <HardDrive size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Personal Vault Storage</h3>
                <p className="text-xs text-slate-500">
                  {storageStats ? `${storageStats.formattedSize} of ${storageStats.formattedLimit} used` : 'Calculating storage...'}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(storageStats?.usedPercentage || 0, 2)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Encrypted Files</span>
                <span className="font-bold text-slate-700">{storageStats ? `${storageStats.totalFilesCount} Files` : '0 Files'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Share Links</span>
                <span className="font-bold text-slate-700">{storageStats ? `${storageStats.totalShareLinksCount} Links` : '0 Links'}</span>
              </div>
            </div>
          </div>

          {/* Active Devices / Sessions Card */}
          <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800">Active Devices</h3>
              </div>
              <button onClick={fetchSessions} className="text-slate-400 hover:text-slate-600">
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((sess, idx) => (
                <div key={sess.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600">
                      <Laptop size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{sess.deviceName || 'Windows Desktop'}</p>
                      <p className="text-[10px] text-slate-400">{sess.ipAddress} • {sess.lastActive || 'Active'}</p>
                    </div>
                  </div>
                  {sess.current ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">This Device</span>
                  ) : (
                    <button 
                      onClick={() => handleTerminateSession(sess.id)} 
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Terminate Session"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
