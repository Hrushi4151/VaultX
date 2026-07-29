import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Camera, Save, ShieldCheck, Mail, Calendar, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      country: user?.country || '',
    }
  });

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

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
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
        setAvatarPreview(user?.profilePicture); // Revert on failure
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column — Avatar & Status */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass rounded-2xl p-6 text-center shadow-sm border border-slate-100">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300 bg-slate-100">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-2 border-white"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarChange}
                />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800">{user?.firstName} {user?.lastName}</h2>
              <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
              
              <div className="flex flex-col gap-2">
                {user?.emailVerified ? (
                  <Badge variant="success" className="justify-center py-1.5"><ShieldCheck size={14} className="mr-1"/> Verified Account</Badge>
                ) : (
                  <Badge variant="warning" className="justify-center py-1.5">Unverified Email</Badge>
                )}
                {user?.hasVaultPin ? (
                  <Badge variant="primary" className="justify-center py-1.5"><Lock size={14} className="mr-1"/> Vault PIN Active</Badge>
                ) : (
                  <Badge variant="error" className="justify-center py-1.5">No Vault PIN Setup</Badge>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary"/> Account Details
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium text-slate-700">
                    {user?.roles?.map(r => r.name.replace('ROLE_', '')).join(', ')}
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-700">
                    {new Date(user?.createdAt).toLocaleDateString()}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column — Edit Form */}
          <div className="md:col-span-2">
            <div className="glass rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Personal Information</h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Username"
                    icon={User}
                    error={errors.username?.message}
                    {...register('username', {
                      pattern: {
                        value: /^[a-zA-Z0-9_]{3,20}$/,
                        message: '3-20 chars, alphanumeric/underscore'
                      }
                    })}
                  />
                  <Input
                    label="Country"
                    icon={MapPin}
                    error={errors.country?.message}
                    {...register('country', { required: 'Country is required' })}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" icon={Save} isLoading={isLoading} disabled={!isDirty}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
