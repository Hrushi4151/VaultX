import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, Shield, ShieldCheck, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import userService from '../../services/userService';
import DashboardLayout from '../../layouts/DashboardLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const { register: registerPw, handleSubmit: handleSubmitPw, reset: resetPw, formState: { errors: errorsPw } } = useForm();
  const { register: registerPin, handleSubmit: handleSubmitPin, reset: resetPin, formState: { errors: errorsPin } } = useForm();

  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      resetPw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onPinSubmit = async (data) => {
    setIsChangingPin(true);
    try {
      await userService.changeVaultPin(data.currentPin, data.newPin);
      toast.success('Vault PIN changed successfully');
      resetPin();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Security Settings</h1>
          <p className="text-slate-500 mt-1">Manage your password, Vault PIN, and authentication settings.</p>
        </div>

        {/* Change Password */}
        <div className="glass rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-100 text-primary rounded-xl flex items-center justify-center">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
              <p className="text-sm text-slate-500">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPw(onPasswordSubmit)} className="space-y-6 max-w-md">
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

            <Button type="submit" isLoading={isChangingPassword}>Update Password</Button>
          </form>
        </div>

        {/* Change Vault PIN */}
        <div className="glass rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Change Vault PIN</h2>
              <p className="text-sm text-slate-500">Update the 6-digit PIN used to decrypt your documents</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPin(onPinSubmit)} className="space-y-6 max-w-md">
            <Input
              label="Current PIN"
              type="password"
              maxLength={6}
              icon={ShieldCheck}
              error={errorsPin.currentPin?.message}
              placeholder="••••••"
              {...registerPin('currentPin', { 
                required: 'Current PIN is required',
                pattern: { value: /^\d{6}$/, message: 'PIN must be exactly 6 digits' }
              })}
            />
            
            <Input
              label="New PIN"
              type="password"
              maxLength={6}
              icon={ShieldCheck}
              error={errorsPin.newPin?.message}
              placeholder="••••••"
              {...registerPin('newPin', { 
                required: 'New PIN is required',
                pattern: { value: /^\d{6}$/, message: 'PIN must be exactly 6 digits' }
              })}
            />

            <Button type="submit" isLoading={isChangingPin} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30">
              Update Vault PIN
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
